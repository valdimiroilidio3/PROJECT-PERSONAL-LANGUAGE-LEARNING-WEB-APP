'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock, Play, Sparkles } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { PageHeader, ProgressBar, SectionTitle, Tag } from '@/components/ui';
import { isLessonUnlocked, recommendLesson } from '@/lib/analytics';
import { lessons } from '@/lib/content';
import type { CEFR } from '@/lib/types';

const filters: Array<{ id: CEFR | 'all'; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'A1', label: 'A1 · Base' },
  { id: 'A2', label: 'A2 · Elementar' },
  { id: 'B1', label: 'B1 · Intermédio' },
];

export default function LearnPage() {
  const { profile, completions } = useApp();
  const [filter, setFilter] = useState<CEFR | 'all'>('all');
  const recommended = recommendLesson(profile, lessons, completions);
  const visible = filter === 'all' ? lessons : lessons.filter((lesson) => lesson.cefr === filter);
  const percent = Math.round((completions.length / lessons.length) * 100);

  return (
    <div>
      <PageHeader
        eyebrow="Percurso de aprendizagem"
        title="Aprender inglês"
        description="Lições curtas com vocabulário, exercícios e explicações em português. Desbloqueia a seguinte ao concluir a anterior."
        action={
          <Link href={`/lesson/${recommended.id}`} className="btn-primary">
            <Play size={16} /> Continuar: {recommended.title}
          </Link>
        }
      />

      <div className="card mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Progresso do percurso</p>
          <p className="mt-1 text-2xl font-black">{completions.length} de {lessons.length} lições</p>
        </div>
        <div className="min-w-[200px] flex-1"><ProgressBar value={completions.length} max={lessons.length} /></div>
        <p className="text-sm font-black">{percent}%</p>
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar por nível">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition ${filter === item.id ? 'bg-ink text-white' : 'border border-line bg-white text-muted hover:text-ink'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((lesson) => {
          const done = completions.some((item) => item.lessonId === lesson.id);
          const unlocked = isLessonUnlocked(lesson.id, lessons, completions);
          const isRecommended = recommended.id === lesson.id && !done;
          return (
            <article key={lesson.id} className={`card relative flex flex-col transition ${unlocked ? 'hover:-translate-y-0.5 hover:border-ink/25' : 'opacity-70'}`}>
              {isRecommended && <span className="absolute -top-3 right-4"><Tag tone="sun"><Sparkles size={12} /> Recomendada</Tag></span>}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{lesson.cefr} · {lesson.category}</p>
                  <h2 className="mt-1 text-xl font-black">{lesson.title}</h2>
                </div>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${done ? 'bg-success-soft text-success' : unlocked ? 'bg-sun' : 'bg-cream text-muted'}`}>
                  {done ? <CheckCircle2 size={20} /> : unlocked ? <Play size={18} fill="currentColor" /> : <Lock size={17} />}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{lesson.objective}</p>
              <p className="mt-4 text-xs text-muted">{lesson.exercises.length} exercícios · {lesson.vocabulary.length} palavras · {lesson.minutes} min · {lesson.xp} XP</p>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                {done ? <Tag tone="green">Concluída</Tag> : unlocked ? <Tag>Disponível</Tag> : <Tag>Bloqueada</Tag>}
                {unlocked ? (
                  <Link href={`/lesson/${lesson.id}`} className="btn-primary !px-4 !py-2 text-xs">
                    {done ? 'Rever lição' : 'Começar'}
                  </Link>
                ) : (
                  <span className="text-xs font-bold text-muted">Conclui a lição anterior</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-9">
        <SectionTitle title="Como funciona" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['1', 'Aprende o vocabulário', 'Cada lição apresenta palavras e frases com contexto e áudio.'],
            ['2', 'Pratica de verdade', 'Escolha, tradução, ordem das palavras, escuta e leitura.'],
            ['3', 'Guarda e revê', 'As palavras novas vão para o caderno e voltam no momento certo.'],
          ].map(([number, title, text]) => (
            <div key={number} className="rounded-3xl border border-line bg-white p-5">
              <p className="text-sm font-black text-sun-deep">{number}</p>
              <p className="mt-1 font-extrabold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
