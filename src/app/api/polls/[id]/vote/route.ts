import { NextResponse, userAgent } from 'next/server';
import prisma from '@/lib/prisma';
import { getClientIP, lookupIP } from '@/lib/geo';
import jwt from 'jsonwebtoken';
import { sendVoteConfirmationEmail } from '@/lib/nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pollstar-2026-auth-access';

// A in-memory tracking structure to simulate the concurrent voting collision rule:
// "if two people try to vote like that (same ISP/IP) at same time show error for both and tell the reason they are trying together"
const activeCastingRegistry = new Map<string, { timestamp: number; voterEmail?: string }>();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const body = await req.json();
    const { answers, captchaResponse, voterToken, email: openEmail, latitude, longitude, device, confidenceValues } = body;

    // 1. Bulletproof Device detection using Client body, Next.js userAgent, and Vercel edge headers
    const ua = userAgent(req);
    const vercelDevice = req.headers.get('x-vercel-device-type') || '';
    const isMobileUA = ua.device.type === 'mobile' || ua.device.type === 'tablet' || vercelDevice === 'mobile' || vercelDevice === 'tablet' || /Mobi|Android|iPhone|iPad|iPod|BlackBerry/i.test(ua.ua || '');
    const resolvedDevice = (device === 'Mobile' || isMobileUA) ? 'Mobile' : 'Desktop';

    // 2. High-Fidelity Geolocation using Client high-accuracy GPS, Vercel edge headers, and backup Geo-IP
    const vercelLat = req.headers.get('x-vercel-ip-latitude');
    const vercelLon = req.headers.get('x-vercel-ip-longitude');
    
    const parseCoord = (val: any) => {
      if (val === null || val === undefined || val === '') return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    // 3. Core checks
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { settings: true, questions: { include: { options: true } } },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This poll is not currently open for voting.' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Auto-expire: if endTime has passed, transition to ENDED and reject
    if (poll.endTime && now > new Date(poll.endTime)) {
      await prisma.poll.update({
        where: { id: pollId },
        data: { status: 'ENDED' },
      });
      return NextResponse.json(
        { error: 'This poll has officially ended. Voting is no longer accepted.' },
        { status: 400 }
      );
    }

    if (now < new Date(poll.startTime)) {
      return NextResponse.json(
        { error: 'Voting has not started yet. Please wait for the scheduled start time.' },
        { status: 400 }
      );
    }

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
    }

    if (poll.settings?.enableRankCompleteness && poll.settings.rankedCompletenessRule !== 'PARTIAL') {
      for (const question of poll.questions.filter((q) => q.type === 'RANKED')) {
        const ranking = answers[question.id];
        if (!Array.isArray(ranking)) {
          return NextResponse.json({ error: 'Ranked ballot is incomplete.' }, { status: 400 });
        }

        const requiredCount = poll.settings.rankedCompletenessRule === 'FULL'
          ? question.options.length
          : Math.min(3, question.options.length);

        if (ranking.length < requiredCount) {
          return NextResponse.json(
            { error: `Ranked ballot requires at least ${requiredCount} ranked choice${requiredCount === 1 ? '' : 's'}.` },
            { status: 400 }
          );
        }
      }
    }

    // Validate Quadratic Voting
    for (const question of poll.questions.filter((q) => q.type === 'SINGLE')) {
      if (poll.settings?.enableQuadraticVoting) {
        const qvAlloc = answers[question.id];
        if (typeof qvAlloc !== 'object' || qvAlloc === null) {
          return NextResponse.json({ error: 'Quadratic voting allocation must be a valid distribution object.' }, { status: 400 });
        }
        let sumSquaredPoints = 0;
        for (const option of question.options) {
          const votes = qvAlloc[option.id] || 0;
          if (!Number.isInteger(votes) || votes < 0) {
            return NextResponse.json({ error: 'Vote allocation counts must be non-negative integers.' }, { status: 400 });
          }
          sumSquaredPoints += votes * votes;
        }
        if (sumSquaredPoints > 100) {
          return NextResponse.json({ error: `Quadratic voting allocation of ${sumSquaredPoints} points exceeds the 100 points budget.` }, { status: 400 });
        }
      }
    }

    // Resolve client IP and ISP metadata
    const ipAddress = getClientIP(req);
    const geoData = await lookupIP(ipAddress);
    const ispName = geoData.isp || 'Unknown ISP';

    // 2. Closed vs Open voter authentication details
    let voterIdentifier: string | null = null;
    let voterEmail: string | null = null;
    let allowedVoterId: string | null = null;

    if (!poll.isOpenVoting) {
      // Must supply voterToken for closed voting
      if (!voterToken) {
        return NextResponse.json({ error: 'Voter authentication token is missing' }, { status: 401 });
      }

      try {
        const decoded = jwt.verify(voterToken, JWT_SECRET) as any;
        if (decoded.pollId !== pollId) {
          return NextResponse.json({ error: 'Invalid token for this poll' }, { status: 403 });
        }
        allowedVoterId = decoded.voterId;
        voterIdentifier = decoded.identifier;
        voterEmail = decoded.email;
      } catch (err) {
        return NextResponse.json({ error: 'Voter verification session has expired. Please log in again.' }, { status: 401 });
      }

      // Check if they already voted in AllowedVoter registry
      const allowedVoter = await prisma.allowedVoter.findUnique({
        where: { id: allowedVoterId! },
      });

      if (!allowedVoter) {
        return NextResponse.json({ error: 'Voter not found in allowed registry' }, { status: 404 });
      }

      if (allowedVoter.voted) {
        return NextResponse.json({ error: 'Your vote has already been submitted.' }, { status: 403 });
      }
    } else {
      // Open voting email
      voterEmail = openEmail || null;
      voterIdentifier = voterEmail ? voterEmail.split('@')[0] : 'Guest';
    }

    // 3. Concurrency Check (ISP WiFi Clashing)
    // "if two people try to vote like that at same time show error for both and tell the reason they are trying together"
    const concurrentRegistryKey = `${pollId}-${ispName}`;
    const concurrentAttempt = activeCastingRegistry.get(concurrentRegistryKey);

    if (concurrentAttempt && (Date.now() - concurrentAttempt.timestamp < 3000)) {
      // A collision within 3 seconds! Raise collision errors for both
      return NextResponse.json(
        {
          error: 'ISP Concurrency Collision!',
          reason: `We detected that another voter at your location is submitting a vote at the exact same second using the same Internet Service Provider (ISP: ${ispName}). Please coordinate and try again in a few moments.`,
        },
        { status: 429 }
      );
    }

    // Register active casting
    activeCastingRegistry.set(concurrentRegistryKey, {
      timestamp: Date.now(),
      voterEmail: voterEmail || undefined,
    });

    // 4. Restrictions checking & Flagging Suspicious
    let flaggedSuspicious = false;

    // 4. Restrictions checking
    // Check Limit 1: Duplicate email/user
    if (poll.settings?.limitOneVotePerUser && voterEmail) {
      const duplicateVote = await prisma.vote.findFirst({
        where: {
          pollId,
          email: { equals: voterEmail, mode: 'insensitive' },
        },
      });
      if (duplicateVote) {
        return NextResponse.json(
          { error: 'Duplicate Ballot Blocked: You have already cast a vote in this poll.' },
          { status: 403 }
        );
      }
    }

    // Advanced Allowed Domains check
    if (voterEmail && poll.description) {
      const domainMatch = poll.description.match(/\[domains:\s*([^\]]+)\]/i);
      if (domainMatch) {
        const allowedDomains = domainMatch[1].split(',').map((d: string) => d.trim().toLowerCase());
        const voterDomain = voterEmail.split('@')[1]?.toLowerCase();
        if (!allowedDomains.includes(voterDomain)) {
          return NextResponse.json(
            { error: `Authorized Domains Restriction: Only email addresses ending with ${allowedDomains.join(', ')} are eligible to vote.` },
            { status: 403 }
          );
        }
      }
    }

    // Advanced Geofencing check
    if (poll.description) {
      const geoMatch = poll.description.match(/\[geolock:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(\d+)\s*\]/i);
      if (geoMatch) {
        const targetLat = parseFloat(geoMatch[1]);
        const targetLon = parseFloat(geoMatch[2]);
        const targetRadius = parseInt(geoMatch[3]);

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          return NextResponse.json(
            { error: 'Geofence Restriction: This ballot requires active geolocation coordinates to cast. Please enable browser location services and try again.' },
            { status: 403 }
          );
        }

        const R = 6371; // km
        const dLat = (latitude - targetLat) * Math.PI / 180;
        const dLon = (longitude - targetLon) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(targetLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        if (distance > targetRadius) {
          return NextResponse.json(
            { error: `Geofence Restriction: Access Denied. You are ${Math.round(distance)}km away, but this ballot is strictly geofenced to within a ${targetRadius}km radius.` },
            { status: 403 }
          );
        }
      }
    }

    // Check Limit 2: Duplicate IP (Device Uniqueness)
    const isLoopbackIP = ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('127.');
    if (poll.settings?.limitOneVotePerIP && !isLoopbackIP) {
      const duplicateIP = await prisma.vote.findFirst({
        where: { pollId, ipAddress: geoData.ip },
      });
      if (duplicateIP) {
        return NextResponse.json(
          { error: 'Device Uniqueness Restriction: A ballot has already been recorded from this device/IP address.' },
          { status: 403 }
        );
      }
    }

    // Check Limit 3: Duplicate ISP (ISP Network Uniqueness)
    const isGenericISP = ispName === 'Unknown ISP' || ispName.toLowerCase().includes('google') || ispName.toLowerCase().includes('cloudflare') || ispName.toLowerCase().includes('local');
    if (poll.settings?.limitOneVotePerISP && !isGenericISP) {
      const duplicateISP = await prisma.vote.findFirst({
        where: { pollId, isp: ispName },
      });
      if (duplicateISP) {
        return NextResponse.json(
          { error: 'ISP Network Uniqueness Restriction: A ballot has already been cast using this network/ISP connection.' },
          { status: 403 }
        );
      }
    }

    // 5. Submit Vote within a transaction to guarantee atomic increments
    const savedVote = await prisma.$transaction(async (tx) => {
      // Create Vote record
      const vote = await tx.vote.create({
        data: {
          pollId,
          userIdentifier: voterIdentifier,
          email: voterEmail,
          ipAddress: geoData.ip, // Save resolved unique IP (e.g. 8.8.8.8) to prevent ::1
          isp: ispName,
          device: resolvedDevice,
          answers: JSON.stringify({ ...answers, __confidence: confidenceValues || null }),
          flaggedSuspicious: false,
          latitude: parseCoord(latitude) ?? (vercelLat ? parseFloat(vercelLat) : (geoData.lat !== 0 ? geoData.lat : null)),
          longitude: parseCoord(longitude) ?? (vercelLon ? parseFloat(vercelLon) : (geoData.lon !== 0 ? geoData.lon : null)),
        },
      });

      // Update allowed voter voted state
      if (!poll.isOpenVoting && allowedVoterId) {
        await tx.allowedVoter.update({
          where: { id: allowedVoterId },
          data: { voted: true },
        });
      }

      return vote;
    });

    // Dispatch Vote Confirmation / Receipt Email
    if (voterEmail) {
      try {
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host') || 'localhost:3000';
        const resultsUrl = `${protocol}://${host}/poll/${pollId}`;
        sendVoteConfirmationEmail({
          email: voterEmail,
          pollTitle: poll.title,
          voteId: savedVote.id,
          resultsUrl,
        }).catch((e) => console.error('Failed to send vote confirmation email:', e));
      } catch (err) {
        console.error('Failed to send vote confirmation email:', err);
      }
    }

    // Clear registry after successful submit
    setTimeout(() => activeCastingRegistry.delete(concurrentRegistryKey), 3000);

    // 6. WebSocket Live Update Broadcast
    if ((global as any).io) {
      // Re-fetch updated aggregated statistics for real-time charts
      const questions = await prisma.question.findMany({
        where: { pollId },
        include: { options: true },
      });
      const allVotes = await prisma.vote.findMany({
        where: { pollId },
      });

      const stats: Record<string, any> = {};
      questions.forEach((q) => {
        stats[q.id] = {};
        q.options.forEach((o) => {
          stats[q.id][o.id] = { text: o.text, count: 0 };
        });
      });

      allVotes.forEach((v) => {
        try {
          const ans = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
          Object.keys(ans).forEach((qId) => {
            const val = ans[qId];
            const question = questions.find((q) => q.id === qId);

            if (question) {
              if (question.type === 'RANKED' && Array.isArray(val)) {
                const numOpts = question.options.length;
                val.forEach((optId: string, idx: number) => {
                  if (stats[qId] && stats[qId][optId]) {
                    stats[qId][optId].count += numOpts - idx;
                  }
                });
              } else if (question.type === 'SINGLE') {
                if (typeof val === 'string') {
                  if (stats[qId] && stats[qId][val]) {
                    stats[qId][val].count += 1;
                  }
                } else if (typeof val === 'object' && val !== null) {
                  Object.entries(val).forEach(([optId, votesCount]) => {
                    if (stats[qId] && stats[qId][optId]) {
                      stats[qId][optId].count += Number(votesCount) || 0;
                    }
                  });
                }
              } else if (question.type === 'KNOCKOUT' && val && typeof val.winner === 'string') {
                if (stats[qId] && stats[qId][val.winner]) {
                  stats[qId][val.winner].count += 1;
                }
              }
            }
          });
        } catch (e) {
          console.error(e);
        }
      });

      (global as any).io.to(`poll-${pollId}`).emit('vote-cast', {
        stats,
        totalVotes: allVotes.length,
        newVote: {
          ipAddress: savedVote.ipAddress,
          isp: savedVote.isp,
          lat: geoData.lat,
          lon: geoData.lon,
          city: geoData.city,
          country: geoData.country,
          flaggedSuspicious: savedVote.flaggedSuspicious,
          createdAt: savedVote.createdAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Vote submitted successfully!',
      flaggedSuspicious,
      geo: geoData,
    });
  } catch (error: any) {
    console.error('Submit Vote API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
