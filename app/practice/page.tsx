'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, Lightbulb, RotateCcw, Trophy, X } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { SpeechInput, SpeakControl } from '@/components/Speech';
import { Confetti, CountUp, FadeUp, popIn, Stagger, StaggerItem } from '@/components/effects';
import { PageHeader, ProgressBar, Tag } from '@/components/ui';
import { scenariosFor } from '@/lib/content';
import { levelLabel } from '@/lib/languages';
import { evaluateScenarioAnswer, scenarioXp } from '@/lib/practice';

interface PracticeResult {
  answer: string;
  correct: boolean;
}

export default function PracticePage() {
  const { profile, language, recordAttempt } = useApp();
  const scenarios = useMemo(() => scenariosFor(profile.targetLanguage), [profile.targetLanguage]);
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
  }, [scenarios]);

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
          title={`Praticar ${language.label.toLowerCase()}`}
          description="Escolhe uma situação da vida real, escreve ou diz a tua resposta e compara com um modelo natural."
        />
        <FadeUp className="relative mb-6 overflow-hidden rounded-4xl border border-line shadow-card">
          <Image
            src="/images/nori-practice.jpg"
            alt="Nori atrás do balcão de um café, de braços abertos, pronto para interpretar a cena"
            width={1376}
            height={768}
            priority
            className="h-44 w-full object-cover object-[50%_38%] sm:h-56"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/30 to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-center p-5 sm:p-7">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-sun">Cenas da vida real</p>
            <p className="mt-1 max-w-[260px] text-lg font-black leading-snug text-white sm:max-w-xs sm:text-2xl">O Nori interpreta quem está do outro lado da cena.</p>
          </div>
        </FadeUp>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((item) => (
            <StaggerItem key={item.id} className="h-full">
            <button type="button" onClick={() => select(item.id)} className="card flex h-full w-full flex-col items-start text-left transition hover:-translate-y-0.5 hover:border-ink/30">
              <div className="flex w-full items-start justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sun-soft"><Trophy size={19} /></span>
                <Tag>{levelLabel(item.languageId, item.level)}</Tag>
              </div>
              <h2 className="mt-4 text-lg font-black">{item.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted">{item.description}</p>
              <p className="mt-4 text-xs font-extrabold">{item.prompts.length} respostas · {item.category}</p>
            </button>
            </StaggerItem>
          ))}
        </Stagger>
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
        <div className="card relative overflow-hidden text-center">
          <Confetti mode="rain" count={44} />
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <motion.div {...popIn(0.1)} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success"><CheckCircle2 size={32} /></motion.div>
            <h1 className="mt-4 text-2xl font-black">Situação concluída</h1>
            <p className="mt-2 text-sm text-muted">Ganhaste <CountUp value={earnedXp} /> XP com base nas tuas respostas.</p>
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
              <Tag tone="sun">{levelLabel(scenario.languageId, scenario.level)} · {scenario.category}</Tag>
              <h1 className="mt-2 text-2xl font-black">{scenario.title}</h1>
            </div>
            <Link href="/tutor" className="btn-ghost !px-3 !py-2 text-xs">Continuar com o tutor</Link>
          </div>
          <div className="mt-5"><ProgressBar value={step} max={scenario.prompts.length} /></div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-muted">Resposta {step + 1} de {scenario.prompts.length}</p>
          <p className="mt-2 text-xl font-black">{scenario.prompts[step]}</p>
          <p className="mt-1 text-sm text-muted">{scenario.translations[step]}</p>
          <div className="mt-3 flex items-center gap-2">
            {language.speech && <SpeakControl text={scenario.modelAnswers[step]} compact />}
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
