'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, Lightbulb, RotateCcw, Trophy, X } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { SpeechInput, SpeakControl } from '@/components/Speech';
import { EmptyState, PageHeader, ProgressBar, Tag } from '@/components/ui';
import { scenarios } from '@/lib/content/scenarios';
import { evaluateScenarioAnswer, scenarioXp } from '@/lib/practice';

interface PracticeResult {
  answer: string;
  correct: boolean;
}

export default function PracticePage() {
  const { recordAttempt } = useApp();
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [text, setText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('scenario');
    if (requested && scenarios.some((item) => item.id === requested)) setScenarioId(requested);
  }, []);

  const scenario = scenarios.find((item) => item.id === scenarioId);

  const reset = () => {
    setStep(0);
    setText('');
    setShowHint(false);
    setResults([]);
    setFinished(false);
    setEarnedXp(0);
  };

  const select = (id: string) => {
    setStartedAt(Date.now());
    setScenarioId(id);
    reset();
  };

  const check = () => {
    if (!scenario || !text.trim()) return;
    const correct = evaluateScenarioAnswer(text, scenario.keywords[step]);
    const nextResults = [...results, { answer: text.trim(), correct }];
    setResults(nextResults);
    void recordAttempt({
      lessonId: scenario.id,
      exerciseId: `${scenario.id}-step-${step}`,
      exerciseType: 'sentence',
      category: scenario.category,
      correct,
      userAnswer: text.trim(),
      correctAnswer: scenario.modelAnswers[step],
      durationMs: Math.min(120_000, Date.now() - startedAt),
      xpAwarded: 0,
      source: 'practice',
    });
  };

  const advance = async () => {
    if (!scenario) return;
    if (step + 1 < scenario.prompts.length) {
      setStep((value) => value + 1);
      setText('');
      setShowHint(false);
      return;
    }
    const correct = results.filter((item) => item.correct).length;
    const xp = scenarioXp(correct, scenario.prompts.length);
    setEarnedXp(xp);
    setFinished(true);
    await recordAttempt({
      lessonId: scenario.id,
      exerciseId: `${scenario.id}-complete`,
      exerciseType: 'sentence',
      category: scenario.category,
      correct: correct > 0,
      userAnswer: `${correct}/${scenario.prompts.length} respostas adequadas`,
      correctAnswer: scenario.modelAnswers.join(' / '),
      durationMs: Math.min(600_000, Date.now() - startedAt),
      xpAwarded: xp,
      source: 'practice',
    });
  };

  if (!scenario) {
    return (
      <div>
        <PageHeader
          eyebrow="Prática com situações reais"
          title="Praticar inglês"
          description="Escolhe uma situação da vida real, escreve ou diz a tua resposta e compara com um modelo natural."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((item) => (
            <button key={item.id} type="button" onClick={() => select(item.id)} className="card flex flex-col items-start text-left transition hover:-translate-y-0.5 hover:border-ink/30">
              <div className="flex w-full items-start justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sun-soft"><Trophy size={19} /></span>
                <Tag>{item.cefr}</Tag>
              </div>
              <h2 className="mt-4 text-lg font-black">{item.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted">{item.description}</p>
              <p className="mt-4 text-xs font-extrabold">{item.prompts.length} respostas · {item.category}</p>
            </button>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted">
          As respostas são comparadas com ideias-chave e com um modelo. Não é uma avaliação fonética nem um teste oficial de nível.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button type="button" onClick={() => setScenarioId(null)} className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"><ArrowLeft size={15} /> Todas as situações</button>

      {finished ? (
        <div className="card text-center">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success"><CheckCircle2 size={32} /></div>
            <h1 className="mt-4 text-2xl font-black">Situação concluída</h1>
            <p className="mt-2 text-sm text-muted">Ganhaste {earnedXp} XP com base nas tuas respostas.</p>
            <div className="mt-6 space-y-3 text-left">
              {results.map((result, index) => (
                <div key={index} className="rounded-2xl border border-line p-4">
                  <p className="text-xs font-bold text-muted">{scenario.prompts[index]}</p>
                  <p className={`mt-1 text-sm font-bold ${result.correct ? 'text-success' : 'text-danger'}`}>{result.answer}</p>
                  {!result.correct && <p className="mt-1 text-xs text-muted">Modelo: {scenario.modelAnswers[index]}</p>}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={reset} className="btn-primary flex-1"><RotateCcw size={15} /> Repetir situação</button>
              <button type="button" onClick={() => setScenarioId(null)} className="btn-ghost flex-1">Outra situação</button>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Tag tone="sun">{scenario.cefr} · {scenario.category}</Tag>
              <h1 className="mt-2 text-2xl font-black">{scenario.title}</h1>
            </div>
            <Link href="/tutor" className="btn-ghost !px-3 !py-2 text-xs">Continuar com o tutor</Link>
          </div>
          <div className="mt-5"><ProgressBar value={step} max={scenario.prompts.length} /></div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-muted">Resposta {step + 1} de {scenario.prompts.length}</p>
          <p className="mt-2 text-xl font-black">{scenario.prompts[step]}</p>
          <p className="mt-1 text-sm text-muted">{scenario.translations[step]}</p>
          <div className="mt-3 flex items-center gap-2">
            <SpeakControl text={scenario.modelAnswers[step]} compact />
            <button type="button" onClick={() => setShowHint((value) => !value)} className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink">
              <Lightbulb size={14} /> {showHint ? 'Esconder dica' : 'Ver dica'}
            </button>
          </div>
          {showHint && <p className="mt-2 rounded-2xl bg-sun-soft p-3 text-sm font-bold">{scenario.hints[step]}</p>}

          <div className="mt-5">
            <SpeechInput value={text} onChange={setText} />
          </div>

          {results[step] !== undefined && (
            <div className={`mt-4 rounded-2xl border p-4 ${results[step].correct ? 'border-success/30 bg-success-soft' : 'border-danger/30 bg-danger-soft'}`} role="status">
              <p className="flex items-center gap-2 text-sm font-black">
                {results[step].correct ? <><CheckCircle2 size={17} className="text-success" /> Boa! Ideias-chave presentes.</> : <><X size={17} className="text-danger" /> Quase — vê o modelo abaixo.</>}
              </p>
              <p className="mt-2 text-sm">Modelo natural: <strong>{scenario.modelAnswers[step]}</strong></p>
              <button type="button" onClick={() => void advance()} className="btn-primary mt-4 w-full">
                {step + 1 === scenario.prompts.length ? 'Ver resultado' : 'Próxima resposta'} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {results[step] === undefined && (
            <button type="button" onClick={check} disabled={!text.trim()} className="btn-primary mt-5 w-full">
              Verificar resposta <Eye size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
