import { buildEvents, dateKey, type Analytics } from './analytics';
import type { Attempt, LessonCompletion, Profile, VocabularyItem } from './types';

const DAY_MS = 86_400_000;

export type RotatingQuestId = 'practice-scenario' | 'correct-answers' | 'second-lesson' | 'study-minutes';
export type QuestId = 'first-lesson' | 'answers' | 'xp' | 'review' | RotatingQuestId;

export interface Quest {
  id: QuestId;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  completed: boolean;
  href: string;
}

export interface GamificationInput {
  analytics: Analytics;
  profile: Profile;
  completions: LessonCompletion[];
  attempts: Attempt[];
  vocabulary: VocabularyItem[];
  now?: Date;
}

function makeQuest(
  id: QuestId,
  title: string,
  description: string,
  progress: number,
  target: number,
  unit: string,
  href: string,
): Quest {
  return {
    id,
    title,
    description,
    progress: Math.max(0, Math.min(progress, target)),
    target,
    unit,
    completed: progress >= target,
    href,
  };
}

function dayNumber(key: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return 0;
  return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS);
}

const ROTATING_ORDER: RotatingQuestId[] = ['practice-scenario', 'correct-answers', 'second-lesson', 'study-minutes'];

/** Rotation is deterministic by local calendar day; it never depends on stored rewards. */
export function rotatingQuestIdFor(now: Date = new Date()): RotatingQuestId {
  return ROTATING_ORDER[dayNumber(dateKey(now)) % ROTATING_ORDER.length];
}

/** A changing quest measured only from activity saved for the current day. */
export function deriveRotatingQuest(input: GamificationInput): Quest {
  const { profile, completions, attempts, now = new Date() } = input;
  const today = dateKey(now);
  const attemptsToday = attempts.filter((item) => dateKey(item.timestamp) === today);
  const lessonsToday = completions.filter((item) => dateKey(item.completedAt) === today).length;
  const minutesToday = Math.round(
    buildEvents(completions, attempts)
      .filter((event) => dateKey(event.date) === today)
      .reduce((sum, event) => sum + event.durationMs, 0) / 60_000,
  );
  const id = rotatingQuestIdFor(now);

  let title = '';
  let description = '';
  let progress = 0;
  let target = 1;
  let unit = '';
  let href = '/learn';

  if (id === 'practice-scenario') {
    progress = new Set(attemptsToday.filter((item) => item.source === 'practice').map((item) => item.lessonId)).size;
    title = 'Pratica um cenário';
    description = 'Um cenário de prática começado hoje conta uma vez.';
    unit = 'cenário';
    href = '/practice';
  } else if (id === 'correct-answers') {
    progress = attemptsToday.filter((item) => item.correct).length;
    title = 'Acerta 5 respostas';
    description = 'Conta apenas respostas corretas guardadas hoje.';
    target = 5;
    unit = 'respostas certas';
  } else if (id === 'second-lesson') {
    progress = lessonsToday;
    title = 'Conclui duas lições';
    description = 'Cada lição guardada como concluída conta uma vez.';
    target = 2;
    unit = 'lições';
  } else {
    progress = minutesToday;
    title = `Estuda ${profile.dailyGoalMinutes} minutos`;
    description = 'O tempo vem de lições, prática e revisões guardadas hoje.';
    target = profile.dailyGoalMinutes;
    unit = 'minutos';
  }

  return makeQuest(id, title, description, progress, target, unit, href);
}

