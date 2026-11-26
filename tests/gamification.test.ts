import { describe, expect, it } from 'vitest';
import { deriveAnalytics } from '../lib/analytics';
import {
  deriveDailyQuests,
  deriveHabitGarden,
  deriveLeague,
  deriveRotatingQuest,
  deriveWeeklyChallenges,
  rotatingQuestIdFor,
  type RotatingQuestId,
} from '../lib/gamification';
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

const completion = (
  lessonId: string,
  completedAt: string,
  overrides: Partial<LessonCompletion> = {},
): LessonCompletion => ({
  lessonId,
  completedAt,
  correctCount: 6,
  totalExercises: 6,
  xpAwarded: 25,
  durationMs: 60_000,
  mistakes: [],
  ...overrides,
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

function input(attempts: Attempt[], completions: LessonCompletion[] = [], at: Date = now) {
  return {
    analytics: deriveAnalytics(completions, attempts, [], at),
    profile,
    completions,
    attempts,
    vocabulary: [],
    now: at,
  };
}

const localDay = (day: number, hour = 12) => new Date(2026, 10, day, hour);
const fourDays = [26, 27, 28, 29].map((day) => localDay(day));

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
    expect(quests).toHaveLength(5);
    expect(quests.slice(0, 4).every((quest) => quest.progress === 0 && !quest.completed)).toBe(true);
    expect(quests.find((quest) => quest.id === 'xp')?.target).toBe(20);
    expect(quests.some((quest) => quest.id === rotatingQuestIdFor(now))).toBe(true);
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

describe('rotating daily quest', () => {
  it('changes with the calendar day but stays stable for the same day', () => {
    const ids = fourDays.map((day) => rotatingQuestIdFor(day));
    expect(new Set(ids).size).toBe(4);
    expect(rotatingQuestIdFor(fourDays[0])).toBe(ids[0]);
  });

  it('measures each variant from saved activity only', () => {
    const expected: RotatingQuestId[] = ['practice-scenario', 'correct-answers', 'second-lesson', 'study-minutes'];
    for (const id of expected) {
      const day = fourDays.find((candidate) => rotatingQuestIdFor(candidate) === id)!;
      let attempts: Attempt[] = [];
      let completions: LessonCompletion[] = [];

      if (id === 'practice-scenario') {
        attempts = [
          attempt({ timestamp: day.toISOString(), source: 'practice', lessonId: 'scenario-a' }),
          attempt({ id: 2, timestamp: day.toISOString(), source: 'practice', lessonId: 'scenario-a', exerciseId: 'e2' }),
        ];
      } else if (id === 'correct-answers') {
        attempts = [
          ...Array.from({ length: 5 }, (_, index) =>
            attempt({ id: index + 1, exerciseId: `e${index + 1}`, timestamp: day.toISOString() }),
          ),
          attempt({ id: 6, exerciseId: 'e6', timestamp: day.toISOString(), correct: false }),
        ];
      } else if (id === 'second-lesson') {
        completions = [
          completion('es-a', day.toISOString()),
          completion('es-b', day.toISOString()),
        ];
      } else {
        completions = [completion('es-a', day.toISOString(), { durationMs: 600_000 })];
      }

      const quest = deriveRotatingQuest(input(attempts, completions, day));
      expect(quest.id).toBe(id);
      expect(quest.completed).toBe(true);

      if (id === 'practice-scenario') expect(quest.progress).toBe(1);
      if (id === 'correct-answers') expect(quest.progress).toBe(5);
      if (id === 'second-lesson') expect(quest.progress).toBe(2);
      if (id === 'study-minutes') expect(quest.progress).toBe(10);
    }
  });
});

describe('weekly challenges', () => {
  const midweek = localDay(26);

  it('counts only activity inside the Monday-to-Sunday window', () => {
    const attempts = [
      attempt({ timestamp: localDay(24).toISOString(), source: 'practice' }),
      attempt({ id: 2, timestamp: localDay(22).toISOString(), source: 'review' }),
    ];
    const completions = [
      completion('es-a', localDay(24).toISOString()),
      completion('es-old', localDay(22).toISOString()),
    ];
    const { window, challenges } = deriveWeeklyChallenges(input(attempts, completions, midweek));
    expect(window.startKey).toBe('2026-11-23');
    expect(window.endKey).toBe('2026-11-30');
    expect(challenges).toHaveLength(4);
    expect(challenges.find((item) => item.id === 'week-answers')?.progress).toBe(1);
    expect(challenges.find((item) => item.id === 'week-reviews')?.progress).toBe(0);
    expect(challenges.find((item) => item.id === 'week-xp')?.progress).toBe(25);
    expect(challenges.find((item) => item.id === 'week-days')?.progress).toBe(1);
  });

  it('keeps three visible challenges with zero values for a new learner', () => {
    const { challenges } = deriveWeeklyChallenges(input([], [], midweek));
    expect(challenges).toHaveLength(4);
    expect(challenges.every((challenge) => challenge.progress === 0 && !challenge.completed)).toBe(true);
  });
});

describe('habit garden', () => {
  it('marks only real active days and never punishes empty ones', () => {
    const today = localDay(26);
    const garden = deriveHabitGarden({
      completions: [completion('es-a', localDay(24).toISOString())],
      attempts: [],
      now: today,
    });
    expect(garden.days).toHaveLength(28);
    expect(garden.activeDays).toBe(1);
    expect(garden.totalXp).toBe(25);
    expect(garden.days[27].isToday).toBe(true);
    expect(garden.days[27].active).toBe(false);
    expect(garden.days[25].active).toBe(true);
    expect(garden.days[25].xp).toBe(25);
  });
});
