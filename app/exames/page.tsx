'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  GraduationCap,
  RotateCcw,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { Confetti, CountUp } from '@/components/effects';
import { EmptyState, PageHeader, ProgressBar, Tag } from '@/components/ui';
import { examFor, parseExamScore, scoreExam, type ExamQuestion, type ExamScore, type ExamSection } from '@/lib/exams';
import { speak, speechSynthesisSupported } from '@/lib/speech';

const SECTION_LABELS: Record<ExamSection, string> = {
  reading: 'A · Leitura',
  listening: 'B · Audição',
  vocabulary: 'C · Vocabulário',
};

const SECTION_ORDER: ExamSection[] = ['reading', 'listening', 'vocabulary'];

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ExamesPage() {
  const { profile, language, attempts, recordAttempt } = useApp();
  const exam = examFor(profile.targetLanguage);
  const [phase, setPhase] = useState<'intro' | 'running' | 'done'>('intro');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(0);
  const [score, setScore] = useState<ExamScore | null>(null);
  const startedAt = useRef(Date.now());
  const submittedRef = useRef(false);


  const best = useMemo(() => {
    if (!exam) return null;
    let bestScore: { correct: number; total: number } | null = null;
    for (const attempt of attempts) {
      if (attempt.exerciseId !== `${exam.id}-complete`) continue;
      const parsed = parseExamScore(attempt.userAnswer);
      if (parsed && (!bestScore || parsed.correct > bestScore.correct)) bestScore = parsed;
    }
    return bestScore;
  }, [attempts, exam]);

  const submit = useCallback(async () => {
    if (!exam || submittedRef.current) return;
    submittedRef.current = true;
    const result = scoreExam(exam, answers);
    setScore(result);
    setPhase('done');
    const durationMs = Date.now() - startedAt.current;
    const perQuestion = Math.round(durationMs / exam.questions.length);
    await Promise.all([
      ...exam.questions.map((question, index) =>
        recordAttempt({
          lessonId: exam.id,
          exerciseId: `${exam.id}-q${index + 1}`,
          exerciseType: 'multiple-choice',
          category: `Exame ${exam.level}`,
          correct: answers[question.id] === question.correctIndex,
          userAnswer: question.options[answers[question.id] ?? -1] ?? '(sem resposta)',
          correctAnswer: question.options[question.correctIndex],
          durationMs: perQuestion,
          xpAwarded: 0,
          source: 'practice',
        }),
      ),
      recordAttempt({
        lessonId: exam.id,
        exerciseId: `${exam.id}-complete`,
        exerciseType: 'multiple-choice',
        category: `Exame ${exam.level}`,
        correct: result.passed,
        userAnswer: `${result.correct}/${result.total}`,
        correctAnswer: `≥ ${Math.ceil((exam.passPercent / 100) * exam.questions.length)}/${exam.questions.length}`,
        durationMs,
        xpAwarded: result.xp,
        source: 'practice',
      }),
    ]);
  }, [answers, exam, recordAttempt]);

  useEffect(() => {
    if (phase !== 'running') return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && remaining === 0) void submit();
  }, [phase, remaining, submit]);

  const start = () => {
    if (!exam) return;
    setAnswers({});
    setScore(null);
    submittedRef.current = false;
    setRemaining(exam.durationMinutes * 60);
    startedAt.current = Date.now();
    setPhase('running');
  };

  /* --------------------- Pacotes sem simulado (código) -------------------- */
  if (!exam) {
    return (
      <div>
        <PageHeader
          eyebrow="Avaliação"
          title="Simulados"
          description="Simulados de proficiência com o formato de leitura, audição e vocabulário — apenas para línguas naturais."
        />
        <EmptyState
          title="Ainda sem simulado para programação"
          description="Os pacotes de JavaScript e Python praticam com exercícios e projetos guiados — não com exame de proficiência. Os simulados A1 existem para inglês, espanhol, neerlandês, francês, alemão e italiano."
          href="/learn"
          linkLabel="Ir para as lições"
        />
      </div>
    );
  }

  const answeredCount = exam.questions.filter((question) => answers[question.id] !== undefined).length;

  /* ------------------------------ Intro ------------------------------ */
  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader
          eyebrow="Avaliação"
          title="Simulados"
          description="Um simulado completo no formato dos exames de proficiência — com tempo, nota por secção e resultado imediato."
        />
        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Tag tone="sun"><GraduationCap size={12} /> {exam.level}</Tag>
              <h1 className="mt-2 text-2xl font-black">{exam.title}</h1>
              <p className="mt-1 text-sm text-muted">{exam.description}</p>
            </div>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-sun-soft text-sun-deep"><GraduationCap size={30} /></span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-center text-xs sm:grid-cols-4">
            <div className="rounded-2xl border border-line p-3"><p className="text-base font-black">{exam.questions.length}</p><p className="text-muted">questões</p></div>
            <div className="rounded-2xl border border-line p-3"><p className="text-base font-black">3</p><p className="text-muted">secções</p></div>
            <div className="rounded-2xl border border-line p-3"><p className="text-base font-black">{exam.durationMinutes} min</p><p className="text-muted">tempo limite</p></div>
            <div className="rounded-2xl border border-line p-3"><p className="text-base font-black">≥ {exam.passPercent}%</p><p className="text-muted">para aprovação</p></div>
          </div>

          <ul className="mt-6 space-y-2 rounded-2xl bg-cream p-4 text-xs leading-relaxed text-muted">
            <li className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-success" /> Perguntas originais, retiradas do conteúdo do teu percurso — não são perguntas de exames reais.</li>
            <li className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-success" /> Resultado indicativo: não é um exame oficial, não emite certificado e não substitui uma avaliação certificada.</li>
            <li className="flex gap-2"><Volume2 size={15} className="mt-0.5 shrink-0 text-success" /> A secção de audição usa a voz do sistema — podes repetir o áudio as vezes que quiseres.</li>
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-muted">
              {best ? <>Melhor resultado neste browser: <strong className="text-ink">{best.correct}/{best.total}</strong></> : 'Ainda sem tentativas registadas.'}
            </p>
            <button type="button" onClick={start} className="btn-primary">Começar simulado <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ Resultado ------------------------------ */
  if (phase === 'done' && score) {
    const weakest = SECTION_ORDER.reduce((min, key) => (score.perSection[key].percent < score.perSection[min].percent ? key : min), 'reading' as ExamSection);
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card relative overflow-hidden text-center">
          {score.passed && <Confetti mode="rain" count={44} />}
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${score.passed ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`} aria-hidden>
            <GraduationCap size={30} />
          </span>
          <h1 className="mt-4 text-2xl font-black">{score.passed ? 'Aprovado — bom trabalho!' : 'Ainda não desta vez'}</h1>
          <p className="mt-1 text-sm text-muted">Resultado indicativo do simulado {exam.level}. Não é um certificado nem substitui um exame oficial.</p>
          <p className="mt-6 text-6xl font-black"><CountUp value={score.percent} /><span className="text-2xl text-muted">%</span></p>
          <p className="mt-1 text-sm font-bold text-muted">{score.correct} de {score.total} corretas · {score.xp} XP ganhos ({score.correct} acertos{score.passed ? ' + 10 bónus de aprovação' : ''})</p>

          <div className="mt-6 grid gap-3 text-left">
            {SECTION_ORDER.map((key) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-bold">{SECTION_LABELS[key]}</span>
                  <span className="text-xs text-muted">{score.perSection[key].correct}/{score.perSection[key].total} · {score.perSection[key].percent}%</span>
                </div>
                <ProgressBar value={score.perSection[key].correct} max={score.perSection[key].total} color={score.perSection[key].percent >= 80 ? 'bg-success' : score.perSection[key].percent >= 50 ? 'bg-sun' : 'bg-danger'} />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-cream p-4 text-left text-xs leading-relaxed text-muted">
            <p className="flex items-center gap-2 font-extrabold text-ink"><AlertCircle size={14} /> Onde focar</p>
            <p className="mt-1">A secção mais fraca foi <strong>{SECTION_LABELS[weakest]}</strong>. Revê o percurso e repete o simulado — as respostas e explicações de cada tentativa ficam guardadas no teu progresso.</p>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={start} className="btn-primary flex-1"><RotateCcw size={15} /> Tentar novamente</button>
            <Link href="/learn" className="btn-ghost flex-1">Revê as lições <ArrowRight size={15} /></Link>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ Em curso ------------------------------ */
  const passage = (question: ExamQuestion) => question.passage;
  let previousPassage: string | undefined;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-[52px] z-10 -mx-4 mb-4 border-b border-line bg-cream/95 px-4 py-2 backdrop-blur lg:top-0 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => setPhase('intro')} className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink"><ArrowLeft size={14} /> Abandonar</button>
          <p className="flex items-center gap-2 text-xs font-extrabold text-muted"><Clock3 size={14} /> <span role="timer" aria-label="Tempo restante" className={remaining <= 60 ? 'text-danger' : 'text-ink'}>{formatClock(remaining)}</span></p>
          <p className="text-xs font-extrabold text-muted">{answeredCount}/{exam.questions.length} respondidas</p>
          <button type="button" onClick={() => void submit()} className="btn-primary !px-4 !py-2 text-xs">Entregar <CheckCircle2 size={13} /></button>
        </div>
        <div className="mx-auto mt-2 max-w-3xl"><ProgressBar value={answeredCount} max={exam.questions.length} /></div>
      </div>

      <h1 className="text-2xl font-black">{exam.title}</h1>
      <p className="mt-1 text-xs text-muted">Sem dicionário nem tradução durante a prova. Lê com atenção — cada resposta vale 1 ponto.</p>

      {SECTION_ORDER.map((section) => {
        const questions = exam.questions.filter((question) => question.section === section);
        return (
          <section key={section} className="mt-6">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">{SECTION_LABELS[section]}</h2>
            <fieldset className="mt-3 space-y-4">
              {questions.map((question) => {
                const questionPassage = passage(question);
                const showPassage = questionPassage && questionPassage !== previousPassage;
                if (questionPassage) previousPassage = questionPassage;
                return (
                  <div key={question.id} className="card">
                    {showPassage && (
                      <blockquote className="mb-4 whitespace-pre-line rounded-2xl bg-cream p-4 text-sm italic leading-relaxed text-ink/90">{questionPassage}</blockquote>
                    )}
                    {question.audioText && (
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={() => void speak(question.audioText ?? '', { lang: language.locale })}
                          disabled={!speechSynthesisSupported() || !language.speech}
                          className="btn-ghost !px-4 !py-2 text-xs"
                        >
                          <Volume2 size={14} /> Ouvir o áudio
                        </button>
                      </div>
                    )}
                    <legend className="text-sm font-extrabold">{question.question}</legend>
                    <div className="mt-3 grid gap-2">
                      {question.options.map((option, index) => (
                        <label
                          key={index}
                          className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${answers[question.id] === index ? 'border-ink bg-sun-soft' : 'border-line hover:border-ink/30'}`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={index}
                            checked={answers[question.id] === index}
                            onChange={() => setAnswers((previous) => ({ ...previous, [question.id]: index }))}
                            className="h-4 w-4 accent-ink"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </fieldset>
          </section>
        );
      })}

      <button type="button" onClick={() => void submit()} className="btn-primary mt-6 w-full">Entregar simulado <CheckCircle2 size={16} /></button>
      <p className="mt-3 text-center text-[11px] text-muted">Ao entregar, cada resposta conta como uma tentativa no teu progresso. Nada é publicado fora deste browser.</p>
    </div>
  );
}
