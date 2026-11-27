import { buildEvents, dateKey, type Analytics } from './analytics';
import type { Attempt, LessonCompletion, Profile, VocabularyItem } from './types';

const DAY_MS = 86_400_000;

export type RotatingQuestId =
  | 'practice-scenario'
  | 'correct-answers'
  | 'second-lesson'
  | 'study-minutes'
  | 'listening-reps'
  | 'perfect-lesson'
  | 'notebook-words';
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

const ROTATING_ORDER: RotatingQuestId[] = [
  'practice-scenario',
  'correct-answers',
  'second-lesson',
  'study-minutes',
  'listening-reps',
  'perfect-lesson',
  'notebook-words',
];

/** Duas missões extra por dia, determinísticas pela data local — nunca dependem de recompensas guardadas. */
export function rotatingQuestIdsFor(now: Date = new Date()): [RotatingQuestId, RotatingQuestId] {
  const index = dayNumber(dateKey(now)) % ROTATING_ORDER.length;
  return [ROTATING_ORDER[index], ROTATING_ORDER[(index + 3) % ROTATING_ORDER.length]];
}

/** Rotation is deterministic by local calendar day; it never depends on stored rewards. */
export function rotatingQuestIdFor(now: Date = new Date()): RotatingQuestId {
  return rotatingQuestIdsFor(now)[0];
}

/** Uma missão extra do dia, medida apenas a partir de atividade guardada — em `slot` 0 ou 1 (as duas do dia). */
export function deriveRotatingQuest(input: GamificationInput, slot: 0 | 1 = 0): Quest {
  const { profile, completions, attempts, vocabulary, now = new Date() } = input;
  const today = dateKey(now);
  const attemptsToday = attempts.filter((item) => dateKey(item.timestamp) === today);
  const completionsToday = completions.filter((item) => dateKey(item.completedAt) === today);
  const lessonsToday = completionsToday.length;
  const minutesToday = Math.round(
    buildEvents(completions, attempts)
      .filter((event) => dateKey(event.date) === today)
      .reduce((sum, event) => sum + event.durationMs, 0) / 60_000,
  );
  const id = rotatingQuestIdsFor(now)[slot];

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
  } else if (id === 'listening-reps') {
    progress = attemptsToday.filter((item) => item.exerciseType === 'listening').length;
    title = 'Ouve e responde 2 vezes';
    description = 'Exercícios de escuta respondidos hoje contam — a transcrição aparece na correção.';
    target = 2;
    unit = 'escutas';
    href = '/learn';
  } else if (id === 'perfect-lesson') {
    progress = completionsToday.filter((item) => item.totalExercises > 0 && item.correctCount === item.totalExercises).length;
    title = 'Fecha uma lição sem erros';
    description = 'Uma lição com todas as respostas certas, guardada hoje, conta uma vez.';
    target = 1;
    unit = 'lição perfeita';
    href = '/learn';
  } else if (id === 'notebook-words') {
    progress = vocabulary.filter((item) => dateKey(item.createdAt) === today).length;
    title = 'Guarda 2 palavras no caderno';
    description = 'Palavras adicionadas hoje ao teu caderno — das lições ou à mão.';
    target = 2;
    unit = 'palavras';
    href = '/vocabulary';
  } else {
    progress = minutesToday;
    title = `Estuda ${profile.dailyGoalMinutes} minutos`;
    description = 'O tempo vem de lições, prática e revisões guardadas hoje.';
    target = profile.dailyGoalMinutes;
    unit = 'minutos';
  }

  return makeQuest(id, title, description, progress, target, unit, href);
}

/** Quatro missões fixas mais duas extra, determinísticas pela data. Nenhuma recompensa é inventada. */
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
    deriveRotatingQuest(input, 0),
    deriveRotatingQuest(input, 1),
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

export type WeeklyChallengeId =
  | 'week-xp'
  | 'week-days'
  | 'week-answers'
  | 'week-reviews'
  | 'week-minutes'
  | 'week-perfect';

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
  {
    id: 'week-minutes',
    title: 'Estuda 45 minutos',
    description: 'Minutos somados de lições, prática e revisões guardadas esta semana.',
    target: 45,
    unit: 'minutos',
    href: '/learn',
  },
  {
    id: 'week-perfect',
    title: 'Fecha 2 lições sem erros',
    description: 'Lições com todas as respostas certas. Sem bónus — só a tua precisão real.',
    target: 2,
    unit: 'lições perfeitas',
    href: '/learn',
  },
];

