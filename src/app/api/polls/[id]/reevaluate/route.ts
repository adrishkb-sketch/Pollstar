import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  let payload = token ? verifyAccessToken(token) : null;

  if (!payload && refreshToken) {
    const refreshPayload = verifyRefreshToken(refreshToken);
    if (refreshPayload) {
      payload = {
        userId: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
      };
    }
  }

  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
  });
}

function computeSemanticSimilarity(userAns: string, correctAns: string): { score: number; feedback: string } {
  const cleanUser = userAns.trim().toLowerCase().replace(/[^\w\s]/g, '');
  const cleanCorrect = correctAns.trim().toLowerCase().replace(/[^\w\s]/g, '');

  if (!cleanUser || !cleanCorrect) {
    return { score: 0.0, feedback: "No answer provided or reference answer is blank." };
  }

  if (cleanUser === cleanCorrect) {
    return { score: 1.0, feedback: "Perfect match! Your answer matches the model answer exactly." };
  }

  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "of", "to", "for", "in", "on", "at", "by", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "it", "its", "they", "them", "their", "he", "him", "his", "she", "her", "we", "us", "our", "you", "your", "yours", "i", "me", "my", "myself", "himself", "herself", "itself", "ourselves", "yourselves", "themselves"]);

  const tokensUser = cleanUser.split(/\s+/).filter(w => w.length > 0);
  const tokensCorrect = cleanCorrect.split(/\s+/).filter(w => w.length > 0);

  const contentUser = tokensUser.filter(w => !stopWords.has(w) && w.length > 1);
  const contentCorrect = tokensCorrect.filter(w => !stopWords.has(w) && w.length > 1);

  if (contentCorrect.length === 0) {
    const isMatched = cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);
    return {
      score: isMatched ? 1.0 : 0.0,
      feedback: isMatched 
        ? "Correct conceptual answer identified in submission." 
        : `Answer does not match reference model response: "${correctAns}".`
    };
  }

  if (cleanUser.includes(cleanCorrect)) {
    return { score: 1.0, feedback: "Correct! Your answer perfectly incorporates the model response." };
  }

  const setUser = new Set(contentUser);
  let matchedKeywordsCount = 0;

  contentCorrect.forEach(word => {
    if (setUser.has(word)) {
      matchedKeywordsCount++;
    } else {
      const softMatch = contentUser.some(uWord => 
        uWord.startsWith(word) || word.startsWith(uWord) || 
        (uWord.length > 4 && word.length > 4 && (uWord.includes(word.substring(0, 4)) || word.includes(uWord.substring(0, 4))))
      );
      if (softMatch) {
        matchedKeywordsCount += 0.8;
      }
    }
  });

  const keywordCoverage = matchedKeywordsCount / contentCorrect.length;
  const finalScore = Math.min(1.0, Math.max(0.0, keywordCoverage));

  const missingKeywords = contentCorrect.filter(word => !setUser.has(word)).slice(0, 3);

  let feedback = "";
  if (finalScore >= 0.85) {
    feedback = "Excellent response! You demonstrated complete understanding and matched almost all model keywords.";
  } else if (finalScore >= 0.6) {
    feedback = `Good answer. You captured the key concepts, but missed some depth. ${
      missingKeywords.length > 0 ? `Consider incorporating terms like: "${missingKeywords.join('", "')}".` : ""
    }`;
  } else if (finalScore >= 0.3) {
    feedback = `Partial credit. You mentioned some related terms but missed the core concept. ${
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
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        settings: true,
        questions: true,
        votes: true,
      },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Only creator or admin can trigger reevaluation
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if exam is finalized
    let examMeta: any = {};
    if (poll.settings?.postEmailMessage) {
      try {
        examMeta = JSON.parse(poll.settings.postEmailMessage);
      } catch (e) {}
    }

    if (examMeta.isFinalPublished) {
      return NextResponse.json(
        { error: 'This exam has been finalized and published. Grades can no longer be modified.' },
        { status: 400 }
      );
    }

    let reevaluatedCount = 0;

    // Process and regrade votes
    const updatePromises = poll.votes.map(async (v) => {
      let answersObj: any = {};
      try {
        answersObj = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers;
      } catch (e) {
        return;
      }

      const breakdown = answersObj.__examBreakdown || {};
      let answersChanged = false;

      poll.questions.forEach((q) => {
        // Only Short/Long Text answers can be semantic-similarity regraded
        if (q.type !== 'SHORT_TEXT' && q.type !== 'LONG_TEXT') return;

        const qb = breakdown[q.id];
        // If teacher manually overrode, skip!
        if (qb && qb.isOverridden) return;

        const correctAnsStr = q.correctAnswer || '';
        const userAns = qb?.answer || answersObj[q.id];

        if (userAns !== undefined && userAns !== null && correctAnsStr.trim() !== '') {
          const maxMarks = q.marks || 0.0;
          const sim = computeSemanticSimilarity(String(userAns), correctAnsStr);
          const rawMarks = sim.score * maxMarks;
          const newMarks = Math.round(rawMarks * 2) / 2;

          breakdown[q.id] = {
            ...(qb || {}),
            answer: userAns,
            marksAwarded: newMarks,
            maxMarks,
            feedback: sim.feedback,
            isAIGraded: true,
            isGraded: true,
          };
          answersChanged = true;
        } else if (correctAnsStr.trim() === '') {
          // If model answer was removed, mark as unmarked
          breakdown[q.id] = {
            ...(qb || {}),
            answer: userAns || "",
            marksAwarded: 0.0,
            maxMarks: q.marks || 0.0,
            feedback: "Sample/model answer not provided by examiner. Pending manual marking.",
            isAIGraded: true,
            isGraded: false,
          };
          answersChanged = true;
        }
      });

      if (answersChanged) {
        answersObj.__examBreakdown = breakdown;

        // Recalculate total score
        let totalEarned = 0.0;
        let totalMax = 0.0;
        let gradedCount = 0;
        let totalQuestions = 0;

        poll.questions.forEach((q) => {
          totalQuestions++;
          const qb = breakdown[q.id];
          if (qb) {
            totalEarned += qb.marksAwarded || 0.0;
            totalMax += qb.maxMarks || 0.0;
            if (qb.isGraded) {
              gradedCount++;
            }
          }
        });

        answersObj.__examScore = {
          earned: totalEarned,
          total: totalMax,
        };

        // Determine marking status
        let markingStatus = 'FULLY_MARKED';
        if (gradedCount === 0) {
          markingStatus = 'UNMARKED';
        } else if (gradedCount < totalQuestions) {
          markingStatus = 'PARTIALLY_MARKED';
        }
        answersObj.__markingStatus = markingStatus;

        await prisma.vote.update({
          where: { id: v.id },
          data: {
            answers: JSON.stringify(answersObj),
          },
        });
        reevaluatedCount++;
      }
    });

    await Promise.all(updatePromises);

    // Save audit log
    await prisma.auditLog.create({
      data: {
        action: 'REEVALUATE',
        pollId,
        details: `Exam answers reevaluated against updated model answers by ${user.fullName || user.email}. ${reevaluatedCount} submissions regraded.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reevaluated all candidate submissions against updated model answers. Regraded count: ${reevaluatedCount}`,
    });
  } catch (error: any) {
    console.error('Reevaluate Exam API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
