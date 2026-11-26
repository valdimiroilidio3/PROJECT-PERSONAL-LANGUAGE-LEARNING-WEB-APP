'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LessonPlayer } from '@/components/LessonPlayer';
import { EmptyState } from '@/components/ui';
import { getLesson } from '@/lib/content';

export default function LessonPage() {
  const params = useParams<{ id: string }>();
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

  return (
    <>
      <Link href="/learn" className="sr-only">Voltar ao percurso</Link>
      <LessonPlayer lesson={lesson} />
    </>
  );
}