/** Weekly order rotates, but the four shown numbers always come from this week's saved activity. */
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
  const minutesInWeek = Math.round(events.reduce((sum, event) => sum + event.durationMs, 0) / 60_000);
  const perfectLessons = completions.filter(
    (item) => inWeek(item.completedAt) && item.totalExercises > 0 && item.correctCount === item.totalExercises,
  ).length;
  const measures: Record<WeeklyChallengeId, number> = {
    'week-xp': events.reduce((sum, event) => sum + event.xp, 0),
    'week-days': activeDays,
    'week-answers': attemptsInWeek.length,
    'week-reviews': attemptsInWeek.filter((attempt) => attempt.source === 'review').length,
    'week-minutes': minutesInWeek,
    'week-perfect': perfectLessons,
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

export type MonthlyChallengeId = 'month-xp' | 'month-days' | 'month-answers' | 'month-lessons';

export interface MonthlyChallenge {
  id: MonthlyChallengeId;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  completed: boolean;
  href: string;
  monthLabel: string;
}

export interface MonthWindow {
  start: Date;
  startExclusive: Date;
  startKey: string;
  endKey: string;
  label: string;
}

/** Local calendar month, so month numbers match the learner's calendar. */
export function monthWindow(now: Date = new Date()): MonthWindow {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const endExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const label = start.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  return {
    start,
    startExclusive: endExclusive,
    startKey: dateKey(start),
    endKey: dateKey(endExclusive),
    label,
  };
}

const MONTHLY_TEMPLATES: Array<Omit<MonthlyChallenge, 'progress' | 'completed' | 'monthLabel'>> = [
  {
    id: 'month-xp',
    title: 'Junta 400 XP este mês',
    description: 'Todo o XP de lições, prática e revisões guardado no mês conta.',
    target: 400,
    unit: 'XP',
    href: '/learn',
  },
  {
    id: 'month-days',
    title: 'Estuda em 12 dias do mês',
    description: 'Dias com pelo menos uma atividade guardada. Dias sem estudo não retiram nada.',
    target: 12,
    unit: 'dias',
    href: '/learn',
  },
  {
    id: 'month-answers',
    title: 'Responde 120 vezes',
    description: 'Respostas de lições, prática e revisão guardadas no mês.',
    target: 120,
    unit: 'respostas',
    href: '/practice',
  },
  {
    id: 'month-lessons',
    title: 'Conclui 8 lições',
    description: 'Lições completadas no mês, nesta língua ou linguagem.',
    target: 8,
    unit: 'lições',
    href: '/learn',
  },
];

/** Um desafio grande por mês, escolhido pelo calendário local; o progresso é sempre real e guardado. */
export function deriveMonthlyChallenge(input: GamificationInput): MonthlyChallenge {
  const { completions, attempts, now = new Date() } = input;
  const window = monthWindow(now);
  const inMonth = (timestamp: string) => {
    const key = dateKey(timestamp);
    return key >= window.startKey && key < window.endKey;
  };
  const events = buildEvents(completions, attempts).filter((event) => inMonth(event.date));
  const attemptsInMonth = attempts.filter((attempt) => inMonth(attempt.timestamp));
  const activeDays = new Set(
    events.filter((event) => event.xp > 0 || event.durationMs > 0).map((event) => dateKey(event.date)),
  ).size;
  const monthIndex = now.getFullYear() * 12 + now.getMonth();
  const template = MONTHLY_TEMPLATES[monthIndex % MONTHLY_TEMPLATES.length];
  const measures: Record<MonthlyChallengeId, number> = {
    'month-xp': events.reduce((sum, event) => sum + event.xp, 0),
    'month-days': activeDays,
    'month-answers': attemptsInMonth.length,
    'month-lessons': completions.filter((item) => inMonth(item.completedAt)).length,
  };
  return {
    ...template,
    monthLabel: window.label,
    progress: Math.max(0, Math.min(measures[template.id], template.target)),
    completed: measures[template.id] >= template.target,
  };
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
