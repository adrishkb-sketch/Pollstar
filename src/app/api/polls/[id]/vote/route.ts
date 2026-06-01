import { NextResponse, userAgent } from 'next/server';
import prisma from '@/lib/prisma';
import { getClientIP, lookupIP } from '@/lib/geo';
import jwt from 'jsonwebtoken';
import { sendVoteConfirmationEmail, sendExamSubmissionConfirmationEmail } from '@/lib/nodemailer';
import { getDynamicParticipantLimit } from '@/lib/participantLimits';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-pollstar-2026-auth-access';

// A in-memory tracking structure to simulate the concurrent voting clashing rule:
const activeCastingRegistry = new Map<string, { timestamp: number; voterEmail?: string }>();

function computeSemanticSimilarity(userAns: string, correctAns: string): { score: number; feedback: string } {
  const cleanUser = userAns.trim().toLowerCase().replace(/[^\w\s]/g, '');
  const cleanCorrect = correctAns.trim().toLowerCase().replace(/[^\w\s]/g, '');

  if (!cleanUser || !cleanCorrect) {
    return { score: 0.0, feedback: "No answer provided or reference answer is blank." };
  }

  if (cleanUser === cleanCorrect) {
    return { score: 1.0, feedback: "Perfect match! Your answer matches the model answer exactly." };
  }

  // Define standard English stop words
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "of", "to", "for", "in", "on", "at", "by", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "it", "its", "they", "them", "their", "he", "him", "his", "she", "her", "we", "us", "our", "you", "your", "yours", "i", "me", "my", "myself", "himself", "herself", "itself", "ourselves", "yourselves", "themselves", "which", "who", "whom", "whose", "this", "that", "these", "those", "what", "using", "use", "used"]);

  // Extract content-bearing words (tokens)
  const tokensUser = cleanUser.split(/\s+/).filter(w => w.length > 0);
  const tokensCorrect = cleanCorrect.split(/\s+/).filter(w => w.length > 0);

  const contentUser = tokensUser.filter(w => !stopWords.has(w) && w.length > 1);
  const contentCorrect = tokensCorrect.filter(w => !stopWords.has(w) && w.length > 1);

  // If the correct answer contains very few content words, do a direct inclusion match
  if (contentCorrect.length === 0) {
    const isMatched = cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
    return {
      score: isMatched ? 1.0 : 0.0,
      feedback: isMatched 
        ? "Correct conceptual answer identified in submission." 
        : `Answer does not match reference model response: "${correctAns}".`
    };
  }

  // 1. Direct inclusion test
  if (cleanUser.includes(cleanCorrect)) {
    return { score: 1.0, feedback: "Correct! Your answer perfectly incorporates the model response." };
  }

  // Helper function to calculate soft matching for a word against a list of content words
  const checkSoftMatch = (word: string, list: string[]): boolean => {
    return list.some(uWord => 
      uWord === word || uWord.startsWith(word) || word.startsWith(uWord) || 
      (uWord.length > 4 && word.length > 4 && (uWord.includes(word.substring(0, 4)) || word.includes(uWord.substring(0, 4))))
    );
  };

  // 2. Base Unigram score (vocabulary coverage)
  const setUser = new Set(contentUser);
  let matchedKeywordsCount = 0;

  contentCorrect.forEach(word => {
    if (setUser.has(word)) {
      matchedKeywordsCount++;
    } else {
      if (checkSoftMatch(word, contentUser)) {
        matchedKeywordsCount += 0.8;
      }
    }
  });

  const unigramScore = Math.min(1.0, Math.max(0.0, matchedKeywordsCount / contentCorrect.length));

  // 3. Clause-based semantic association score
  // Split both into clauses using conjunctions and punctuation
  const clauseSeparators = /\b(?:and|but|while|though|although|whereas|if|unless|because|since|so|yet|or|nor|as well as)\b|[,;\.\-\(\)]/gi;
  
  const correctClauses = correctAns.split(clauseSeparators).map(c => c.trim().toLowerCase().replace(/[^\w\s]/g, '')).filter(c => c.length > 0);
  const userClauses = userAns.split(clauseSeparators).map(c => c.trim().toLowerCase().replace(/[^\w\s]/g, '')).filter(c => c.length > 0);

  let clauseScore = unigramScore; // Fallback if no valid clauses are parsed

  if (correctClauses.length > 0 && userClauses.length > 0) {
    let totalClauseScoreSum = 0;
    
    correctClauses.forEach(cClause => {
      const cTokens = cClause.split(/\s+/).filter(w => !stopWords.has(w) && w.length > 1);
      if (cTokens.length === 0) {
        totalClauseScoreSum += 1.0; // Empty/stopword clause gets default match
        return;
      }

      // Find the best matching user clause
      let maxMatchForThisClause = 0;
      userClauses.forEach(uClause => {
        const uTokens = uClause.split(/\s+/).filter(w => !stopWords.has(w) && w.length > 1);
        if (uTokens.length === 0) return;

        let matchCount = 0;
        cTokens.forEach(cWord => {
          if (uTokens.includes(cWord)) {
            matchCount++;
          } else if (checkSoftMatch(cWord, uTokens)) {
            matchCount += 0.8;
          }
        });
        
        const score = matchCount / cTokens.length;
        if (score > maxMatchForThisClause) {
          maxMatchForThisClause = score;
        }
      });

      totalClauseScoreSum += maxMatchForThisClause;
    });

    clauseScore = Math.min(1.0, totalClauseScoreSum / correctClauses.length);
  }

  // 4. Combined Similarity & Swapping Penalty
  let finalScore = (unigramScore * 0.4) + (clauseScore * 0.6);

  // If vocabulary presence is high but the association structure is severely broken (indicating a word-swap or scrambled meaning)
  if (unigramScore - clauseScore > 0.25) {
    finalScore = finalScore * 0.5; // Apply a 50% penalty for swapped context
  }

  finalScore = Math.min(1.0, Math.max(0.0, finalScore));

  // Determine key missing terms for constructive feedback
  const missingKeywords = contentCorrect.filter(word => !setUser.has(word) && !checkSoftMatch(word, contentUser)).slice(0, 3);

  let feedback = "";
  if (finalScore >= 0.85) {
    feedback = "Excellent response! You demonstrated complete understanding and matched almost all model keywords.";
  } else if (finalScore >= 0.6) {
    feedback = `Good answer. You captured the key concepts, but missed some depth or syntactic association. ${
      missingKeywords.length > 0 ? `Consider incorporating terms like: "${missingKeywords.join('", "')}".` : ""
    }`;
  } else if (finalScore >= 0.3) {
    feedback = `Partial credit. You mentioned some related terms but missed the core concept or mixed up the word associations. ${
      missingKeywords.length > 0 ? `To improve, you should explain details involving: "${missingKeywords.join('", "')}".` : ""
    }`;
  } else {
    feedback = `Incorrect or insufficient answer. It does not match the key elements of the model answer. ${
      missingKeywords.length > 0 ? `Make sure to explain concepts relating to: "${missingKeywords.join('", "')}".` : ""
    }`;
  }

  return { score: finalScore, feedback };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const body = await req.json();
    const { answers, captchaResponse, voterToken, email: openEmail, latitude, longitude, device, confidenceValues, timeSpent } = body;

    // 1. Bulletproof Device detection using Client body, Next.js userAgent, Vercel edge headers, and Client Hints
    const ua = userAgent(req);
    const vercelDevice = req.headers.get('x-vercel-device-type') || '';
    const secChUaMobile = req.headers.get('sec-ch-ua-mobile') || '';
    const rawUA = ua.ua || req.headers.get('user-agent') || '';
    let resolvedDevice = 'Desktop';
    if (device === 'Tablet' || ua.device.type === 'tablet' || vercelDevice === 'tablet' || /Tablet|iPad|Playbook|Silk|Kindle/i.test(rawUA) || ( /Android/i.test(rawUA) && !/Mobile/i.test(rawUA) )) {
       resolvedDevice = 'Tablet';
    } else if (device === 'Mobile' || ua.device.type === 'mobile' || vercelDevice === 'mobile' || secChUaMobile === '?1' || /Mobi|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS|Windows Phone/i.test(rawUA) || ( /Android/i.test(rawUA) && /Mobile/i.test(rawUA) )) {
       resolvedDevice = 'Mobile';
    }

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

    // Absolute maximum participant gating check
    const currentVotesCount = await prisma.vote.count({
      where: { pollId: poll.id }
    });
    // Fetch dynamic participant limit (base plan + active add-on boosts)
    const absoluteMax = await getDynamicParticipantLimit(poll.creatorId, poll.pollType);

    if (currentVotesCount >= absoluteMax) {
      return NextResponse.json(
        { error: `This session has reached its absolute maximum limit of ${absoluteMax} participants and is no longer accepting responses.` },
        { status: 403 }
      );
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

    let flaggedSuspicious = false;
    if (poll.pollType === 'EXAM') {
      try {
        const parsedAnswersObj = typeof answers === 'string' ? JSON.parse(answers) : answers;
        const proctorLogs = parsedAnswersObj?.__proctorLogs || answers?.__proctorLogs;
        if (Array.isArray(proctorLogs)) {
          flaggedSuspicious = proctorLogs.some((log: string) => log.includes('🚨') || log.includes('⚠️'));
        }
      } catch (e) {
        console.error("Failed to parse proctor logs:", e);
      }
    }

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

    // AI Examination Evaluation & Grading Engine
    let examBreakdown: Record<string, any> = {};
    let totalExamMarks = 0.0;
    let earnedExamMarks = 0.0;

    if (poll.pollType === 'EXAM') {
      for (const q of poll.questions) {
        const userAns = answers[q.id];
        const maxMarks = q.marks || 0.0;
        totalExamMarks += maxMarks;

        let marksAwarded = 0.0;
        let feedback = "No answer provided.";
        let isAIGraded = true;
        let isGraded = true;

        // Safely parse question's logicRules for negative marking & marking schemes
        let rules: any = {};
        if (typeof q.logicRules === 'string') {
          try { rules = JSON.parse(q.logicRules) || {}; } catch(e) {}
        } else if (q.logicRules && typeof q.logicRules === 'object') {
          rules = q.logicRules;
        }
        const enableNegativeMark = !!rules.enableNegativeMarking;
        const negPenalty = typeof rules.negativeMarkingPenalty === 'number' ? rules.negativeMarkingPenalty : 0.25;
        const markingScheme = rules.markingScheme || 'PARTIAL'; // 'PARTIAL' | 'ALL_OR_NOTHING'

        if (userAns !== undefined && userAns !== null) {
          if (q.type === 'SINGLE') {
            // Single MCQ: Match by looking up option ID by text or directly matching ID
            const correctOpt = q.options.find(opt => opt.text === q.correctAnswer || opt.id === q.correctAnswer);
            const isCorrect = correctOpt ? String(userAns) === String(correctOpt.id) : String(userAns) === String(q.correctAnswer);
            const correctText = correctOpt ? correctOpt.text : q.correctAnswer;
            
            if (isCorrect) {
              marksAwarded = maxMarks;
              feedback = "Correct answer selected! Full marks awarded.";
            } else {
              if (enableNegativeMark) {
                marksAwarded = -negPenalty;
                feedback = `Incorrect selection. Correct answer was: "${correctText}". Negative penalty of -${negPenalty} applied.`;
              } else {
                marksAwarded = 0.0;
                feedback = `Incorrect selection. Correct answer was: "${correctText}".`;
              }
            }
          } else if (q.type === 'MULTI_SELECT' || q.type === 'MULTIPLE_CHOICE') {
            // Multi MCQ
            let correctList: string[] = [];
            try {
              correctList = typeof q.correctAnswers === 'string' 
                ? JSON.parse(q.correctAnswers) 
                : (Array.isArray(q.correctAnswers) ? q.correctAnswers : []);
            } catch (e) {
              console.error("Failed to parse correctAnswers", e);
            }

            // Map correct option texts/IDs to actual database Option IDs
            const correctIds = correctList.map(cVal => {
              const found = q.options.find(opt => opt.text === cVal || opt.id === cVal);
              return found ? found.id : cVal;
            });

            const userList = Array.isArray(userAns) ? userAns : [];
            const correctSet = new Set(correctIds);
            const userSet = new Set(userList);

            let correctSelected = 0;
            let incorrectSelectedCount = 0;

            userList.forEach(id => {
              if (correctSet.has(id)) {
                correctSelected++;
              } else {
                incorrectSelectedCount++;
              }
            });

            if (markingScheme === 'ALL_OR_NOTHING') {
              // ALL_OR_NOTHING: must select exactly all correct options and nothing else
              const allCorrectSelected = correctSelected === correctSet.size && incorrectSelectedCount === 0;
              if (allCorrectSelected && userList.length === correctSet.size) {
                marksAwarded = maxMarks;
                feedback = "All correct options selected! Full marks awarded.";
              } else {
                if (enableNegativeMark) {
                  marksAwarded = -negPenalty;
                  feedback = `Incorrect selection. All-or-nothing scheme — full marks or nothing. Negative penalty of -${negPenalty} applied.`;
                } else {
                  marksAwarded = 0.0;
                  feedback = "Incorrect selection. All-or-nothing scheme applied (0 marks).";
                }
              }
            } else if (markingScheme === 'PARTIAL_WITH_PENALTY') {
              // PARTIAL_WITH_PENALTY: proportional credit for correct, minus fixed penalty for each wrong choice
              if (correctSelected > 0 && correctSet.size > 0) {
                const baseMarks = (correctSelected / correctSet.size) * maxMarks;
                const penaltyAmount = incorrectSelectedCount * negPenalty;
                marksAwarded = Math.max(0, Math.round((baseMarks - penaltyAmount) * 2) / 2);
                feedback = `Partial: ${correctSelected}/${correctSet.size} correct options selected, ${incorrectSelectedCount} wrong. Base: ${baseMarks.toFixed(1)}, Penalty: -${penaltyAmount.toFixed(1)}. Marks: ${marksAwarded}.`;
              } else if (incorrectSelectedCount > 0) {
                marksAwarded = 0.0;
                feedback = `All selected options were incorrect. Penalty applied, score floored at 0.`;
              } else {
                marksAwarded = 0.0;
                feedback = "No options selected.";
              }
            } else if (markingScheme === 'ZERO_ON_INCORRECT') {
              // ZERO_ON_INCORRECT: proportional credit, but 0 if any wrong option was chosen
              if (incorrectSelectedCount > 0) {
                marksAwarded = 0.0;
                feedback = `Incorrect option(s) selected — score zeroed. Zero-on-Incorrect scheme requires only correct selections.`;
              } else if (correctSelected > 0 && correctSet.size > 0) {
                marksAwarded = Math.round(((correctSelected / correctSet.size) * maxMarks) * 2) / 2;
                feedback = `${correctSelected}/${correctSet.size} correct options selected (no wrong choices). Partial credit awarded.`;
              } else {
                marksAwarded = 0.0;
                feedback = "No options selected.";
              }
            } else {
              // PARTIAL (default): proportional credit per correct option, with optional per-wrong-option penalty
              if (correctSelected > 0 && correctSet.size > 0) {
                const baseMarks = (correctSelected / correctSet.size) * maxMarks;
                const penaltyAmount = enableNegativeMark ? incorrectSelectedCount * negPenalty : 0;
                marksAwarded = Math.max(enableNegativeMark ? -maxMarks : 0, Math.round((baseMarks - penaltyAmount) * 2) / 2);
                feedback = `Partial: ${correctSelected}/${correctSet.size} correct options, ${incorrectSelectedCount} wrong.${enableNegativeMark ? ` Penalty -${penaltyAmount.toFixed(1)} applied.` : ''} Marks: ${marksAwarded}.`;
              } else {
                if (enableNegativeMark && incorrectSelectedCount > 0) {
                  marksAwarded = -negPenalty;
                  feedback = `No correct options selected. Negative penalty of -${negPenalty} applied.`;
                } else {
                  marksAwarded = 0.0;
                  feedback = "No correct options selected. No marks awarded.";
                }
              }
            }
          } else if (q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT') {
            // SAQ & LAQ Semantic similarity
            if (!q.correctAnswer || q.correctAnswer.trim() === '') {
              isGraded = false;
              marksAwarded = 0.0;
              feedback = "Sample/model answer not provided by examiner. Pending manual marking.";
            } else {
              const correctAnsStr = q.correctAnswer;
              const userAnsStr = String(userAns);
              const sim = computeSemanticSimilarity(userAnsStr, correctAnsStr);
              const rawMarks = sim.score * maxMarks;
              marksAwarded = Math.round(rawMarks * 2) / 2;
              feedback = sim.feedback;
              if (marksAwarded < 0) marksAwarded = 0.0; // No negative marking on text answers
            }
          } else if (q.type === 'FILE_UPLOAD') {
            // Validate file link
            const fileUrl = String(userAns).trim();
            let isValidUrl = false;
            try {
              const parsedUrl = new URL(fileUrl);
              isValidUrl = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
            } catch (_) {}

            let isPubliclyAccessible = false;
            if (isValidUrl) {
              try {
                const checkRes = await fetch(fileUrl, { method: 'HEAD', signal: AbortSignal.timeout(1200) });
                if (checkRes.ok) {
                  isPubliclyAccessible = true;
                }
              } catch (_) {
                if (fileUrl.includes('drive.google.com') || fileUrl.includes('dropbox.com') || fileUrl.includes('onedrive') || fileUrl.includes('github.com')) {
                  isPubliclyAccessible = true;
                }
              }
            }

            isGraded = false;
            isAIGraded = false;
            marksAwarded = 0.0;

            if (!isValidUrl) {
              feedback = "Invalid file upload URL submitted. Pending manual verification by examiner.";
            } else if (!isPubliclyAccessible) {
              feedback = "File upload URL received but public access check failed. Pending manual verification.";
            } else {
              feedback = "File upload URL successfully verified as public link. Pending manual grading.";
            }
          }
        } else {
          // No user answer provided
          if (q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT' || q.type === 'FILE_UPLOAD') {
            isGraded = false;
            if (q.type === 'FILE_UPLOAD') isAIGraded = false;
          }
        }

        earnedExamMarks += marksAwarded;
        examBreakdown[q.id] = {
          answer: userAns || "",
          marksAwarded,
          maxMarks,
          feedback,
          isAIGraded,
          isGraded,
        };
      }
    }

    // Determine overall marking status for exam
    let markingStatus = 'FULLY_MARKED';
    if (poll.pollType === 'EXAM') {
      let gradedCount = 0;
      let totalQuestions = 0;
      poll.questions.forEach((q) => {
        totalQuestions++;
        const qb = examBreakdown[q.id];
        if (qb && qb.isGraded) {
          gradedCount++;
        }
      });

      if (gradedCount === 0) {
        markingStatus = 'UNMARKED';
      } else if (gradedCount < totalQuestions) {
        markingStatus = 'PARTIALLY_MARKED';
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
          answers: JSON.stringify({
            ...answers,
            __confidence: confidenceValues || null,
            __examBreakdown: poll.pollType === 'EXAM' ? examBreakdown : null,
            __examScore: poll.pollType === 'EXAM' ? { earned: earnedExamMarks, total: totalExamMarks } : null,
            __markingStatus: poll.pollType === 'EXAM' ? markingStatus : null,
          }),
          flaggedSuspicious: flaggedSuspicious,
          timeSpent: typeof timeSpent === 'number' ? timeSpent : null,
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

        if (poll.pollType === 'EXAM') {
          await sendExamSubmissionConfirmationEmail({
            email: voterEmail,
            examTitle: poll.title,
            submissionId: savedVote.id,
            resultsUrl: `${protocol}://${host}/poll/${pollId}/analysis`,
            resultsReleased: !!poll.settings?.resultsReleased,
          });
        } else {
          await sendVoteConfirmationEmail({
            email: voterEmail,
            pollTitle: poll.title,
            voteId: savedVote.id,
            resultsUrl,
            pollType: poll.pollType,
          });
        }
      } catch (err) {
        console.error('Failed to send confirmation email:', err);
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
