// ─── spacedRepetition.js ────────────────────────────────────────────────────
// A simplified SM-2 algorithm. Pure function, no I/O — db.js calls this and
// persists the result. Kept lean on purpose: 4 ratings, no per-card options.
// ─────────────────────────────────────────────────────────────────────────────

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;

const EASE_DELTA = {
  again: -0.3,
  hard: -0.15,
  good: 0,
  easy: 0.15,
};

/**
 * @param {object} card - { ease_factor, interval_days, repetitions }
 * @param {"again"|"hard"|"good"|"easy"} rating
 * @returns {{ ease_factor: number, interval_days: number, repetitions: number, next_review_date: string }}
 */
export function scheduleNextReview(card, rating) {
  const currentEase = card.ease_factor ?? 2.5;
  const currentReps = card.repetitions ?? 0;

  let easeFactor = currentEase + (EASE_DELTA[rating] ?? 0);
  easeFactor = Math.max(MIN_EASE, Math.min(MAX_EASE, easeFactor));

  let repetitions = currentReps;
  let intervalDays;

  if (rating === "again") {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = currentReps + 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 3;
    } else {
      const prevInterval = card.interval_days || 1;
      intervalDays = Math.round(prevInterval * easeFactor);
    }
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);

  return {
    ease_factor: easeFactor,
    interval_days: intervalDays,
    repetitions,
    next_review_date: nextDate.toISOString().slice(0, 10),
  };
}
