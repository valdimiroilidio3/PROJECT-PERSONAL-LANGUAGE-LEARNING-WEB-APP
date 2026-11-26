import { dateKey, type Analytics } from './analytics';
import type { Attempt, LessonCompletion, Profile, VocabularyItem } from './types';

export interface Quest {
  id: 'first-lesson' | 'answers' | 'xp' | 'review';
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  completed: boolean;
  href: string;
}

interface QuestInput {
  analytics: Analytics;
  profile: Profile;
  completions: LessonCompletion[];
  attempts: Attempt[];
  vocabulary: VocabularyItem[];
  now?: Date;
}

/** Quests are generated from today's saved activity. No rewards are invented. */
export function deriveDailyQuests({
  analytics,
  profile,
  completions,
  attempts,
  vocabulary,
  now = new Date(),
}: QuestInput): Quest[] {
  const today = dateKey(now);
  const lessonsToday = completions.filter((item) => dateKey(item.completedAt) === today).length;
  const attemptsToday = attempts.filter((item) => dateKey(item.timestamp) === today);
  const reviewsToday = attemptsToday.filter((item) => item.source === 'review').length;
  const xpTarget = profile.dailyGoalMinutes * 2;
  const overdue = vocabulary.filter((item) => new Date(item.nextReviewAt).getTime() <= now.getTime()).length;

  const make = (
    id: Quest['id'],
    title: string,
    description: string,
    progress: number,
    target: number,
    unit: string,
    href: string,
  ): Quest => ({
    id,
    title,
    description,
    progress: Math.min(progress, target),
    target,
    unit,
    completed: progress >= target,
    href,
  });

  return [
    make('first-lesson', 'Conclui uma lição', 'Uma lição completa conta para a meta diária.', lessonsToday, 1, 'lição', '/learn'),
    make('answers', 'Responde 10 vezes', 'Cada resposta guardada nas lições, prática ou revisão conta.', attemptsToday.length, 10, 'respostas', '/practice'),
    make('xp', `Ganha ${xpTarget} XP`, 'Só entra XP realmente atribuído por atividade guardada.', analytics.todayXp, xpTarget, 'XP', '/learn'),
    make(
      'review',
      'Revisa 3 palavras',
      overdue > 0 ? `Tens ${overdue} palavras com revisão pendente.` : 'Mantém o caderno em dia quando houver revisões.',
      reviewsToday,
      3,
      'revisões',
      '/review',
    ),
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
