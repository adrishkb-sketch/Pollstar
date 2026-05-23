export interface OptionScore {
  optionId: string;
  text: string;
  bordaScore: number;
  firstPlaceVotes: number;
}

export interface BordaResult {
  scores: Record<string, OptionScore>;
  rankings: OptionScore[];
  overallWinner: OptionScore | null;
  firstPlaceLeader: OptionScore | null;
}

/**
 * Calculates Borda count and ranking statistics for a set of votes on a ranked choice question.
 * @param options List of options for the question
 * @param votes List of votes cast for the poll
 * @param questionId The ID of the question to rank
 */
export function calculateBordaResults(
  options: { id: string; text: string }[],
  votes: any[],
  questionId: string
): BordaResult {
  const numOptions = options.length;
  
  // Initialize option scores map
  const scoresMap: Record<string, OptionScore> = {};
  for (const opt of options) {
    scoresMap[opt.id] = {
      optionId: opt.id,
      text: opt.text,
      bordaScore: 0,
      firstPlaceVotes: 0,
    };
  }

  // Aggregate scores from votes
  for (const vote of votes) {
    try {
      // Parse answers JSON
      const answers = typeof vote.answers === 'string' ? JSON.parse(vote.answers) : vote.answers;
      const rankedOptionIds = answers[questionId] as string[];

      if (Array.isArray(rankedOptionIds)) {
        rankedOptionIds.forEach((optId, index) => {
          if (scoresMap[optId]) {
            // 1st place (index 0) gets numOptions points, 2nd gets numOptions - 1, etc.
            const points = numOptions - index;
            scoresMap[optId].bordaScore += points;

            // Increment 1st place counts
            if (index === 0) {
              scoresMap[optId].firstPlaceVotes += 1;
            }
          }
        });
      }
    } catch (e) {
      console.error('Error parsing vote in Borda calculation:', e);
    }
  }

  // Convert map to sorted array
  const rankings = Object.values(scoresMap).sort((a, b) => {
    if (b.bordaScore !== a.bordaScore) {
      return b.bordaScore - a.bordaScore;
    }
    // Tie breaker: most first-place votes
    return b.firstPlaceVotes - a.firstPlaceVotes;
  });

  const overallWinner = rankings.length > 0 ? rankings[0] : null;

  // Determine first place leader (strictly by number of 1st place votes)
  const firstPlaceRankings = [...rankings].sort((a, b) => b.firstPlaceVotes - a.firstPlaceVotes);
  const firstPlaceLeader = firstPlaceRankings.length > 0 ? firstPlaceRankings[0] : null;

  return {
    scores: scoresMap,
    rankings,
    overallWinner,
    firstPlaceLeader,
  };
}
