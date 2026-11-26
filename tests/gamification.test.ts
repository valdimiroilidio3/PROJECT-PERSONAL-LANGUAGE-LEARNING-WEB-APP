import { describe, expect, it } from 'vitest';
import { deriveAnalytics } from '../lib/analytics';
import { deriveDailyQuests, deriveLeague } from '../lib/gamification';
import type { Attempt, LessonCompletion, Profile } from '../lib/types';

const now = new Date('2026-11-26T12:00:00.000Z');
const profile: Profile = {
  onboarded: true,
  nativeLanguage: 'pt',
  targetLanguage: 'es',
  level: 'beginner',
  goal: 'everyday',
  dailyGoalMinutes: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const completion = (lessonId: string, completedAt: string): LessonCompletion => ({
  lessonId,
  completedAt,
  correctCount: 6,
  totalExercises: 6,
  xpAwarded: 25,
  durationMs: 60_000,
  mistakes: [],
});

const attempt = (overrides: Partial<Attempt> = {}): Attempt => ({
  lessonId: 'es-saludos',
  exerciseId: 'es-saludos-e1',
  exerciseType: 'multiple-choice',
  category: 'Conversação',
  timestamp: now.toISOString(),
  correct: true,
  userAnswer: 'Buenos días',
  correctAnswer: 'Buenos días',
  durationMs: 1000,
  xpAwarded: 0,
  source: 'lesson',
  ...overrides,
});

function input(attempts: Attempt[], completions: LessonCompletion[] = []) {
  return {
    analytics: deriveAnalytics(completions, attempts, [], now),
    profile,
    completions,
    attempts,
    vocabulary: [],
    now,
  };
}

describe('personal leagues', () => {
  it('uses only saved XP to set the tier and the next threshold', () => {
    expect(deriveLeague(0).name).toBe('Bronze');
    expect(deriveLeague(99).next?.name).toBe('Prata');
    const gold = deriveLeague(350);
    expect(gold.name).toBe('Ouro');
    expect(gold.progress).toBe(50);
    expect(gold.target).toBe(400);
    expect(deriveLeague(1500).next).toBeNull();
  });

  it('never accepts negative XP as a real tier', () => {
    expect(deriveLeague(-50).name).toBe('Bronze');
  });
});

describe('daily quests', () => {
  it('reports zero progress when nothing is saved today', () => {
    const quests = deriveDailyQuests(input([]));
    expect(quests).toHaveLength(4);
    expect(quests.every((quest) => quest.progress === 0 && !quest.completed)).toBe(true);
    expect(quests.find((quest) => quest.id === 'xp')?.target).toBe(20);
  });

  it('counts only today\'s completions, answers and XP', () => {
    const completions = [
      completion('es-saludos', now.toISOString()),
      completion('es-numeros', '2026-11-25T10:00:00.000Z'),
    ];
    const attempts = [
      attempt(),
      attempt({ id: 2, exerciseId: 'a2', source: 'review' }),
      attempt({ id: 3, exerciseId: 'a3', correct: false }),
      attempt({ id: 4, exerciseId: 'a4', timestamp: '2026-11-20T10:00:00.000Z' }),
    ];
    const quests = deriveDailyQuests(input(attempts, completions));
    const lessonQuest = quests.find((quest) => quest.id === 'first-lesson')!;
    const answerQuest = quests.find((quest) => quest.id === 'answers')!;
    const reviewQuest = quests.find((quest) => quest.id === 'review')!;
    expect(lessonQuest.progress).toBe(1);
    expect(lessonQuest.completed).toBe(true);
    expect(answerQuest.progress).toBe(3);
    expect(reviewQuest.progress).toBe(1);
    const xpQuest = quests.find((quest) => quest.id === 'xp')!;
    expect(xpQuest.progress).toBe(20);
    expect(xpQuest.completed).toBe(true);
  });
});
