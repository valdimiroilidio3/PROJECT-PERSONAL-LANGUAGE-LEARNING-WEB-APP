'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LessonPlayer } from '@/components/LessonPlayer';
import { useApp } from '@/components/AppContext';
import { EmptyState } from '@/components/ui';
import { isLessonUnlocked } from '@/lib/analytics';
import { getLesson, lessons } from '@/lib/content';

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const { ready, completions } = useApp();
  const lesson = getLesson(params.id);

  if (!lesson) {
    return (
      <EmptyState
        title="Lição não encontrada"
        description="O endereço não corresponde a nenhuma lição disponível."
        href="/learn"
        linkLabel="Ver percurso"
      />
    );
  }

  if (!ready) return null;

  if (!isLessonUnlocked(lesson.id, lessons, completions)) {
    return (
      <EmptyState
        title="Lição bloqueada"
        description="Conclui a lição anterior do percurso para desbloquear esta. O teu progresso fica guardado."
        href="/learn"
        linkLabel="Voltar ao percurso"
      />
    );
  }

  return (
    <>
      <Link href="/learn" className="sr-only">Voltar ao percurso</Link>
      <LessonPlayer lesson={lesson} />
    </>
  );
}
