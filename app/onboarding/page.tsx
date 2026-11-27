'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CircleCheck } from 'lucide-react';
import { Mascot } from '@/components/Mascot';
import { useApp } from '@/components/AppContext';
import { diagnosticFor, lessonForScore, lessonsFor } from '@/lib/content';
import { languages } from '@/lib/languages';
import type { LanguageId, LearnerGoal, LearnerLevel } from '@/lib/types';

const levels: { id: LearnerLevel; title: string; description: string }[] = [
  { id: 'beginner', title: 'Iniciante', description: 'Começo do zero ou com frases muito simples.' },
  { id: 'elementary', title: 'Elementar', description: 'Consigo entender e usar expressões do dia a dia.' },
  { id: 'intermediate', title: 'Intermédio', description: 'Consigo manter conversas e perceber textos simples.' },
  { id: 'advanced', title: 'Avançado', description: 'Quero aperfeiçoar fluência e precisão.' },
];

const goals: { id: LearnerGoal; title: string; description: string }[] = [
  { id: 'everyday', title: 'Vida diária', description: 'Comunicar em situações habituais.' },
  { id: 'work', title: 'Trabalho', description: 'Reuniões, e-mails e entrevistas.' },
  { id: 'travel', title: 'Viagens', description: 'Aeroportos, hotéis e restaurantes.' },
  { id: 'study', title: 'Estudo', description: 'Ler, escrever e participar em aulas.' },
  { id: 'fluency', title: 'Fluência geral', description: 'Evoluir de forma equilibrada.' },
];

