/**
 * Content Moderation Engine
 * Scans poll/survey/exam content for explicit, offensive, or harmful language.
 * Uses a curated keyword list approach.
 */

// Curated list of explicit/offensive terms (kept minimal but representative)
const EXPLICIT_KEYWORDS = [
  // Profanity
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'dick', 'piss',
  'cunt', 'whore', 'slut', 'nigger', 'nigga', 'faggot', 'retard',
  // Hate speech
  'kill yourself', 'kys', 'go die', 'hate crime', 'ethnic cleansing',
  'white supremacy', 'racial slur',
  // Violence
  'bomb threat', 'shoot up', 'mass shooting', 'terrorist attack',
  'school shooting', 'murder everyone',
  // Sexual content
  'pornography', 'nude photos', 'sex tape', 'explicit content',
  'sexual assault', 'rape',
  // Drug-related
  'buy drugs', 'sell cocaine', 'meth lab', 'drug dealer',
];

// Patterns that are contextually inappropriate for educational/professional platform
const INAPPROPRIATE_PATTERNS = [
  /\b(f+u+c+k+)\b/i,
  /\b(s+h+i+t+)\b/i,
  /\b(a+s+s+h+o+l+e+)\b/i,
  /\b(b+i+t+c+h+)\b/i,
];

export type ModerationResult = {
  flagged: boolean;
  reasons: string[];
  flaggedTexts: string[];
};

/**
 * Scan a single text string for explicit content
 */
function scanText(text: string): { matched: boolean; keyword: string } | null {
  const lower = text.toLowerCase();
  
  for (const keyword of EXPLICIT_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { matched: true, keyword };
    }
  }
  
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    const match = lower.match(pattern);
    if (match) {
      return { matched: true, keyword: match[0] };
    }
  }
  
  return null;
}

/**
 * Moderate all content in a poll/survey/exam
 * Scans title, description, all question texts, and all option texts
 */
export function moderateContent(data: {
  title: string;
  description: string;
  questions?: Array<{
    questionText: string;
    options?: Array<{ text: string }>;
    correctAnswer?: string;
  }>;
}): ModerationResult {
  const reasons: string[] = [];
  const flaggedTexts: string[] = [];

  // Scan title
  const titleResult = scanText(data.title);
  if (titleResult) {
    reasons.push(`Explicit language detected in title: "${titleResult.keyword}"`);
    flaggedTexts.push(data.title);
  }

  // Scan description
  const descResult = scanText(data.description);
  if (descResult) {
    reasons.push(`Explicit language detected in description: "${descResult.keyword}"`);
    flaggedTexts.push(data.description);
  }

  // Scan questions and options
  if (data.questions) {
    data.questions.forEach((q, idx) => {
      const qResult = scanText(q.questionText);
      if (qResult) {
        reasons.push(`Explicit language in Question ${idx + 1}: "${qResult.keyword}"`);
        flaggedTexts.push(q.questionText);
      }

      if (q.options) {
        q.options.forEach((opt, optIdx) => {
          const optResult = scanText(opt.text);
          if (optResult) {
            reasons.push(`Explicit language in Q${idx + 1}, Option ${optIdx + 1}: "${optResult.keyword}"`);
            flaggedTexts.push(opt.text);
          }
        });
      }

      if (q.correctAnswer) {
        const caResult = scanText(q.correctAnswer);
        if (caResult) {
          reasons.push(`Explicit language in Q${idx + 1} answer: "${caResult.keyword}"`);
          flaggedTexts.push(q.correctAnswer);
        }
      }
    });
  }

  return {
    flagged: reasons.length > 0,
    reasons,
    flaggedTexts,
  };
}
