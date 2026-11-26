import { describe, expect, it } from 'vitest';
import { calculateLessonXp } from '../lib/scoring';
import { calculateStreak, buildEvents, dateKey, deriveAnalytics } from '../lib/analytics';
import type { Attempt, LessonCompletion } from '../lib/types';

const completion = (overrides: Partial<LessonCompletion> = {}): LessonCompletion => ({
  lessonId: 'greetings',
  completedAt: '2026-01-01T10:00:00.000Z',
  correctCount: 6,
  totalExercises: 6,
  xpAwarded: 25,
  durationMs: 300_000,
  mistakes: [],
  ...overrides,
});

describe('lesson XP', () => {
  it('awards a base, accuracy bonus and perfect bonus on first completion', () => {
    expect(calculateLessonXp({ totalExercises: 6, correctCount: 6, firstCompletion: true })).toBe(25);
    expect(calculateLessonXp({ totalExercises: 6, correctCount: 3, firstCompletion: true })).toBe(15);
  });

  it('never grants XP twice for the same lesson', () => {
    expect(calculateLessonXp({ totalExercises: 6, correctCount: 6, firstCompletion: false })).toBe(0);
  });
});

describe('streaks and analytics', () => {
  it('keeps a streak alive when the last activity was yesterday', () => {
    const now = new Date('2026-03-10T12:00:00.000Z');
    const events = buildEvents([
      completion({ completedAt: '2026-03-08T10:00:00.000Z' }),
      completion({ lessonId: 'numbers-time', completedAt: '2026-03-09T10:00:00.000Z' }),
    ], []);
    expect(calculateStreak(events, now)).toBe(2);
  });

  it('returns zero when the last activity is older than yesterday', () => {
    const now = new Date('2026-03-10T12:00:00.000Z');
    const events = buildEvents([completion({ completedAt: '2026-03-05T10:00:00.000Z' })], []);
    expect(calculateStreak(events, now)).toBe(0);
  });

  it('derives totals only from saved activity', () => {
    const attempts: Attempt[] = [
      { lessonId: 'greetings', exerciseId: 'a', exerciseType: 'translation', category: 'Conversação', timestamp: '2026-03-09T10:00:00.000Z', correct: true, userAnswer: 'Hi', correctAnswer: 'Hi', durationMs: 1000, xpAwarded: 0, source: 'lesson' },
      { lessonId: 'greetings', exerciseId: 'b', exerciseType: 'translation', category: 'Conversação', timestamp: '2026-03-09T10:01:00.000Z', correct: false, userAnswer: 'Bye', correctAnswer: 'Hi', durationMs: 1000, xpAwarded: 0, source: 'lesson' },
    ];
    const analytics = deriveAnalytics([completion({ completedAt: '2026-03-09T10:00:00.000Z' })], attempts, [], new Date('2026-03-09T12:00:00.000Z'));
    expect(analytics.totalXp).toBe(25);
    expect(analytics.todayXp).toBe(25);
    expect(analytics.accuracy).toBe(50);
    expect(analytics.completedLessons).toBe(1);
    expect(dateKey('2026-03-09T10:00:00.000Z')).toBe('2026-03-09');
  });
});
