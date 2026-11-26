import type { Attempt, Lesson, LessonCompletion, Profile, VocabularyItem } from './types';
import { accuracyPercent } from './scoring';

export const DAY_MS = 24 * 60 * 60 * 1000;

export function dateKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export interface ActivityEvent {
  date: string;
  xp: number;
  durationMs: number;
  source: 'lesson' | 'practice' | 'review' | 'tutor';
}

export function buildEvents(completions: LessonCompletion[], attempts: Attempt[]): ActivityEvent[] {
  const events: ActivityEvent[] = completions.map((item) => ({
    date: item.completedAt,
    xp: item.xpAwarded,
    durationMs: item.durationMs,
    source: 'lesson' as const,
  }));

  for (const attempt of attempts) {
    if (attempt.source === 'lesson') continue;
    events.push({
      date: attempt.timestamp,
      xp: attempt.xpAwarded,
      durationMs: attempt.durationMs,
      source: attempt.source === 'practice' ? 'practice' : attempt.source === 'tutor' ? 'tutor' : 'review',
    });
  }
  return events;
}

export function xpOnDate(events: ActivityEvent[], key: string): number {
  return events.filter((event) => dateKey(event.date) === key).reduce((sum, event) => sum + event.xp, 0);
}

/** A missing day never removes earned days: a streak stays alive across today or yesterday. */
export function calculateStreak(events: ActivityEvent[], now = new Date()): number {
  const activeDays = new Set(events.filter((event) => event.xp > 0 || event.durationMs > 0).map((event) => dateKey(event.date)));
  if (activeDays.size === 0) return 0;

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!activeDays.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDays.has(dateKey(cursor))) return 0;
  }

  let streak = 0;
  while (activeDays.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function weeklyActivity(events: ActivityEvent[], now = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
    const key = dateKey(date);
    return {
      key,
      label: date.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 1),
      date,
      xp: xpOnDate(events, key),
      minutes: Math.round(
        events.filter((event) => dateKey(event.date) === key).reduce((sum, event) => sum + event.durationMs, 0) / 60_000,
      ),
    };
  });
}

export interface CategoryStat {
  category: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface RepeatedMistake {
  key: string;
  prompt: string;
  answer: string;
  count: number;
}

export interface Analytics {
  totalXp: number;
  todayXp: number;
  streak: number;
  studyMinutes: number;
  completedLessons: number;
  vocabularyLearned: number;
  accuracy: number;
  totalAttempts: number;
  week: ReturnType<typeof weeklyActivity>;
  categories: CategoryStat[];
  strongest: CategoryStat | null;
  weakest: CategoryStat | null;
  mistakes: RepeatedMistake[];
  personalBestXp: number;
  personalBestStreak: number;
}

export function deriveAnalytics(
  completions: LessonCompletion[],
  attempts: Attempt[],
  vocabulary: VocabularyItem[],
  now = new Date(),
): Analytics {
  const events = buildEvents(completions, attempts);
  const categoryMap = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) {
    const current = categoryMap.get(attempt.category) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (attempt.correct) current.correct += 1;
    categoryMap.set(attempt.category, current);
  }
  const categories: CategoryStat[] = [...categoryMap.entries()]
    .map(([category, value]) => ({
      category,
      ...value,
      accuracy: accuracyPercent(value.correct, value.total),
    }))
    .filter((item) => item.total >= 2)
    .sort((a, b) => b.accuracy - a.accuracy);

  const mistakeMap = new Map<string, RepeatedMistake>();
  for (const attempt of attempts.filter((item) => !item.correct)) {
    const key = `${attempt.exerciseId}:${attempt.correctAnswer.toLowerCase()}`;
    const existing = mistakeMap.get(key);
    if (existing) existing.count += 1;
    else
      mistakeMap.set(key, {
        key,
        prompt: attempt.lessonId,
        answer: attempt.correctAnswer,
        count: 1,
      });
  }

  const correctAttempts = attempts.filter((attempt) => attempt.correct).length;
  const dailyXp = weeklyActivity(events, now).map((day) => day.xp);

