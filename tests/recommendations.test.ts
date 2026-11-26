import { describe, expect, it } from 'vitest';
import { deriveAnalytics } from '../lib/analytics';
import { lessons } from '../lib/content';
import { getNextStep } from '../lib/recommendations';
import { createVocabularyItem } from '../lib/vocabulary';
import type { Attempt, Profile } from '../lib/types';

const profile: Profile = {
  onboarded: true,
  nativeLanguage: 'pt',
  targetLanguage: 'en',
  level: 'beginner',
  goal: 'everyday',
  dailyGoalMinutes: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const attempt = (overrides: Partial<Attempt> = {}): Attempt => ({
  lessonId: 'greetings',
  exerciseId: 'greetings-e1',
  exerciseType: 'multiple-choice',
  category: 'Conversação',
  timestamp: '2026-01-01T10:00:00.000Z',
  correct: true,
  userAnswer: 'Good morning',
  correctAnswer: 'Good morning',
  durationMs: 5000,
  xpAwarded: 0,
  source: 'lesson',
  ...overrides,
});

function input(attempts: Attempt[], words = 0, now = new Date('2026-01-10T12:00:00.000Z')) {
  const vocabulary = Array.from({ length: words }, (_, index) =>
    createVocabularyItem({ term: `word-${index}`, translation: 'palavra', example: '', context: '' }, { source: 'manual', now: new Date('2026-01-01T00:00:00.000Z') }),
  );
  return {
    analytics: deriveAnalytics([], attempts, vocabulary, now),
    profile,
    lessons,
    completions: [],
    attempts,
    vocabulary,
    now,
  };
}

describe('adaptive next step', () => {
  it('prioritises overdue vocabulary when there are five or more words', () => {
    const step = getNextStep(input([], 5));
    expect(step.id).toBe('review');
    expect(step.title).toContain('5 palavras');
  });

  it('prioritises a repeated mistake before a generic lesson', () => {
    const attempts = [
      attempt({ correct: false, userAnswer: 'Good night' }),
      attempt({ correct: false, userAnswer: 'Good night' }),
    ];
    const step = getNextStep(input(attempts));
    expect(step.id).toBe('mistakes');
    expect(step.description).toContain('2 vezes');
  });

  it('falls back to the next unlocked lesson with no saved activity', () => {
    const step = getNextStep(input([]));
    expect(step.id).toBe('lesson');
    expect(step.href).toBe('/lesson/greetings');
    expect(step.reason).toContain('0 de');
  });
});
