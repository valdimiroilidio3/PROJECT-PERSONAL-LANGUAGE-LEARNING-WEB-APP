import type { VocabularyItem } from './types';

export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy';

/** Days between reviews. Repeats are spaced further apart as familiarity grows. */
export const SRS_INTERVALS = [1, 2, 4, 7, 15, 30, 60, 120] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number): string {
  return new Date(date.getTime() + days * DAY_MS).toISOString();
}

export function intervalForFamiliarity(familiarity: number): number {
  const index = Math.min(Math.max(0, familiarity), SRS_INTERVALS.length - 1);
  return SRS_INTERVALS[index];
}

export function reviewVocabulary(
  item: VocabularyItem,
  quality: ReviewQuality,
  now: Date = new Date(),
): VocabularyItem {
  const wasCorrect = quality === 'good' || quality === 'easy';
  const nextFamiliarity =
    quality === 'again'
      ? Math.max(0, item.familiarity - 1)
      : quality === 'hard'
        ? Math.max(0, item.familiarity)
        : Math.min(SRS_INTERVALS.length - 1, item.familiarity + (quality === 'easy' ? 2 : 1));

  let interval: number;
  if (quality === 'again') interval = 1;
  else if (quality === 'hard') interval = Math.max(1, Math.floor(intervalForFamiliarity(nextFamiliarity) / 2));
  else if (quality === 'easy') interval = intervalForFamiliarity(Math.min(nextFamiliarity + 1, SRS_INTERVALS.length - 1));
  else interval = intervalForFamiliarity(nextFamiliarity);

  return {
    ...item,
    familiarity: nextFamiliarity,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: addDays(now, interval),
    correctCount: item.correctCount + (wasCorrect ? 1 : 0),
    incorrectCount: item.incorrectCount + (wasCorrect ? 0 : 1),
  };
}

export function isOverdue(item: VocabularyItem, now: Date = new Date()): boolean {
  return new Date(item.nextReviewAt).getTime() <= now.getTime();
}

export function reviewPriority(item: VocabularyItem, now: Date = new Date()): number {
  const daysOverdue = Math.max(
    0,
    (now.getTime() - new Date(item.nextReviewAt).getTime()) / DAY_MS,
  );
  return daysOverdue * 2 + item.incorrectCount * 3 + (item.familiarity === 0 ? 4 : 0);
}