  return {
    totalXp: events.reduce((sum, event) => sum + event.xp, 0),
    todayXp: xpOnDate(events, dateKey(now)),
    streak: calculateStreak(events, now),
    studyMinutes: Math.round(events.reduce((sum, event) => sum + event.durationMs, 0) / 60_000),
    completedLessons: completions.length,
    vocabularyLearned: vocabulary.filter((item) => item.familiarity >= 1 || item.correctCount > 0).length,
    accuracy: accuracyPercent(correctAttempts, attempts.length),
    totalAttempts: attempts.length,
    week: weeklyActivity(events, now),
    categories,
    strongest: categories[0] ?? null,
    weakest: categories.length > 1 ? categories[categories.length - 1] : null,
    mistakes: [...mistakeMap.values()].sort((a, b) => b.count - a.count).slice(0, 6),
    personalBestXp: Math.max(0, ...dailyXp),
    personalBestStreak: calculateStreak(events, now),
  };
}

export function isLessonUnlocked(lessonId: string, lessons: Lesson[], completions: LessonCompletion[]): boolean {
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index <= 0) return true;
  const completedIds = new Set(completions.map((item) => item.lessonId));
  return completedIds.has(lessons[index - 1].id) || completedIds.has(lessonId);
}

export function recommendLesson(profile: Profile, lessons: Lesson[], completions: LessonCompletion[]): Lesson {
  const startIndex =
    profile.level === 'beginner' ? 0 : profile.level === 'elementary' ? 4 : profile.level === 'intermediate' ? 10 : 14;
  const completed = new Set(completions.map((item) => item.lessonId));
  const isUnlocked = (lesson: Lesson) => {
    const index = lessons.findIndex((item) => item.id === lesson.id);
    return index <= 0 || completed.has(lessons[index - 1].id) || completed.has(lesson.id);
  };
  const preferred = profile.recommendedLessonId
    ? lessons.find((lesson) => lesson.id === profile.recommendedLessonId)
    : undefined;
  const candidates = preferred ? [preferred, ...lessons] : [...lessons.slice(startIndex), ...lessons.slice(0, startIndex)];
  const next = candidates.find((lesson) => !completed.has(lesson.id) && isUnlocked(lesson));
  return next ?? lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons[lessons.length - 1];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  progress: string;
}

export function deriveAchievements(analytics: Analytics, reviewCount: number, tutorSessions: number): Achievement[] {
  return [
    {
      id: 'first-steps',
      title: 'Primeiros passos',
      description: 'Conclua a sua primeira lição.',
      earned: analytics.completedLessons >= 1,
      progress: `${Math.min(analytics.completedLessons, 1)}/1 lição`,
    },
    {
      id: 'weekly-fire',
      title: 'Sequência de 7 dias',
      description: 'Estude em sete dias consecutivos.',
      earned: analytics.streak >= 7,
      progress: `${Math.min(analytics.streak, 7)}/7 dias`,
    },
    {
      id: 'word-collector',
      title: 'Colecionador',
      description: 'Guarde 50 palavras no caderno.',
      earned: analytics.vocabularyLearned >= 50,
      progress: `${Math.min(analytics.vocabularyLearned, 50)}/50 palavras`,
    },
    {
      id: 'sharp-ear',
      title: 'Ouvido atento',
      description: 'Faça 20 revisões de vocabulário.',
      earned: reviewCount >= 20,
      progress: `${Math.min(reviewCount, 20)}/20 revisões`,
    },
    {
      id: 'conversation-starter',
      title: 'Voz ativa',
      description: 'Conclua 3 conversas com o tutor.',
      earned: tutorSessions >= 3,
      progress: `${Math.min(tutorSessions, 3)}/3 conversas`,
    },
    {
      id: 'century',
      title: 'Centenário',
      description: 'Junte 100 XP.',
      earned: analytics.totalXp >= 100,
      progress: `${Math.min(analytics.totalXp, 100)}/100 XP`,
    },
  ];
}
