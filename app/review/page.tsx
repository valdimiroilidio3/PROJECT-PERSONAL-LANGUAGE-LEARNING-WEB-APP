'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/components/AppContext';
import { Mascot } from '@/components/Mascot';
import { SpeakControl } from '@/components/Speech';
import { EmptyState, PageHeader, ProgressBar, Tag } from '@/components/ui';
import { masteryStatus, reviewPriority, reviewVocabulary, type ReviewQuality } from '@/lib/srs';
import type { VocabularyItem } from '@/lib/types';

type Mode = 'priority' | 'due' | 'new';

const qualityLabels: { id: ReviewQuality; label: string; detail: string; style: string }[] = [
  { id: 'again', label: 'De novo', detail: '1 dia', style: 'border-danger/30 bg-danger-soft text-danger' },
  { id: 'hard', label: 'Difícil', detail: 'intervalo curto', style: 'border-line bg-white text-ink' },
  { id: 'good', label: 'Bem', detail: 'intervalo normal', style: 'border-success/30 bg-success-soft text-success' },
  { id: 'easy', label: 'Fácil', detail: 'intervalo longo', style: 'border-sun bg-sun text-ink' },
];

export default function ReviewPage() {
  const { vocabulary, updateVocabulary, recordAttempt } = useApp();
  const [mode, setMode] = useState<Mode>('priority');
  const [queue, setQueue] = useState<VocabularyItem[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [busy, setBusy] = useState(false);
  const shownAt = useRef(Date.now());

  const candidates = useMemo(() => {
    const now = Date.now();
    if (mode === 'due') return vocabulary.filter((item) => new Date(item.nextReviewAt).getTime() <= now);
    if (mode === 'new') return vocabulary.filter((item) => item.familiarity === 0 && item.correctCount === 0);
    return [...vocabulary].sort((a, b) => reviewPriority(b) - reviewPriority(a));
  }, [vocabulary, mode]);

  const activeQueue = queue ?? candidates;
  const current = activeQueue[0];

  const start = (selectedMode: Mode) => {
    setMode(selectedMode);
    const now = Date.now();
    const items = selectedMode === 'due'
      ? vocabulary.filter((item) => new Date(item.nextReviewAt).getTime() <= now)
      : selectedMode === 'new'
        ? vocabulary.filter((item) => item.familiarity === 0 && item.correctCount === 0)
        : [...vocabulary].sort((a, b) => reviewPriority(b) - reviewPriority(a));
    setQueue(items);
    setRevealed(false);
    setReviewed(0);
    shownAt.current = Date.now();
  };

  const grade = async (quality: ReviewQuality) => {
    if (!current || busy) return;
    setBusy(true);
    const updated = reviewVocabulary(current, quality);
    const durationMs = Math.min(300_000, Date.now() - shownAt.current);
    const xp = quality === 'good' || quality === 'easy' ? 1 : 0;
    await Promise.all([
      updateVocabulary(updated),
      recordAttempt({
        lessonId: current.lessonId ?? 'manual',
        exerciseId: `review-${current.id}`,
        exerciseType: 'translation',
        category: current.context || 'Vocabulário',
        correct: quality === 'good' || quality === 'easy',
        userAnswer: current.english,
        correctAnswer: current.portuguese,
        durationMs,
        xpAwarded: xp,
        source: 'review',
      }),
    ]);
    setQueue((previous) => (previous ? previous.slice(1) : candidates.slice(1)));
    setRevealed(false);
    setReviewed((value) => value + 1);
    shownAt.current = Date.now();
    setBusy(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Repetição espaçada"
        title="Revisão de vocabulário"
        description="As palavras voltam em intervalos cada vez maiores. Nem todas aparecem no mesmo dia — a prioridade vai para as novas, atrasadas e mais erradas."
        action={<Link href="/vocabulary" className="btn-ghost">Ver caderno</Link>}
      />

      {vocabulary.length === 0 ? (
        <EmptyState title="Ainda não há palavras para rever" description="Conclui a primeira lição ou adiciona palavras manualmente. Elas entram na revisão no próprio dia." href="/learn" linkLabel="Ir para as lições" />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {([['priority', 'Prioritárias'], ['due', 'Atrasadas'], ['new', 'Novas']] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => start(id)} className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${mode === id ? 'bg-ink text-white' : 'border border-line bg-white text-muted hover:text-ink'}`} aria-pressed={mode === id}>{label}</button>
            ))}
          </div>

          {current ? (
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex-1"><ProgressBar value={reviewed} max={reviewed + activeQueue.length} /></div>
                <span className="text-xs font-bold text-muted">{activeQueue.length} restantes</span>
              </div>
              <motion.div key={current.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card min-h-[360px]">
                <div className="flex items-center justify-between">
                  <Tag tone={masteryStatus(current) === 'mastered' ? 'green' : masteryStatus(current) === 'new' ? 'sun' : 'neutral'}>
                    {masteryStatus(current) === 'mastered' ? 'Dominada' : masteryStatus(current) === 'new' ? 'Nova' : 'Em aprendizagem'} · {current.familiarity}/7
                  </Tag>
                  <SpeakControl text={current.example || current.english} compact />
                </div>
                <div className="mt-10 text-center">
                  <h2 className="text-3xl font-black sm:text-4xl">{current.english}</h2>
                  {revealed ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="mt-4 text-xl font-bold text-success">{current.portuguese}</p>
                      {current.example && <p className="mt-4 text-sm italic text-muted">“{current.example}”</p>}
                      {current.context && <p className="mt-2 text-xs text-muted">{current.context}</p>}
                      <p className="mt-3 text-[11px] text-muted">
                        Histórico: {current.history?.length ?? 0} revisões · {current.correctCount} acertos · {current.incorrectCount} erros
                      </p>
                    </motion.div>
                  ) : (
                    <p className="mt-5 text-sm text-muted">Tenta lembrar-te do significado antes de revelar.</p>
                  )}
                </div>
                <div className="mt-8">
                  {!revealed ? (
                    <button type="button" onClick={() => setRevealed(true)} className="btn-primary w-full">Mostrar tradução</button>
                  ) : (
                    <div>
                      <p className="mb-3 text-center text-xs font-bold text-muted">Quão fácil foi lembrar?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {qualityLabels.map((item) => (
                          <button key={item.id} type="button" disabled={busy} onClick={() => void grade(item.id)} className={`rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 disabled:opacity-50 ${item.style}`}>
                            <span className="block text-sm font-black">{item.label}</span>
                            <span className="block text-[11px] opacity-70">{item.detail}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              <p className="mt-4 flex items-center gap-2 text-center text-xs text-muted"><Sparkles size={14} /> Cada revisão atualiza a próxima data com base na tua resposta.</p>
            </div>
          ) : (
            <div className="card text-center">
              <Mascot className="mx-auto h-28 w-28" mood="celebrate" />
              <CheckCircle2 className="mx-auto mt-2 text-success" size={28} />
              <h2 className="mt-3 text-2xl font-black">Sessão concluída</h2>
              <p className="mt-2 text-sm text-muted">Revisaste {reviewed} {reviewed === 1 ? 'palavra' : 'palavras'} nesta ronda.</p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <button type="button" onClick={() => start(mode)} className="btn-primary"><RotateCcw size={15} /> Recomeçar</button>
                <Link href="/vocabulary" className="btn-ghost">Voltar ao caderno</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
