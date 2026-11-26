'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Heart, RotateCcw, Trophy, X } from 'lucide-react';
import { useApp } from './AppContext';
import { Mascot } from './Mascot';
import { SpeakControl } from './Speech';
import { ProgressBar, Tag } from './ui';
import { correctAnswerOf, isExerciseCorrect, accuracyPercent, type SubmittedAnswer } from '@/lib/scoring';
import type { Exercise, Lesson, LessonMistake } from '@/lib/types';

interface Feedback {
  correct: boolean;
  answer: string;
  explanation: string;
  correctAnswer: string;
}

interface Summary {
  xp: number;
  correct: number;
  total: number;
  durationMs: number;
  mistakes: LessonMistake[];
}

function answerLabel(answer: SubmittedAnswer): string {
  if (typeof answer === 'string') return answer;
  return answer.map(([english, portuguese]) => `${english} = ${portuguese}`).join('; ');
}

/** Uses the lesson's own vocabulary examples; never invents content. */
function additionalExample(lesson: Lesson, exercise: Exercise | undefined): string | null {
  if (!exercise) return null;
  const target = correctAnswerOf(exercise).toLowerCase();
  const seed = lesson.vocabulary.find((item) => {
    const english = item.english.toLowerCase();
    return target === english || target.includes(english) || item.example.toLowerCase().includes(target);
  });
  return seed?.example || null;
}

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const { recordAttempt, completeLesson } = useApp();
  const [phase, setPhase] = useState<'intro' | 'playing' | 'summary'>('intro');
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [text, setText] = useState('');
  const [order, setOrder] = useState<number[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const results = useRef<Record<string, boolean>>({});
  const pendingAttempts = useRef<Promise<void>[]>([]);
  const finishing = useRef(false);
  const startedAt = useRef(Date.now());
  const lessonStartedAt = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const exercise = lesson.exercises[index];
  const mistakesMade = Object.values(results.current).filter((correct) => !correct).length;
  const hearts = Math.max(0, 3 - mistakesMade);

  const shuffledWords = useMemo(() => {
    if (!exercise || exercise.type !== 'word-order') return [];
    return exercise.words.map((word, i) => ({ word, i })).reverse();
  }, [exercise]);

  const shuffledTranslations = useMemo(() => {
    if (!exercise || exercise.type !== 'matching') return [];
    return [...exercise.pairs].reverse();
  }, [exercise]);

  const resetExerciseState = () => {
    setFeedback(null);
    setText('');
    setOrder([]);
    setMatches({});
    setSelectedEnglish(null);
    startedAt.current = Date.now();
    window.setTimeout(() => inputRef.current?.focus(), 40);
  };

  const submit = (answer: SubmittedAnswer) => {
    if (!exercise || feedback) return;
    const correct = isExerciseCorrect(exercise, answer);
    results.current[exercise.id] = correct;
    setFeedback({
      correct,
      answer: answerLabel(answer),
      explanation: exercise.explanation,
      correctAnswer: correctAnswerOf(exercise),
    });
    pendingAttempts.current.push(recordAttempt({
      lessonId: lesson.id,
      exerciseId: exercise.id,
      exerciseType: exercise.type,
      category: exercise.category,
      correct,
      userAnswer: answerLabel(answer),
      correctAnswer: correctAnswerOf(exercise),
      durationMs: Math.min(120_000, Date.now() - startedAt.current),
      xpAwarded: 0,
      source: 'lesson',
    }));
  };

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    try {
      await Promise.all(pendingAttempts.current);
      pendingAttempts.current = [];
      const correct = Object.values(results.current).filter(Boolean).length;
      const total = lesson.exercises.length;
      const mistakes: LessonMistake[] = lesson.exercises
        .filter((item) => results.current[item.id] === false)
        .map((item) => ({
          exerciseId: item.id,
          prompt: item.type === 'reading' || item.type === 'listening' ? item.question : item.prompt,
          userAnswer: '',
          correctAnswer: correctAnswerOf(item),
          explanation: item.explanation,
        }));
      const durationMs = Date.now() - lessonStartedAt.current;
      const xp = await completeLesson({ lesson, correctCount: correct, totalExercises: total, durationMs, mistakes });
      setSummary({ xp, correct, total, durationMs, mistakes });
      setPhase('summary');
    } finally {
      finishing.current = false;
    }
  };

  const next = () => {
    if (index + 1 >= lesson.exercises.length) {
      void finish();
      return;
    }
    setIndex((value) => value + 1);
    resetExerciseState();
  };

  const retry = () => {
    if (!feedback || feedback.correct) return;
    setFeedback(null);
    setText('');
    setOrder([]);
    setMatches({});
    setSelectedEnglish(null);
    startedAt.current = Date.now();
    window.setTimeout(() => inputRef.current?.focus(), 40);
  };

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/learn" className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"><ArrowLeft size={15} /> Percurso</Link>
        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Tag tone="sun">{lesson.cefr} · {lesson.category}</Tag>
              <h1 className="mt-3 text-3xl font-black tracking-tight">{lesson.title}</h1>
              <p className="mt-1 text-sm text-muted">{lesson.subtitle}</p>
            </div>
            <Mascot className="h-24 w-24" mood="wink" />
          </div>
          <div className="mt-6 rounded-3xl bg-cream p-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Objetivo da lição</p>
            <p className="mt-1 text-sm font-semibold leading-relaxed">{lesson.objective}</p>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-2xl border border-line p-3"><p className="font-black">{lesson.exercises.length}</p><p className="text-muted">exercícios</p></div>
            <div className="rounded-2xl border border-line p-3"><p className="font-black">{lesson.minutes} min</p><p className="text-muted">duração estimada</p></div>
            <div className="rounded-2xl border border-line p-3"><p className="font-black">{lesson.xp} XP</p><p className="text-muted">recompensa máxima</p></div>
          </div>
          <h2 className="mt-7 text-sm font-black">Vocabulário desta lição</h2>
          <div className="mt-3 divide-y divide-line rounded-3xl border border-line">
            {lesson.vocabulary.map((item) => (
              <div key={item.english} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-bold">{item.english} <span className="font-normal text-muted">— {item.portuguese}</span></p>
                  <p className="mt-0.5 truncate text-xs text-muted">{item.example || item.context}</p>
                </div>
                <SpeakControl text={item.english || item.example} compact />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary mt-7 w-full"
            onClick={() => {
              startedAt.current = Date.now();
              lessonStartedAt.current = Date.now();
              results.current = {};
              pendingAttempts.current = [];
              setIndex(0);
              setPhase('playing');
              resetExerciseState();
            }}
          >
            Começar lição <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'summary' && summary) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card overflow-hidden text-center">
          <Mascot className="mx-auto h-32 w-32" mood="celebrate" />
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-muted">Lição concluída</p>
          <h1 className="mt-2 text-3xl font-black">Muito bem!</h1>
          <p className="mt-2 text-sm text-muted">Os teus resultados ficaram guardados neste browser.</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-sun-soft p-4"><p className="text-2xl font-black">{summary.xp}</p><p className="text-xs font-bold text-muted">XP recebido</p></div>
            <div className="rounded-2xl bg-success-soft p-4"><p className="text-2xl font-black">{accuracyPercent(summary.correct, summary.total)}%</p><p className="text-xs font-bold text-muted">acerto</p></div>
            <div className="rounded-2xl bg-cream p-4"><p className="text-2xl font-black">{Math.max(1, Math.round(summary.durationMs / 60_000))}</p><p className="text-xs font-bold text-muted">minutos</p></div>
          </div>
          {summary.xp === 0 && <p className="mt-4 rounded-2xl bg-cream p-3 text-xs text-muted">Esta lição já tinha sido concluída, por isso não atribui XP duplicado.</p>}
          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Link href="/learn" className="btn-primary flex-1">Voltar ao percurso</Link>
            <Link href="/review" className="btn-ghost flex-1">Rever vocabulário</Link>
          </div>
        </div>

        {summary.mistakes.length > 0 && (
          <section className="card mt-5">
            <h2 className="text-lg font-black">Revisão dos erros</h2>
            <p className="mt-1 text-xs text-muted">Guardámos as respostas corretas para as poderes rever com calma.</p>
            <div className="mt-4 space-y-3">
              {summary.mistakes.map((mistake) => (
                <div key={mistake.exerciseId} className="rounded-2xl bg-cream p-4">
                  <p className="text-xs text-muted">{mistake.prompt}</p>
                  <p className="mt-1 font-extrabold text-success">{mistake.correctAnswer}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{mistake.explanation}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-4">
        <Link href="/learn" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white hover:bg-cream" aria-label="Sair da lição"><X size={17} /></Link>
        <div className="flex-1"><ProgressBar value={index} max={lesson.exercises.length} /></div>
        <div className="flex items-center gap-1 text-sm font-extrabold" aria-label={`${hearts} corações restantes`}>
          {[0, 1, 2].map((value) => <Heart key={value} size={18} className={value < hearts ? 'fill-danger text-danger' : 'text-line'} />)}
        </div>
      </div>
      <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-muted">Exercício {index + 1} de {lesson.exercises.length}</p>

      <motion.div key={exercise.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card">
        <h1 className="text-xl font-black leading-snug">{exercise.prompt}</h1>

        {exercise.type === 'listening' && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-cream p-4">
            <SpeakControl text={exercise.audioText} />
            <span className="text-xs text-muted">Ouve quantas vezes quiseres. A velocidade lenta está disponível.</span>
          </div>
        )}

        {exercise.type === 'reading' && (
          <p className="mt-5 whitespace-pre-line rounded-2xl bg-cream p-4 text-sm leading-relaxed">{exercise.passage}</p>
        )}

        {exercise.type === 'dialogue' && (
          <div className="mt-5 space-y-2 rounded-2xl bg-cream p-4">
            {exercise.lines.map((line, lineIndex) => (
              <p key={lineIndex} className={`text-sm ${lineIndex === exercise.blankIndex && !feedback ? 'font-black text-sun-deep' : ''}`}>
                {lineIndex === exercise.blankIndex ? (feedback ? feedback.answer : '____') : line}
              </p>
            ))}
          </div>
        )}

        {'question' in exercise && <p className="mt-5 text-lg font-bold">{exercise.question}</p>}
        {exercise.type === 'fill-blank' && <p className="mt-5 text-lg font-bold">{exercise.sentence}</p>}
        {exercise.type === 'sentence' && <p className="mt-5 text-sm leading-relaxed">{exercise.hint}</p>}
        {exercise.translation && <p className="mt-2 text-xs text-muted">Dica: {exercise.translation}</p>}

        {exercise.type === 'word-order' && (
          <div className="mt-5">
            <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-2xl border border-dashed border-line bg-cream p-3">
              {order.length === 0 && <span className="text-xs text-muted">Toca nas palavras para montar a frase…</span>}
              {order.map((wordIndex) => (
                <button key={wordIndex} type="button" disabled={!!feedback} onClick={() => setOrder((previous) => previous.filter((value) => value !== wordIndex))} className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold">
                  {exercise.words[wordIndex]}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {shuffledWords.map(({ word, i }) => (
                <button key={i} type="button" disabled={!!feedback || order.includes(i)} onClick={() => setOrder((previous) => [...previous, i])} className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-bold transition hover:border-ink/40 disabled:opacity-40">
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {exercise.type === 'matching' && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="label">Inglês</p>
              {exercise.pairs.map((pair) => {
                const matched = matches[pair.english];
                return (
                  <button key={pair.english} type="button" disabled={!!feedback || !!matched} onClick={() => setSelectedEnglish(pair.english)} className={`mb-2 w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${selectedEnglish === pair.english ? 'border-ink bg-sun-soft' : matched ? 'border-success bg-success-soft' : 'border-line bg-white hover:border-ink/30'}`}>
                    {pair.english}
                  </button>
                );
              })}
            </div>
            <div>
              <p className="label">Português</p>
              {shuffledTranslations.map((pair) => (
                <button key={pair.english} type="button" disabled={!!feedback} onClick={() => {
                  if (!selectedEnglish) return;
                  setMatches((previous) => ({ ...previous, [selectedEnglish]: pair.portuguese }));
                  setSelectedEnglish(null);
                }} className="mb-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-left text-sm font-bold transition hover:border-ink/30">
                  {pair.portuguese}
                </button>
              ))}
            </div>
            {Object.keys(matches).length > 0 && !feedback && (
              <button type="button" onClick={() => setMatches({})} className="text-xs font-bold text-muted underline">Limpar associações</button>
            )}
          </div>
        )}

        {'options' in exercise && (
          <div className="mt-5 space-y-2">
            {exercise.options.map((option) => {
              const chosen = feedback?.answer === option;
              const right = feedback && option === feedback.correctAnswer;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={!!feedback}
                  onClick={() => submit(option)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-bold transition disabled:cursor-default ${
                    feedback && right ? 'border-success bg-success-soft text-success' : chosen && !feedback?.correct ? 'border-danger bg-danger-soft text-danger' : 'border-line bg-white hover:border-ink/40'
                  }`}
                >
                  {option}
                  {feedback && right && <CheckCircle2 size={17} />}
                  {chosen && !feedback?.correct && <X size={17} />}
                </button>
              );
            })}
          </div>
        )}

        {(exercise.type === 'translation' || exercise.type === 'sentence' || exercise.type === 'fill-blank') && (
          <form className="mt-5" onSubmit={(event) => { event.preventDefault(); if (text.trim()) submit(text.trim()); }}>
            <label className="label" htmlFor="answer">A tua resposta</label>
            <input id="answer" ref={inputRef} value={text} onChange={(event) => setText(event.target.value)} disabled={!!feedback} className="input" placeholder="Escreve em inglês…" autoComplete="off" />
            {!feedback && <button type="submit" className="btn-primary mt-4 w-full" disabled={!text.trim()}>Verificar resposta</button>}
          </form>
        )}

        {exercise.type === 'word-order' && !feedback && (
          <button type="button" className="btn-primary mt-5 w-full" disabled={order.length !== exercise.words.length} onClick={() => submit(order.map((wordIndex) => exercise.words[wordIndex]).join(' '))}>
            Verificar frase
          </button>
        )}

        {exercise.type === 'matching' && !feedback && (
          <button type="button" className="btn-primary mt-5 w-full" disabled={Object.keys(matches).length !== exercise.pairs.length} onClick={() => submit(Object.entries(matches) as Array<[string, string]>) }>
            Verificar associações
          </button>
        )}

        {feedback && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`mt-5 rounded-2xl border p-4 ${feedback.correct ? 'border-success/30 bg-success-soft' : 'border-danger/30 bg-danger-soft'}`} role="status" aria-live="polite">
            <p className="flex items-center gap-2 font-black">{feedback.correct ? <><CheckCircle2 size={18} className="text-success" /> Correto!</> : <><X size={18} className="text-danger" /> Ainda não é desta</>}</p>
            {!feedback.correct && <p className="mt-2 text-sm">Resposta correta: <strong>{feedback.correctAnswer}</strong></p>}
            <p className="mt-2 text-sm leading-relaxed text-muted">{feedback.explanation}</p>
            {additionalExample(lesson, exercise) && (
              <p className="mt-2 text-sm">
                <span className="font-bold">Exemplo da lição:</span>{' '}
                <span className="text-muted">“{additionalExample(lesson, exercise)}”</span>
              </p>
            )}
            {exercise.type === 'listening' && (
              <p className="mt-2 text-xs text-muted"><span className="font-bold">Transcrição:</span> {exercise.audioText}</p>
            )}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {!feedback.correct && (
                <button type="button" className="btn-ghost flex-1" onClick={retry}>
                  <RotateCcw size={15} /> Tentar novamente
                </button>
              )}
              <button type="button" className="btn-primary flex-1" onClick={next}>
                {index + 1 === lesson.exercises.length ? 'Ver resultado' : 'Próximo exercício'} <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {hearts === 0 && !feedback && (
          <p className="mt-4 rounded-2xl bg-cream p-3 text-xs text-muted">
            Já usaste os três corações desta lição. Podes continuar à mesma — os erros só reduzem o bónus de precisão, não bloqueiam a lição.
          </p>
        )}
      </motion.div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>{lesson.title}</span>
        <span className="flex items-center gap-1"><Trophy size={13} /> {lesson.xp} XP possíveis</span>
      </div>
      {!feedback && <p className="mt-2 text-right"><button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink" onClick={resetExerciseState}><RotateCcw size={13} /> Limpar resposta</button></p>}
    </div>
  );
}
