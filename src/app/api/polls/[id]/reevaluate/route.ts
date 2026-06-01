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
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        settings: true,
        questions: { include: { options: true } },
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
        const qb = breakdown[q.id];
        // If teacher manually overrode, skip!
        if (qb && qb.isOverridden) return;

        const maxMarks = q.marks || 0.0;
        const userAns = qb?.answer !== undefined ? qb.answer : answersObj[q.id];

        // --- SINGLE MCQ regrading ---
        if (q.type === 'SINGLE') {
          const correctOpt = (q as any).options?.find((opt: any) => opt.text === q.correctAnswer || opt.id === q.correctAnswer);
          if (!q.correctAnswer) return; // no model answer set
          const isCorrect = correctOpt
            ? String(userAns) === String(correctOpt.id)
            : String(userAns) === String(q.correctAnswer);
          const correctText = correctOpt ? correctOpt.text : q.correctAnswer;

          let rules: any = {};
          if (typeof q.logicRules === 'string') { try { rules = JSON.parse(q.logicRules) || {}; } catch(e) {} }
          else if (q.logicRules && typeof q.logicRules === 'object') { rules = q.logicRules; }
          const enableNeg = !!rules.enableNegativeMarking;
          const penalty = typeof rules.negativeMarkingPenalty === 'number' ? rules.negativeMarkingPenalty : 0.25;

          let newMarks: number;
          let newFeedback: string;
          if (userAns === undefined || userAns === null) {
            newMarks = 0; newFeedback = "No answer provided.";
          } else if (isCorrect) {
            newMarks = maxMarks; newFeedback = "Correct answer selected! Full marks awarded.";
          } else {
            newMarks = enableNeg ? -penalty : 0;
            newFeedback = `Incorrect. Correct answer was: "${correctText}".${enableNeg ? ` Penalty -${penalty} applied.` : ''}`;
          }

          breakdown[q.id] = { ...(qb || {}), answer: userAns ?? '', marksAwarded: newMarks, maxMarks, feedback: newFeedback, isAIGraded: false, isGraded: true };
          answersChanged = true;

        // --- MULTI_SELECT regrading ---
        } else if (q.type === 'MULTI_SELECT') {
          if (!q.correctAnswers) return;
          let correctList: string[] = [];
          try { correctList = typeof q.correctAnswers === 'string' ? JSON.parse(q.correctAnswers) : (Array.isArray(q.correctAnswers) ? q.correctAnswers : []); } catch(e) {}

          let rules: any = {};
          if (typeof q.logicRules === 'string') { try { rules = JSON.parse(q.logicRules) || {}; } catch(e) {} }
          else if (q.logicRules && typeof q.logicRules === 'object') { rules = q.logicRules; }
          const markingScheme = rules.markingScheme || 'PARTIAL';
          const enableNeg = !!rules.enableNegativeMarking;
          const penalty = typeof rules.negativeMarkingPenalty === 'number' ? rules.negativeMarkingPenalty : 0.25;

          const correctIds = correctList.map((cVal: string) => {
            const found = (q as any).options?.find((opt: any) => opt.text === cVal || opt.id === cVal);
            return found ? found.id : cVal;
          });
          const correctSet = new Set(correctIds);
          const userList = Array.isArray(userAns) ? userAns : [];
          let correctSelected = 0, incorrectSelectedCount = 0;
          userList.forEach((id: string) => { if (correctSet.has(id)) correctSelected++; else incorrectSelectedCount++; });

          let newMarks = 0;
          let newFeedback = '';
          if (markingScheme === 'ALL_OR_NOTHING') {
            const perfect = correctSelected === correctSet.size && incorrectSelectedCount === 0 && userList.length === correctSet.size;
            newMarks = perfect ? maxMarks : (enableNeg ? -penalty : 0);
            newFeedback = perfect ? "All correct. Full marks." : `Incorrect — All-or-Nothing.${enableNeg ? ` Penalty -${penalty}.` : ''}`;
          } else if (markingScheme === 'ZERO_ON_INCORRECT') {
            if (incorrectSelectedCount > 0) { newMarks = 0; newFeedback = "Wrong option(s) chosen — score zeroed."; }
            else { newMarks = Math.round(((correctSelected / Math.max(1, correctSet.size)) * maxMarks) * 2) / 2; newFeedback = `${correctSelected}/${correctSet.size} correct, no wrong. Partial credit.`; }
          } else if (markingScheme === 'PARTIAL_WITH_PENALTY') {
            const base = (correctSelected / Math.max(1, correctSet.size)) * maxMarks;
            newMarks = Math.max(0, Math.round((base - incorrectSelectedCount * penalty) * 2) / 2);
            newFeedback = `Partial: ${correctSelected}/${correctSet.size} correct, ${incorrectSelectedCount} wrong. Penalty deducted.`;
          } else {
            const base = (correctSelected / Math.max(1, correctSet.size)) * maxMarks;
            const pen = enableNeg ? incorrectSelectedCount * penalty : 0;
            newMarks = Math.max(enableNeg ? -maxMarks : 0, Math.round((base - pen) * 2) / 2);
            newFeedback = `Partial: ${correctSelected}/${correctSet.size} correct.${enableNeg ? ` Penalty -${pen.toFixed(1)}.` : ''}`;
          }

          breakdown[q.id] = { ...(qb || {}), answer: userAns ?? [], marksAwarded: newMarks, maxMarks, feedback: newFeedback, isAIGraded: false, isGraded: true };
          answersChanged = true;

        // --- SHORT_TEXT / LONG_TEXT semantic regrading ---
        } else if (q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT') {
          const correctAnsStr = q.correctAnswer || '';
          if (userAns !== undefined && userAns !== null && correctAnsStr.trim() !== '') {
            const sim = computeSemanticSimilarity(String(userAns), correctAnsStr);
            const newMarks = Math.round(sim.score * maxMarks * 2) / 2;
            breakdown[q.id] = { ...(qb || {}), answer: userAns, marksAwarded: newMarks, maxMarks, feedback: sim.feedback, isAIGraded: true, isGraded: true };
            answersChanged = true;
          } else if (correctAnsStr.trim() === '') {
            breakdown[q.id] = { ...(qb || {}), answer: userAns || '', marksAwarded: 0.0, maxMarks, feedback: "Model answer not provided. Pending manual marking.", isAIGraded: true, isGraded: false };
            answersChanged = true;
          }
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