/** Core quests plus one deterministic rotating quest. No rewards are invented. */
export function deriveDailyQuests(input: GamificationInput): Quest[] {
  const { analytics, profile, completions, attempts, vocabulary, now = new Date() } = input;
  const today = dateKey(now);
  const lessonsToday = completions.filter((item) => dateKey(item.completedAt) === today).length;
  const attemptsToday = attempts.filter((item) => dateKey(item.timestamp) === today);
  const reviewsToday = attemptsToday.filter((item) => item.source === 'review').length;
  const xpTarget = profile.dailyGoalMinutes * 2;
  const overdue = vocabulary.filter((item) => new Date(item.nextReviewAt).getTime() <= now.getTime()).length;

  return [
    makeQuest('first-lesson', 'Conclui uma lição', 'Uma lição completa conta para a meta diária.', lessonsToday, 1, 'lição', '/learn'),
    makeQuest('answers', 'Responde 10 vezes', 'Cada resposta guardada nas lições, prática ou revisão conta.', attemptsToday.length, 10, 'respostas', '/practice'),
    makeQuest('xp', `Ganha ${xpTarget} XP`, 'Só entra XP realmente atribuído por atividade guardada.', analytics.todayXp, xpTarget, 'XP', '/learn'),
    makeQuest(
      'review',
      'Revisa 3 palavras',
      overdue > 0 ? `Tens ${overdue} palavras com revisão pendente.` : 'Mantém o caderno em dia quando houver revisões.',
      reviewsToday,
      3,
      'revisões',
      '/review',
    ),
    deriveRotatingQuest(input),
  ];
}

export interface League {
  id: string;
  name: string;
  emblem: string;
  minXp: number;
  next: { name: string; minXp: number } | null;
  progress: number;
  target: number;
  percent: number;
}

const LEAGUES = [
  { id: 'bronze', name: 'Bronze', emblem: '🥉', minXp: 0 },
  { id: 'silver', name: 'Prata', emblem: '🥈', minXp: 100 },
  { id: 'gold', name: 'Ouro', emblem: '🥇', minXp: 300 },
  { id: 'sapphire', name: 'Safira', emblem: '💎', minXp: 700 },
  { id: 'diamond', name: 'Diamante', emblem: '👑', minXp: 1500 },
] as const;

/** A personal ladder: thresholds come from the learner's own saved XP, never from fake rivals. */
export function deriveLeague(totalXp: number): League {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let index = 0;
  for (let i = LEAGUES.length - 1; i >= 0; i -= 1) {
    if (safeXp >= LEAGUES[i].minXp) {
      index = i;
      break;
    }
  }
  const current = LEAGUES[index];
  const next = LEAGUES[index + 1] ?? null;
  const progress = next ? safeXp - current.minXp : safeXp;
  const target = next ? next.minXp - current.minXp : Math.max(1, safeXp);
  return {
    id: current.id,
    name: current.name,
    emblem: current.emblem,
    minXp: current.minXp,
    next: next ? { name: next.name, minXp: next.minXp } : null,
    progress: Math.min(progress, target),
    target,
    percent: Math.min(100, Math.round((progress / target) * 100)),
  };
}

export type WeeklyChallengeId = 'week-xp' | 'week-days' | 'week-answers' | 'week-reviews';

export interface WeeklyChallenge {
  id: WeeklyChallengeId;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  completed: boolean;
  href: string;
}

export interface WeekWindow {
  start: Date;
  startExclusive: Date;
  startKey: string;
  endKey: string;
  label: string;
}

