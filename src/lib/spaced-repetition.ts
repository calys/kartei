/**
 * SM-2 spaced repetition algorithm.
 * Quality: 0-5 (0-2 = fail, 3-5 = pass with increasing confidence)
 * For our self-eval: "didn't know" = 1, "partially knew" = 3, "knew it" = 5
 */

interface ReviewResult {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
}

export type ReviewQuality = 1 | 3 | 5;

export function computeNextReview(
  quality: ReviewQuality,
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number
): ReviewResult {
  let easeFactor = currentEaseFactor;
  let interval: number;
  let repetitions: number;

  if (quality < 3) {
    // Failed: reset
    repetitions = 0;
    interval = 0;
  } else {
    // Passed
    repetitions = currentRepetitions + 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 3;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
  }

  // Update ease factor
  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ease_factor: Math.round(easeFactor * 100) / 100,
    interval_days: interval,
    repetitions,
    next_review_at: nextReview.toISOString(),
  };
}

