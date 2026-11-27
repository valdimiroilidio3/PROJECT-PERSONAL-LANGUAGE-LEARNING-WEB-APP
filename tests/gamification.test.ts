import { describe, expect, it } from 'vitest';
import { deriveAnalytics } from '../lib/analytics';
import {
  deriveDailyQuests,
  deriveHabitGarden,
  deriveLeague,
  deriveMonthlyChallenge,
  deriveRotatingQuest,
  deriveWeeklyChallenges,
  monthWindow,
  rotatingQuestIdFor,
  rotatingQuestIdsFor,
  type RotatingQuestId,
} from '../lib/gamification';
import type { Attempt, LessonCompletion, Profile, VocabularyItem } from '../lib/types';

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

const vocabularyItem = (id: string, createdAt: string): VocabularyItem => ({
  id,
  term: `palavra-${id}`,
  translation: `palavra-${id}`,
  example: `exemplo ${id}`,
  context: 'manual',
  familiarity: 0.2,
  lastReviewedAt: null,
  nextReviewAt: createdAt,
  correctCount: 0,
  incorrectCount: 0,
  source: 'manual',
  createdAt,
});

function input(
  attempts: Attempt[],
  completions: LessonCompletion[] = [],
  at: Date = now,
  vocabulary: VocabularyItem[] = [],
) {
  return {
    analytics: deriveAnalytics(completions, attempts, vocabulary, at),
    profile,
    completions,
    attempts,
    vocabulary,
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
    expect(quests).toHaveLength(6);
    expect(quests.slice(0, 4).every((quest) => quest.progress === 0 && !quest.completed)).toBe(true);
    expect(quests.find((quest) => quest.id === 'xp')?.target).toBe(20);
    const rotating = quests.slice(4);
    expect(new Set(rotating.map((quest) => quest.id)).size).toBe(2);
    expect(rotating.every((quest) => quest.progress === 0)).toBe(true);
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

describe('rotating daily quests', () => {
  it('offers two distinct quests per day, stable for the same day and changing over time', () => {
    const ids = fourDays.map((day) => rotatingQuestIdsFor(day));
    for (const pair of ids) {
      expect(pair[0]).not.toBe(pair[1]);
    }
    expect(rotatingQuestIdsFor(fourDays[0])).toEqual(ids[0]);
    expect(rotatingQuestIdFor(fourDays[0])).toBe(ids[0][0]);
    const firstSlots = ids.map((pair) => pair[0]);
    expect(new Set(firstSlots).size).toBe(4);
  });

  it('measures each variant from saved activity only', () => {
    const expected: RotatingQuestId[] = [
      'practice-scenario',
      'correct-answers',
      'second-lesson',
      'study-minutes',
      'listening-reps',
      'perfect-lesson',
      'notebook-words',
    ];
    const days = Array.from({ length: 28 }, (_, index) => {
      const day = localDay(26);
      day.setDate(day.getDate() + index);
      return day;
    });

    for (const id of expected) {
      let targetDay: Date | undefined;
      let slot: 0 | 1 = 0;
      for (const day of days) {
        const ids = rotatingQuestIdsFor(day);
        if (ids[0] === id) {
          targetDay = day;
          slot = 0;
          break;
        }
        if (ids[1] === id) {
          targetDay = day;
          slot = 1;
          break;
        }
      }
      expect(targetDay, `quest ${id} should appear within 28 days`).toBeDefined();
      const dayIso = targetDay!.toISOString();

      let attempts: Attempt[] = [];
      let completions: LessonCompletion[] = [];
      let vocabulary: VocabularyItem[] = [];

      if (id === 'practice-scenario') {
        attempts = [
          attempt({ timestamp: dayIso, source: 'practice', lessonId: 'scenario-a' }),
          attempt({ id: 2, timestamp: dayIso, source: 'practice', lessonId: 'scenario-a', exerciseId: 'e2' }),
        ];
      } else if (id === 'correct-answers') {
        attempts = [
          ...Array.from({ length: 5 }, (_, index) =>
            attempt({ id: index + 1, exerciseId: `e${index + 1}`, timestamp: dayIso }),
          ),
          attempt({ id: 6, exerciseId: 'e6', timestamp: dayIso, correct: false }),
        ];
      } else if (id === 'second-lesson') {
        completions = [
          completion('es-a', dayIso),
          completion('es-b', dayIso),
        ];
      } else if (id === 'study-minutes') {
        completions = [completion('es-a', dayIso, { durationMs: 600_000 })];
      } else if (id === 'listening-reps') {
        attempts = [
          attempt({ timestamp: dayIso, exerciseType: 'listening' }),
          attempt({ id: 2, timestamp: dayIso, exerciseType: 'listening', exerciseId: 'e2' }),
          attempt({ id: 3, timestamp: dayIso, exerciseType: 'multiple-choice', exerciseId: 'e3' }),
        ];
      } else if (id === 'perfect-lesson') {
        completions = [completion('es-a', dayIso, { correctCount: 6, totalExercises: 6 })];
      } else {
        vocabulary = [vocabularyItem('v1', dayIso), vocabularyItem('v2', dayIso)];
      }

      const quest = deriveRotatingQuest(input(attempts, completions, targetDay!, vocabulary), slot);
      expect(quest.id).toBe(id);
      expect(quest.completed).toBe(true);

      if (id === 'practice-scenario') expect(quest.progress).toBe(1);
      if (id === 'correct-answers') expect(quest.progress).toBe(5);
      if (id === 'second-lesson') expect(quest.progress).toBe(2);
      if (id === 'study-minutes') expect(quest.progress).toBe(10);
      if (id === 'listening-reps') expect(quest.progress).toBe(2);
      if (id === 'perfect-lesson') expect(quest.progress).toBe(1);
      if (id === 'notebook-words') expect(quest.progress).toBe(2);
    }
  });
});

describe('weekly challenges', () => {
  const midweek = localDay(26);

  it('counts only activity inside the Monday-to-Sunday window', () => {
    const attempts = [
      attempt({ timestamp: localDay(24).toISOString(), source: 'practice', durationMs: 60_000 }),
      attempt({ id: 2, timestamp: localDay(22).toISOString(), source: 'review' }),
    ];
    const completions = [
      completion('es-a', localDay(24).toISOString(), { durationMs: 120_000 }),
      completion('es-old', localDay(22).toISOString()),
    ];
    const { window, challenges } = deriveWeeklyChallenges(input(attempts, completions, midweek));
    expect(window.startKey).toBe('2026-11-23');
    expect(window.endKey).toBe('2026-11-30');
    expect(challenges).toHaveLength(6);
    expect(challenges.find((item) => item.id === 'week-answers')?.progress).toBe(1);
    expect(challenges.find((item) => item.id === 'week-reviews')?.progress).toBe(0);
    expect(challenges.find((item) => item.id === 'week-xp')?.progress).toBe(25);
    expect(challenges.find((item) => item.id === 'week-days')?.progress).toBe(1);
    // Uma lição perfeita (6/6) dentro da semana; a de 22/11 fica fora.
    expect(challenges.find((item) => item.id === 'week-perfect')?.progress).toBe(1);
    // 120s da lição + 60s da prática → 3 minutos.
    expect(challenges.find((item) => item.id === 'week-minutes')?.progress).toBe(3);
  });

  it('keeps all challenges at zero for a new learner', () => {
    const { challenges } = deriveWeeklyChallenges(input([], [], midweek));
    expect(challenges).toHaveLength(6);
    expect(challenges.every((challenge) => challenge.progress === 0 && !challenge.completed)).toBe(true);
  });
});

describe('monthly challenge', () => {
  const midMonth = localDay(26);

  it('measures only activity inside the calendar month', () => {
    const attempts = [
      attempt({ timestamp: localDay(24).toISOString() }),
      attempt({ id: 2, timestamp: '2026-10-31T10:00:00.000Z' }),
    ];
    const completions = [
      completion('es-a', localDay(24).toISOString()),
      completion('es-old', '2026-10-31T10:00:00.000Z'),
    ];
    const monthly = deriveMonthlyChallenge(input(attempts, completions, midMonth));
    expect(monthly.monthLabel).toMatch(/2026/);
    expect(monthly.target).toBeGreaterThan(0);
    // Novembro (tentativas: 1 de 2; XP: 25 de 50; lições: 1 de 2; dias ativos: 1) — o que conta para o desafio do mês reflete só novembro.
    if (monthly.id === 'month-answers') expect(monthly.progress).toBe(1);
    else if (monthly.id === 'month-xp') expect(monthly.progress).toBe(25);
    else if (monthly.id === 'month-lessons') expect(monthly.progress).toBe(1);
    else expect(monthly.progress).toBe(1); // month-days: um dia ativo em novembro
  });

  it('starts at zero for a new learner', () => {
    const monthly = deriveMonthlyChallenge(input([], [], midMonth));
    expect(monthly.progress).toBe(0);
    expect(monthly.completed).toBe(false);
    expect(monthly.monthLabel.toLowerCase()).toContain('novembro');
  });

  it('gives a whole-month window with correct boundaries', () => {
    const window = monthWindow(new Date(2026, 0, 15));
    expect(window.startKey).toBe('2026-01-01');
    expect(window.endKey).toBe('2026-02-01');
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
