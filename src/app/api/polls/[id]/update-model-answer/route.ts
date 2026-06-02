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
    const rp = verifyRefreshToken(refreshToken);
    if (rp) payload = { userId: rp.userId, email: rp.email, role: rp.role };
  }
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.userId } });
}

function computeSemanticSimilarity(
  userAns: string, 
  correctAns: string, 
  questionText: string = ''
): { score: number; feedback: string } {
  const cleanUser = userAns.trim().toLowerCase().replace(/[^\w\s]/g, '');
  const cleanCorrect = correctAns.trim().toLowerCase().replace(/[^\w\s]/g, '');

  if (!cleanUser || !cleanCorrect) {
    return { score: 0.0, feedback: "No answer provided or reference answer is blank." };
  }

  if (cleanUser === cleanCorrect) {
    return { score: 1.0, feedback: "Perfect match! Your answer matches the model answer exactly." };
  }

  // Expanded stop words including prompt/general question filler words
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "of", "to", "for", "in", "on", "at", "by", 
    "with", "about", "against", "between", "into", "through", "during", "before", "after", 
    "above", "below", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", 
    "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", 
    "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", 
    "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", 
    "now", "it", "its", "they", "them", "their", "he", "him", "his", "she", "her", "we", "us", 
    "our", "you", "your", "yours", "i", "me", "my", "myself", "himself", "herself", "itself", 
    "ourselves", "yourselves", "themselves", "which", "who", "whom", "whose", "this", "that", 
    "these", "those", "what", "using", "use", "used",
    // General question/marking filler words
    "country", "state", "city", "name", "value", "type", "answer", "question", "exam", "test",
    "here", "there", "correct", "incorrect", "model", "write", "provide", "enter", "select"
  ]);

  // If question text is provided, add all unique words from the question to the stopWords set
  if (questionText) {
    const qWords = questionText.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    qWords.forEach(w => {
      if (w.length > 2) stopWords.add(w);
    });
  }

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
        : `Answer does not match reference model response.`
    };
  }

  // 1. Direct inclusion test of the full cleaned answer
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

  // CRITICAL SECURITY / CORRECTNESS LOCK:
  // If the core content keywords in the model answer are completely missing or matched below the semantic threshold (25%),
  // we lock the final score to 0.0 marks. This ensures that regardless of the question topic, candidates must demonstrate
  // genuine concept match and cannot exploit structural question repetition words to gain partial marks.
  if (unigramScore < 0.25) {
    finalScore = 0.0;
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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { questionId, correctAnswer, correctAnswers } = body;

    if (!questionId) return NextResponse.json({ error: 'questionId is required' }, { status: 400 });

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        settings: true,
        questions: { include: { options: true } },
        votes: true,
      },
    });

    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    if (poll.creatorId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Check exam is not finalized
    let examMeta: any = {};
    if (poll.settings?.postEmailMessage) {
      try { examMeta = JSON.parse(poll.settings.postEmailMessage); } catch(e) {}
    }
    if (examMeta.isFinalPublished) {
      return NextResponse.json({ error: 'Exam is finalized. Model answers cannot be updated.' }, { status: 400 });
    }

    const question = poll.questions.find(q => q.id === questionId);
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    // 1. Update the question model answer in DB
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        correctAnswer: correctAnswer !== undefined ? (correctAnswer || null) : question.correctAnswer,
        correctAnswers: correctAnswers !== undefined ? JSON.stringify(correctAnswers) : (question.correctAnswers as any),
      },
      include: { options: true },
    });

    // 2. Regrade all existing votes for this question
    let regradedCount = 0;
    const q = updatedQuestion;
    const maxMarks = q.marks || 0.0;

    const updatePromises = poll.votes.map(async (v) => {
      let answersObj: any = {};
      try { answersObj = typeof v.answers === 'string' ? JSON.parse(v.answers) : v.answers; } catch(e) { return; }

      const breakdown: Record<string, any> = answersObj.__examBreakdown || {};
      const qb = breakdown[questionId];

      // Skip if teacher manually overrode this question's grade
      if (qb?.isOverridden) return;

      const userAns = qb?.answer !== undefined ? qb.answer : answersObj[questionId];
      let newMarks = 0;
      let newFeedback = '';
      let isGraded = true;

      let rules: any = {};
      if (typeof q.logicRules === 'string') { try { rules = JSON.parse(q.logicRules as string) || {}; } catch(e) {} }
      else if (q.logicRules && typeof q.logicRules === 'object') { rules = q.logicRules; }

      if (q.type === 'SINGLE') {
        const newCorrect = correctAnswer || q.correctAnswer;
        if (!newCorrect) { newMarks = 0; newFeedback = "No model answer set."; isGraded = false; }
        else {
          const correctOpt = q.options.find((opt: any) => opt.text === newCorrect || opt.id === newCorrect);
          const isCorrect = correctOpt ? String(userAns) === String(correctOpt.id) : String(userAns) === String(newCorrect);
          const enableNeg = !!rules.enableNegativeMarking;
          const penalty = typeof rules.negativeMarkingPenalty === 'number' ? rules.negativeMarkingPenalty : 0.25;
          const correctText = correctOpt ? correctOpt.text : newCorrect;
          if (userAns === undefined || userAns === null) { newMarks = 0; newFeedback = "No answer provided."; }
          else if (isCorrect) { newMarks = maxMarks; newFeedback = "Correct! Full marks."; }
          else { newMarks = enableNeg ? -penalty : 0; newFeedback = `Incorrect. Correct: "${correctText}".${enableNeg ? ` Penalty -${penalty}.` : ''}`; }
        }
      } else if (q.type === 'MULTI_SELECT') {
        const newCorrectAnswers = correctAnswers || (typeof q.correctAnswers === 'string' ? JSON.parse(q.correctAnswers as string) : (Array.isArray(q.correctAnswers) ? q.correctAnswers : []));
        const markingScheme = rules.markingScheme || 'PARTIAL';
        const enableNeg = !!rules.enableNegativeMarking;
        const penalty = typeof rules.negativeMarkingPenalty === 'number' ? rules.negativeMarkingPenalty : 0.25;
        const correctIds = (newCorrectAnswers as string[]).map((cVal: string) => {
          const found = q.options.find((opt: any) => opt.text === cVal || opt.id === cVal);
          return found ? found.id : cVal;
        });
        const correctSet = new Set(correctIds);
        const userList: string[] = Array.isArray(userAns) ? userAns : [];
        let correctSelected = 0, incorrectSelectedCount = 0;
        userList.forEach(id => { if (correctSet.has(id)) correctSelected++; else incorrectSelectedCount++; });

        if (markingScheme === 'ALL_OR_NOTHING') {
          const perfect = correctSelected === correctSet.size && incorrectSelectedCount === 0 && userList.length === correctSet.size;
          newMarks = perfect ? maxMarks : (enableNeg ? -penalty : 0);
          newFeedback = perfect ? "Full marks." : `Incorrect — All-or-Nothing.`;
        } else if (markingScheme === 'ZERO_ON_INCORRECT') {
          if (incorrectSelectedCount > 0) { newMarks = 0; newFeedback = "Wrong option chosen — score zeroed."; }
          else { newMarks = Math.round(((correctSelected / Math.max(1, correctSet.size)) * maxMarks) * 2) / 2; newFeedback = `Partial: ${correctSelected}/${correctSet.size} correct.`; }
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
      } else if (q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT') {
        const newCorrect = correctAnswer || q.correctAnswer || '';
        if (!newCorrect.trim()) { newMarks = 0; newFeedback = "No model answer set. Pending manual marking."; isGraded = false; }
        else if (userAns !== undefined && userAns !== null) {
          const sim = computeSemanticSimilarity(String(userAns), newCorrect, q.questionText || '');
          newMarks = Math.round(sim.score * maxMarks * 2) / 2;
          newFeedback = sim.feedback;
        }
      } else {
        // FILE_UPLOAD or other — skip regrading
        return;
      }

      breakdown[questionId] = { ...(qb || {}), answer: userAns ?? (q.type === 'MULTI_SELECT' ? [] : ''), marksAwarded: newMarks, maxMarks, feedback: newFeedback, isAIGraded: q.type !== 'SINGLE' && q.type !== 'MULTI_SELECT', isGraded };
      answersObj.__examBreakdown = breakdown;

      // Recalculate total score
      let totalEarned = 0, totalMax = 0, gradedCount = 0, totalQuestions = 0;
      poll.questions.forEach(pq => {
        totalQuestions++;
        const pb = breakdown[pq.id];
        if (pb) { totalEarned += pb.marksAwarded || 0; totalMax += pb.maxMarks || 0; if (pb.isGraded) gradedCount++; }
        else { totalMax += pq.marks || 0; }
      });

      answersObj.__examScore = { earned: totalEarned, total: totalMax };
      answersObj.__markingStatus = gradedCount === 0 ? 'UNMARKED' : gradedCount < totalQuestions ? 'PARTIALLY_MARKED' : 'FULLY_MARKED';

      await prisma.vote.update({ where: { id: v.id }, data: { answers: JSON.stringify(answersObj) } });
      regradedCount++;
    });

    await Promise.all(updatePromises);

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_MODEL_ANSWER',
        pollId,
        details: `Model answer for question "${question.questionText?.substring(0, 60)}" updated by ${user.fullName || user.email}. ${regradedCount} submissions regraded.`,
      },
    });

    // Fetch updated votes summary
    const updatedVotes = await prisma.vote.findMany({ where: { pollId }, select: { id: true, email: true, answers: true, createdAt: true } });

    return NextResponse.json({
      success: true,
      message: `Model answer updated. ${regradedCount} submissions regraded.`,
      regradedCount,
      updatedQuestion,
      votes: updatedVotes,
    });

  } catch (error: any) {
    console.error('Update Model Answer API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