const dailyGoals = [5, 10, 15, 20] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const [languageId, setLanguageId] = useState<LanguageId>(profile.targetLanguage);
  const [level, setLevel] = useState<LearnerLevel>(profile.level);
  const [goal, setGoal] = useState<LearnerGoal>(profile.goal);
  const [minutes, setMinutes] = useState<(typeof dailyGoals)[number]>(profile.dailyGoalMinutes);
  const [answers, setAnswers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const language = languages.find((item) => item.id === languageId) ?? languages[0];
  const diagnostic = diagnosticFor(languageId);
  const totalSteps = 5 + diagnostic.length;
  const score = answers.reduce((sum, answer, index) => sum + (answer === diagnostic[index]?.answerIndex ? (diagnostic[index]?.points ?? 0) : 0), 0);
  const diagnosticDone = diagnostic.length > 0 && answers.length === diagnostic.length;
  const recommended = lessonForScore(languageId, score);
  const packSize = lessonsFor(languageId).length;

  const changeLanguage = (id: LanguageId) => {
    setLanguageId(id);
    setAnswers([]);
    setStep(0);
  };

  const finish = async () => {
    setSaving(true);
    await updateProfile({
      onboarded: true,
      nativeLanguage: 'pt',
      targetLanguage: languageId,
      level,
      goal,
      dailyGoalMinutes: minutes,
      diagnosticScore: score,
      recommendedLessonId: recommended.id,
    });
    router.push('/learn');
  };

  const canAdvance =
    step < 4 ||
    (step < totalSteps - 1 && answers[step - 4] !== undefined) ||
    (step === totalSteps - 1 && diagnosticDone);

  return (
    <div className="mx-auto max-w-2xl">
      {step === 0 && (
        <div className="relative mb-6 overflow-hidden rounded-4xl border border-line shadow-card">
          <Image
            src="/images/nori-journey.jpg"
            alt="Nori, a mascote do Lumio, a percorrer um caminho de livros e letras ao nascer do sol"
            width={1376}
            height={768}
            priority
            className="h-36 w-full object-cover sm:h-44"
          />
        </div>
      )}
      <div className="mb-8 flex items-center gap-3">
        <Mascot className="h-16 w-16 shrink-0" mood={step === totalSteps - 1 ? 'celebrate' : 'wink'} />
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">Configuração inicial</p>
          <p className="text-sm text-muted">Passo {Math.min(step + 1, totalSteps)} de {totalSteps}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-sun transition-all" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
          </div>
        </div>
      </div>

      <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="card min-h-[380px]">
        {step === 0 && (
          <>
            <h1 className="text-2xl font-black">O que queres aprender?</h1>
            <p className="mt-2 text-sm text-muted">Escolhe uma língua ou uma linguagem de programação. Podes mudar sempre que quiseres nas definições.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {languages.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeLanguage(item.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${languageId === item.id ? 'border-ink bg-sun-soft' : 'border-line hover:border-ink/30'}`}
                  aria-pressed={languageId === item.id}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-lg font-black">{item.emblem}</span>
                  <span className="min-w-0">
                    <span className="block font-extrabold">{item.label}</span>
                    <span className="block text-[11px] leading-snug text-muted">{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-5 rounded-2xl bg-cream p-4 text-sm leading-relaxed text-muted">
              Tudo funciona sem conta, sem subscrição e sem enviar os teus dados para a nuvem. O progresso de cada língua fica separado.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-2xl font-black">Qual é o teu nível atual?</h1>
            <p className="mt-2 text-sm text-muted">Não te preocupes: é só um ponto de partida.</p>
            <div className="mt-6 space-y-3">
              {levels.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLevel(item.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${level === item.id ? 'border-ink bg-sun-soft' : 'border-line hover:border-ink/30'}`}
                  aria-pressed={level === item.id}
                >
                  <span><span className="block font-extrabold">{item.title}</span><span className="mt-1 block text-xs text-muted">{item.description}</span></span>
                  {level === item.id && <CircleCheck size={20} />}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-black">Porque queres aprender {language.label.toLowerCase()}?</h1>
            <p className="mt-2 text-sm text-muted">Adaptamos os exemplos e as situações ao teu objetivo.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {goals.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGoal(item.id)}
                  className={`rounded-2xl border p-4 text-left transition ${goal === item.id ? 'border-ink bg-sun-soft' : 'border-line hover:border-ink/30'}`}
                  aria-pressed={goal === item.id}
                >
                  <span className="block font-extrabold">{item.title}</span>
                  <span className="mt-1 block text-xs text-muted">{item.description}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-black">Quanto tempo tens por dia?</h1>
            <p className="mt-2 text-sm text-muted">Define uma meta realista. Podes alterá-la sempre que quiseres.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {dailyGoals.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMinutes(value)}
                  className={`rounded-2xl border py-7 text-center transition ${minutes === value ? 'border-ink bg-sun' : 'border-line hover:border-ink/30'}`}
                  aria-pressed={minutes === value}
                >
                  <span className="block text-2xl font-black">{value}</span>
                  <span className="text-xs font-bold text-muted">minutos</span>
                </button>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted">Não vais ser penalizado por falhar um dia — a sequência simplesmente recomeça.</p>
          </>
        )}

        {step >= 4 && step < totalSteps - 1 && (
          <>
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Mini-diagnóstico · {step - 3}/{diagnostic.length}</p>
            <h1 className="mt-2 text-2xl font-black">Escolhe a resposta correta</h1>
            <p className="mt-2 text-sm text-muted">Pergunta retirada do conteúdo real de {language.label}.</p>
            <p className="mt-6 rounded-2xl bg-cream p-5 text-xl font-extrabold">{diagnostic[step - 4].prompt}</p>
            <div className="mt-4 space-y-3">
              {diagnostic[step - 4].options.map((option, index) => (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  onClick={() => setAnswers((previous) => {
                    const next = [...previous];
                    next[step - 4] = index;
                    return next;
                  })}
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-base font-bold transition ${answers[step - 4] === index ? 'border-ink bg-sun-soft' : 'border-line hover:border-ink/30'}`}
                  aria-pressed={answers[step - 4] === index}
                >
                  <span>{option}</span>
                  {answers[step - 4] === index && <Check size={18} />}
                </button>
              ))}
            </div>
          </>
        )}

        {step === totalSteps - 1 && (
          <>
            <Mascot className="mx-auto h-28 w-28" mood="celebrate" />
            <h1 className="mt-3 text-center text-2xl font-black">Plano pronto</h1>
            <p className="mt-2 text-center text-sm text-muted">
              Vais começar com {language.emblem} {language.label}, {level} · {minutes} min/dia.
            </p>
            <div className="mt-6 rounded-2xl bg-cream p-5 text-sm leading-relaxed">
              <p><strong>Primeira lição:</strong> {recommended.title}</p>
              <p className="mt-1 text-muted">Com base nas tuas respostas ({score} pontos), recomendamos começar por aqui. O diagnóstico é apenas indicativo — não é um nível oficial.</p>
              <p className="mt-2 text-xs text-muted">{packSize} lições disponíveis neste percurso. As estatísticas de outras línguas ficam separadas.</p>
            </div>
          </>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          {step < totalSteps - 1 ? (
            <button type="button" onClick={() => setStep((value) => value + 1)} disabled={!canAdvance} className="btn-primary disabled:opacity-40">
              Continuar <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={() => void finish()} disabled={!diagnosticDone || saving} className="btn-primary disabled:opacity-40">
              {saving ? 'A guardar…' : 'Começar'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