/** Local Monday-to-Sunday window, so weekly numbers match the learner's calendar. */
export function weekWindow(now: Date = new Date()): WeekWindow {
  const offset = (now.getDay() + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  const endExclusive = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  const endInclusive = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const format = (date: Date) => date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  return {
    start,
    startExclusive: endExclusive,
    startKey: dateKey(start),
    endKey: dateKey(endExclusive),
    label: `${format(start)} – ${format(endInclusive)}`,
  };
}

const WEEKLY_TEMPLATES: Array<Omit<WeeklyChallenge, 'progress' | 'completed'>> = [
  {
    id: 'week-xp',
    title: 'Junta 150 XP',
    description: 'XP somado por lições, prática e revisões guardadas esta semana.',
    target: 150,
    unit: 'XP',
    href: '/learn',
  },
  {
    id: 'week-days',
    title: 'Pratica em 3 dias',
    description: 'Conta dias com pelo menos uma atividade guardada. Faltar não retira XP.',
    target: 3,
    unit: 'dias',
    href: '/learn',
  },
  {
    id: 'week-answers',
    title: 'Responde 40 vezes',
    description: 'Inclui respostas de lições, prática e revisão guardadas esta semana.',
    target: 40,
    unit: 'respostas',
    href: '/practice',
  },
  {
    id: 'week-reviews',
    title: 'Faz 10 revisões',
    description: 'Cada revisão de vocabulário guardada conta uma vez.',
    target: 10,
    unit: 'revisões',
    href: '/review',
  },
];

/** Weekly order rotates, but the three numbers always come from this week's saved activity. */
export function deriveWeeklyChallenges(input: GamificationInput): {
  window: WeekWindow;
  challenges: WeeklyChallenge[];
} {
  const { completions, attempts, now = new Date() } = input;
  const window = weekWindow(now);
  const inWeek = (timestamp: string) => {
    const key = dateKey(timestamp);
    return key >= window.startKey && key < window.endKey;
  };
  const events = buildEvents(completions, attempts).filter((event) => inWeek(event.date));
  const attemptsInWeek = attempts.filter((attempt) => inWeek(attempt.timestamp));
  const activeDays = new Set(events.filter((event) => event.xp > 0 || event.durationMs > 0).map((event) => dateKey(event.date))).size;
  const measures: Record<WeeklyChallengeId, number> = {
    'week-xp': events.reduce((sum, event) => sum + event.xp, 0),
    'week-days': activeDays,
    'week-answers': attemptsInWeek.length,
    'week-reviews': attemptsInWeek.filter((attempt) => attempt.source === 'review').length,
  };
  const offset = Math.floor(dayNumber(window.startKey) / 7);
  const challenges = WEEKLY_TEMPLATES.map((_, index) => WEEKLY_TEMPLATES[(index + offset) % WEEKLY_TEMPLATES.length]).map(
    (template) => ({
      ...template,
      progress: Math.max(0, Math.min(measures[template.id], template.target)),
      completed: measures[template.id] >= template.target,
    }),
  );
  return { window, challenges };
}

export interface HabitDay {
  key: string;
  label: string;
  active: boolean;
  xp: number;
  minutes: number;
  isToday: boolean;
}

export interface HabitGarden {
  days: HabitDay[];
  activeDays: number;
  totalXp: number;
  totalMinutes: number;
}

/** 28 real calendar days. Empty days are simply empty; they never subtract progress. */
export function deriveHabitGarden(input: Pick<GamificationInput, 'completions' | 'attempts' | 'now'>): HabitGarden {
  const { completions, attempts, now = new Date() } = input;
  const today = dateKey(now);
  const byDay = new Map<string, { xp: number; durationMs: number }>();
  for (const event of buildEvents(completions, attempts)) {
    const key = dateKey(event.date);
    const current = byDay.get(key) ?? { xp: 0, durationMs: 0 };
    current.xp += event.xp;
    current.durationMs += event.durationMs;
    byDay.set(key, current);
  }

  const days: HabitDay[] = Array.from({ length: 28 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (27 - index));
    const key = dateKey(date);
    const value = byDay.get(key) ?? { xp: 0, durationMs: 0 };
    return {
      key,
      label: date.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '').slice(0, 2).toUpperCase(),
      active: value.xp > 0 || value.durationMs > 0,
      xp: value.xp,
      minutes: Math.round(value.durationMs / 60_000),
      isToday: key === today,
    };
  });

  return {
    days,
    activeDays: days.filter((day) => day.active).length,
    totalXp: days.reduce((sum, day) => sum + day.xp, 0),
    totalMinutes: days.reduce((sum, day) => sum + day.minutes, 0),
  };
}
