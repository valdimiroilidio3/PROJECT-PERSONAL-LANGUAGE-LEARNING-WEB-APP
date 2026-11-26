import { describe, expect, it } from 'vitest';
import { SRS_INTERVALS, intervalForFamiliarity, isOverdue, masteryStatus, reviewVocabulary, reviewPriority } from '../lib/srs';
import type { VocabularyItem } from '../lib/types';

const item = (overrides: Partial<VocabularyItem> = {}): VocabularyItem => ({
  id: 'hello',
  english: 'hello',
  portuguese: 'olá',
  example: 'Hello!',
  context: 'Saudação',
  familiarity: 0,
  lastReviewedAt: null,
  nextReviewAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  correctCount: 0,
  incorrectCount: 0,
  source: 'lesson',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('spaced repetition', () => {
  it('increases the interval as familiarity grows', () => {
    expect(intervalForFamiliarity(0)).toBe(SRS_INTERVALS[0]);
    expect(intervalForFamiliarity(3)).toBeGreaterThan(intervalForFamiliarity(0));
    const now = new Date('2026-01-01T00:00:00.000Z');
    const reviewed = reviewVocabulary(item(), 'good', now);
    expect(reviewed.familiarity).toBe(1);
    expect(reviewed.correctCount).toBe(1);
    expect(reviewed.history).toHaveLength(1);
    expect(reviewed.history?.[0]).toMatchObject({ quality: 'good', familiarityAfter: 1, intervalDays: 2 });
    expect(new Date(reviewed.nextReviewAt).getTime() - now.getTime()).toBe(2 * 24 * 60 * 60 * 1000);
  });

  it('shortens the interval after a mistake but still schedules a review', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const reviewed = reviewVocabulary(item({ familiarity: 4, incorrectCount: 1 }), 'again', now);
    expect(reviewed.familiarity).toBe(3);
    expect(reviewed.incorrectCount).toBe(2);
    expect(new Date(reviewed.nextReviewAt).getTime() - now.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('maps familiarity and accuracy to transparent mastery states', () => {
    expect(masteryStatus(item())).toBe('new');
    expect(masteryStatus(item({ familiarity: 2, correctCount: 1 }))).toBe('learning');
    expect(masteryStatus(item({ familiarity: 5 }))).toBe('mastered');
  });

  it('prioritises overdue and frequently missed words', () => {
    const now = new Date('2026-01-10T00:00:00.000Z');
    const due = item({ nextReviewAt: '2026-01-01T00:00:00.000Z', incorrectCount: 2 });
    const fresh = item({ id: 'bye', nextReviewAt: '2026-01-20T00:00:00.000Z' });
    expect(isOverdue(due, now)).toBe(true);
    expect(reviewPriority(due, now)).toBeGreaterThan(reviewPriority(fresh, now));
  });
});
