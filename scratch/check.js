// Copy of our new robust computeSemanticSimilarity function to test it locally
function computeSemanticSimilarity(userAns, correctAns) {
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
  const checkSoftMatch = (word, list) => {
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
        totalClauseScoreSum += 1.0;
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

const testCases = [
  {
    name: "Perfect Exact Match",
    correct: "state is west bengal and country is india",
    user: "state is west bengal and country is india",
    expectedMin: 1.0,
    expectedMax: 1.0
  },
  {
    name: "Correct Clause Order Scramble (Reversed Clauses & Rephrased)",
    correct: "state is west bengal and country is india",
    user: "west bengal is the state and india is the country",
    expectedMin: 0.9,
    expectedMax: 1.0
  },
  {
    name: "Scrambled Incorrect Association Cheating Attempt (The User's Swap Case)",
    correct: "state is west bengal and country is india",
    user: "country is west bengal and state as india",
    expectedMin: 0.0,
    expectedMax: 0.40  // Swap penalty triggers
  },
  {
    name: "Scrambled Swap Case 2",
    correct: "state is west bengal and country is india",
    user: "state is india and country is west bengal",
    expectedMin: 0.0,
    expectedMax: 0.40  // Swap penalty triggers
  },
  {
    name: "Partially Correct (One Clause Missing)",
    correct: "state is west bengal and country is india",
    user: "state is west bengal",
    expectedMin: 0.40,
    expectedMax: 0.55
  },
  {
    name: "Single Clause Concept Rephrasing",
    correct: "photosynthesis is the process by which plants make food",
    user: "plants make food using photosynthesis",
    expectedMin: 0.75,
    expectedMax: 1.0
  }
];

console.log("=== SEMANTIC similarity evaluation tests ===");
testCases.forEach((tc, idx) => {
  const result = computeSemanticSimilarity(tc.user, tc.correct);
  const passed = result.score >= tc.expectedMin && result.score <= tc.expectedMax;
  console.log(`\nTest #${idx + 1}: ${tc.name}`);
  console.log(`  Model Answer: "${tc.correct}"`);
  console.log(`  User Answer : "${tc.user}"`);
  console.log(`  Evaluated   : Score = ${result.score.toFixed(3)} (${(result.score * 100).toFixed(0)}%)`);
  console.log(`  Feedback    : "${result.feedback}"`);
  console.log(`  Expected    : [${tc.expectedMin.toFixed(2)}, ${tc.expectedMax.toFixed(2)}]`);
  console.log(`  Status      : ${passed ? '🟢 PASSED' : '🔴 FAILED'}`);
});
