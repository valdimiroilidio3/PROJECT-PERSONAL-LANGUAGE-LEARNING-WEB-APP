import type { Analytics } from './analytics';
import { recommendLesson } from './analytics';
import type { Lesson, LessonCompletion, Attempt, Profile, VocabularyItem } from './types';

export interface NextStep {
  id: 'review' | 'mistakes' | 'weak-skill' | 'lesson' | 'all-caught-up';
  title: string;
  description: string;
  href: string;
  cta: string;
  reason: string;
}

interface NextStepInput {
  analytics: Analytics;
  profile: Profile;
  lessons: Lesson[];
  completions: LessonCompletion[];
  attempts: Attempt[];
  vocabulary: VocabularyItem[];
  now?: Date;
}

/**
 * Explicit, deterministic rules. The first matching rule wins.
 * Every value in `reason` comes from saved activity, never from demo data.
 */
export function getNextStep({
  analytics,
  profile,
  lessons,
  completions,
  attempts,
  vocabulary,
  now = new Date(),
}: NextStepInput): NextStep {
  const overdue = vocabulary.filter((item) => new Date(item.nextReviewAt).getTime() <= now.getTime());
  if (overdue.length >= 5) {
    return {
      id: 'review',
      title: `Rever ${overdue.length} palavras`,
      description: 'Estas palavras estão atrasadas e correm o risco de ser esquecidas.',
      href: '/review',
      cta: 'Começar revisão',
      reason: `${overdue.length} palavras com data de revisão atingida.`,
    };
  }

  const repeated = analytics.mistakes.find((mistake) => mistake.count >= 2);
  if (repeated) {
    return {
      id: 'mistakes',
      title: 'Corrigir um erro repetido',
      description: `Revê a estrutura “${repeated.answer}”, que já falhaste ${repeated.count} vezes.`,
      href: '/review',
      cta: 'Praticar novamente',
      reason: `${repeated.count} erros registados para a mesma resposta.`,
    };
  }

  const weak = analytics.weakest;
  if (weak && weak.total >= 3 && weak.accuracy < 60) {
    const candidate = lessons.find(
      (lesson) => lesson.category === weak.category && !completions.some((item) => item.lessonId === lesson.id),
    );
    if (candidate) {
      return {
        id: 'weak-skill',
        title: `Praticar ${candidate.title}`,
        description: `A categoria ${weak.category} tem ${weak.accuracy}% de acerto em ${weak.total} respostas.`,
        href: `/lesson/${candidate.id}`,
        cta: 'Abrir lição',
        reason: `${weak.accuracy}% de acerto em ${weak.category}.`,
      };
    }
  }

  const unfinished = attempts.filter((attempt) => !attempt.correct).length;
  if (overdue.length > 0 && unfinished === 0) {
    return {
      id: 'review',
      title: `Rever ${overdue.length} ${overdue.length === 1 ? 'palavra' : 'palavras'}`,
      description: 'Tens revisões pendentes e nenhum erro recente por corrigir.',
      href: '/review',
      cta: 'Rever agora',
      reason: `${overdue.length} revisões pendentes.`,
    };
  }

  const recommended = recommendLesson(profile, lessons, completions);
  const allDone = completions.length >= lessons.length;
  if (allDone) {
    return {
      id: 'all-caught-up',
      title: 'Manter o português ativo',
      description: 'Concluíste todas as lições. Usa um cenário real para continuar a praticar.',
      href: '/practice',
      cta: 'Praticar cenário',
      reason: `${completions.length} de ${lessons.length} lições concluídas.`,
    };
  }

  return {
    id: 'lesson',
    title: recommended.title,
    description: recommended.objective,
    href: `/lesson/${recommended.id}`,
    cta: 'Continuar lição',
    reason: `${completions.length} de ${lessons.length} lições concluídas.`,
  };
}
