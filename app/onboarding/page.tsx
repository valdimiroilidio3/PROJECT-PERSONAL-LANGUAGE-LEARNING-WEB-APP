'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CircleCheck } from 'lucide-react';
import { Mascot } from '@/components/Mascot';
import { useApp } from '@/components/AppContext';
import type { LearnerGoal, LearnerLevel } from '@/lib/types';

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

const diagnostic = [
  { question: 'I ___ from Portugal.', options: ['am', 'is', 'are'], answer: 0, points: 1, translation: 'Sou de Portugal.' },
  { question: 'She ___ to work by bus.', options: ['go', 'goes', 'going'], answer: 1, points: 2, translation: 'Ela vai para o trabalho de autocarro.' },
  { question: 'Yesterday I ___ to the cinema.', options: ['go', 'went', 'have gone'], answer: 1, points: 2, translation: 'Ontem fui ao cinema.' },
  { question: 'If I ___ more time, I would travel more.', options: ['have', 'had', 'will have'], answer: 1, points: 3, translation: 'Se tivesse mais tempo, viajaria mais.' },
  { question: 'Although it was late, we ___ working.', options: ['continued', 'continue', 'continues'], answer: 0, points: 4, translation: 'Embora fosse tarde, continuámos a trabalhar.' },
];

function recommend(score: number): string {
  if (score <= 3) return 'greetings';
  if (score <= 6) return 'numbers-time';
  if (score <= 9) return 'past-experiences';
  return 'opinions';
}

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile } = useApp();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<LearnerLevel>(profile.level);
  const [goal, setGoal] = useState<LearnerGoal>(profile.goal);
  const [minutes, setMinutes] = useState<(typeof dailyGoals)[number]>(profile.dailyGoalMinutes);
  const [answers, setAnswers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const totalSteps = 5 + diagnostic.length;
  const score = answers.reduce((sum, answer, index) => sum + (answer === diagnostic[index].answer ? diagnostic[index].points : 0), 0);
  const diagnosticDone = answers.length === diagnostic.length;
  const recommended = recommend(score);

  const finish = async () => {
    setSaving(true);
    await updateProfile({
      onboarded: true,
      nativeLanguage: 'pt',
      targetLanguage: 'en',
      level,
      goal,
      dailyGoalMinutes: minutes,
      diagnosticScore: score,
      recommendedLessonId: recommended,
    });
    router.push('/learn');
  };

  const canAdvance =
    step < 4 ||
    (step < totalSteps - 1 && answers[step - 4] !== undefined) ||
    (step === totalSteps - 1 && diagnosticDone);

  return (
    <div className="mx-auto max-w-2xl">
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
            <h1 className="text-2xl font-black">Vamos criar o teu plano</h1>
            <p className="mt-2 text-sm text-muted">Escolhemos português como língua nativa e inglês como língua a aprender. Podes mudar depois.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border-2 border-ink bg-cream p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">De</p>
                <p className="mt-2 text-xl font-black">🇵🇹 Português</p>
              </div>
              <div className="rounded-3xl border-2 border-sun bg-sun-soft p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Para</p>
                <p className="mt-2 text-xl font-black">🇬🇧 Inglês</p>
              </div>
            </div>
            <p className="mt-6 rounded-2xl bg-cream p-4 text-sm leading-relaxed text-muted">
              Tudo funciona sem conta, sem subscrição e sem enviar os teus dados para a nuvem.
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
            <h1 className="text-2xl font-black">Porque queres aprender inglês?</h1>
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
            <h1 className="mt-2 text-2xl font-black">Escolhe a forma correta</h1>
            <p className="mt-2 text-sm text-muted">{diagnostic[step - 4].translation}</p>
            <p className="mt-6 rounded-2xl bg-cream p-5 text-xl font-extrabold">{diagnostic[step - 4].question}</p>
            <div className="mt-4 space-y-3">
              {diagnostic[step - 4].options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswers((previous) => {
                    const next = [...previous];
                    next[step - 4] = index;
                    return next;
                  })}
                  className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-base font-bold transition ${answers[step - 4] === index ? 'border-ink bg-sun-soft' : 'border-line hover:border-ink/30'}`}
                  aria-pressed={answers[step - 4] === index}
                >
                  {option}
                  {answers[step - 4] === index && <Check size={18} />}
                </button>
              ))}
            </div>
          </>
        )}

        {step === totalSteps - 1 && (
          <>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">Plano pronto</p>
            <h1 className="mt-2 text-3xl font-black">Vamos começar!</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Com base nas tuas respostas ({score} pontos), recomendamos começar pela lição abaixo. O diagnóstico é apenas indicativo — não é um nível CEFR oficial.
            </p>
            <div className="mt-6 rounded-3xl bg-sun-soft p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Primeira lição recomendada</p>
              <p className="mt-2 text-lg font-black">{recommended === 'greetings' ? 'Saudações e apresentações' : recommended === 'numbers-time' ? 'Números e horas' : recommended === 'past-experiences' ? 'Experiências passadas' : 'Opiniões e razões'}</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-2xl bg-cream p-3"><p className="font-black">{minutes} min</p><p className="text-muted">por dia</p></div>
              <div className="rounded-2xl bg-cream p-3"><p className="font-black capitalize">{level}</p><p className="text-muted">nível</p></div>
              <div className="rounded-2xl bg-cream p-3"><p className="font-black capitalize">{goal}</p><p className="text-muted">objetivo</p></div>
            </div>
          </>
        )}
      </motion.div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" className="btn-ghost" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
          <ArrowLeft size={16} /> Voltar
        </button>
        {step < totalSteps - 1 ? (
          <button type="button" className="btn-primary" disabled={!canAdvance} onClick={() => setStep((value) => value + 1)}>
            Continuar <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className="btn-primary" disabled={saving} onClick={() => void finish()}>
            {saving ? 'A guardar…' : 'Começar a aprender'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
