'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Mascot } from '@/components/Mascot';
import { useApp } from '@/components/AppContext';
import { EmptyState, ProgressBar, SectionTitle, StatTile, Tag } from '@/components/ui';
import { dateKey, deriveAnalytics, isLessonUnlocked, recommendLesson } from '@/lib/analytics';
import { getNextStep } from '@/lib/recommendations';
import { lessons } from '@/lib/content';
import { scenarios } from '@/lib/content/scenarios';
import { isOverdue } from '@/lib/srs';

export default function DashboardPage() {
  const { profile, completions, attempts, vocabulary } = useApp();
  const analytics = useMemo(() => deriveAnalytics(completions, attempts, vocabulary), [completions, attempts, vocabulary]);
  const recommended = useMemo(() => recommendLesson(profile, lessons, completions), [profile, completions]);
  const nextStep = useMemo(
    () => getNextStep({ analytics, profile, lessons, completions, attempts, vocabulary }),
    [analytics, profile, completions, attempts, vocabulary],
  );
  const xpGoal = profile.dailyGoalMinutes * 2;
  const overdue = vocabulary.filter((item) => isOverdue(item));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 19 ? 'Boa tarde' : 'Boa noite';
  const challengeIndex = new Date().getDate() % scenarios.length;
  const challenge = scenarios[challengeIndex];
  const challengeDone = attempts.some(
    (attempt) => attempt.source === 'practice' && attempt.lessonId === challenge.id && dateKey(attempt.timestamp) === dateKey(new Date()),
  );
  const recentMistakes = attempts
    .filter((attempt) => !attempt.correct && attempt.source === 'lesson')
    .slice(-2)
    .reverse()
    .map((attempt) => {
      const exercise = lessons.flatMap((lesson) => lesson.exercises).find((item) => item.id === attempt.exerciseId);
      return {
        prompt: exercise ? ('question' in exercise ? exercise.question : exercise.prompt) : attempt.exerciseId,
        correctAnswer: attempt.correctAnswer,
        explanation: exercise?.explanation ?? 'Revê este ponto na lição correspondente.',
        date: attempt.timestamp,
      };
    });

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-4xl bg-ink px-6 py-7 text-white sm:px-9">
        <div className="absolute -right-8 -top-10 h-48 w-48 rounded-full bg-sun/20 blur-2xl" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="min-w-[240px] flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sun">{greeting}!</p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              O teu inglês cresce<br />um dia de cada vez.
            </h1>
            <p className="mt-3 max-w-md text-sm text-white/70">
              Meta de hoje: <strong className="text-white">{analytics.todayXp} / {xpGoal} XP</strong> · {profile.dailyGoalMinutes} minutos de estudo
            </p>
            <div className="mt-4 max-w-md"><ProgressBar value={analytics.todayXp} max={xpGoal} /></div>
            <Link href={`/lesson/${recommended.id}`} className="btn-primary mt-6">
              Continuar a aprender <ArrowRight size={16} />
            </Link>
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Mascot className="h-40 w-40 sm:h-48 sm:w-48" mood="wink" />
          </motion.div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Sequência" value={`${analytics.streak} dias`} hint="Dias consecutivos com atividade" icon={<Flame size={17} className="text-danger" />} />
        <StatTile label="XP total" value={analytics.totalXp} hint="Lições, prática e revisões" icon={<Trophy size={17} className="text-sun-deep" />} />
        <StatTile label="Estudo" value={`${analytics.studyMinutes} min`} hint="Tempo guardado nas sessões" icon={<Clock3 size={17} className="text-muted" />} />
        <StatTile label="Lições" value={analytics.completedLessons} hint={`de ${lessons.length} disponíveis`} icon={<CheckCircle2 size={17} className="text-success" />} />
        <StatTile label="Precisão" value={`${analytics.accuracy}%`} hint={`${analytics.totalAttempts} respostas`} icon={<CheckCircle2 size={17} className="text-success" />} />
        <StatTile label="Palavras" value={vocabulary.length} hint={`${overdue.length} para revisar`} icon={<BookOpen size={17} className="text-muted" />} />
      </section>

      <section className="rounded-4xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">O teu próximo passo</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{nextStep.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{nextStep.description}</p>
            <p className="mt-3 text-xs text-muted">Regra aplicada: {nextStep.reason}</p>
          </div>
          <Link href={nextStep.href} className="btn-primary">
            {nextStep.cta} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle
            title="O teu percurso"
            action={<Link href="/learn" className="text-xs font-extrabold text-muted hover:text-ink">Ver tudo →</Link>}
          />
          <div className="space-y-3">
            {lessons.slice(0, 5).map((lesson, index) => {
              const done = completions.some((item) => item.lessonId === lesson.id);
              const unlocked = isLessonUnlocked(lesson.id, lessons, completions);
              return (
                <Link
                  key={lesson.id}
                  href={unlocked ? `/lesson/${lesson.id}` : '/learn'}
                  className={`flex items-center gap-4 rounded-3xl border bg-white p-4 shadow-card transition ${unlocked ? 'hover:border-ink/30' : 'opacity-60'}`}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${done ? 'bg-success-soft text-success' : unlocked ? 'bg-sun text-ink' : 'bg-cream text-muted'}`}>
                    {done ? <CheckCircle2 size={20} /> : unlocked ? index + 1 : <Lock size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold">{lesson.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{lesson.cefr} · {lesson.minutes} min · {lesson.exercises.length} exercícios</p>
                  </div>
                  {done && <Tag tone="green">Concluída</Tag>}
                </Link>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          <section className="card">
            <SectionTitle title="Desafio de hoje" />
            <p className="text-sm font-extrabold">{challenge.title}</p>
            <p className="mt-1 text-xs text-muted">{challenge.description}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Tag tone={challengeDone ? 'green' : 'sun'}>{challengeDone ? 'Concluído hoje' : 'Por fazer'}</Tag>
              <Link href={`/practice?scenario=${challenge.id}`} className="btn-primary !px-4 !py-2 text-xs">
                {challengeDone ? 'Repetir' : 'Começar'} <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          <section className="card">
            <SectionTitle title="Revisão inteligente" />
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lilac"><Sparkles size={18} /></span>
              <div>
                <p className="text-sm font-bold">{overdue.length > 0 ? `${overdue.length} palavras à tua espera` : 'Tudo em dia por agora'}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {overdue.length > 0 ? 'Revê antes de esquecer — leva poucos minutos.' : 'Volta amanhã ou adiciona novas palavras ao caderno.'}
                </p>
              </div>
            </div>
            <Link href="/review" className="btn-ghost mt-4 w-full">Ir para revisão</Link>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Esta semana" />
          <div className="card">
            <div className="flex h-32 items-end justify-between gap-2">
              {analytics.week.map((day) => (
                <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-muted">{day.xp || ''}</span>
                  <div className={`w-full rounded-t-xl transition-all ${day.xp > 0 ? 'bg-sun' : 'bg-line'}`} style={{ height: `${Math.max(6, Math.min(100, day.xp * 4))}%` }} />
                  <span className="text-[11px] font-bold text-muted">{day.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
              {analytics.studyMinutes} minutos estudados · {analytics.totalAttempts} exercícios respondidos · melhor dia: {analytics.personalBestXp} XP
            </p>
          </div>
        </section>

        <section>
          <SectionTitle title="Erros recentes" />
          {recentMistakes.length === 0 ? (
            <EmptyState title="Ainda sem erros registados" description="Quando errares um exercício, guardamos a resposta correta aqui para poderes rever." />
          ) : (
            <div className="space-y-3">
              {recentMistakes.map((mistake) => (
                <div key={mistake.prompt + mistake.date} className="card !p-4">
                  <p className="text-xs text-muted">{mistake.prompt}</p>
                  <p className="mt-1 text-sm font-bold text-success">{mistake.correctAnswer}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{mistake.explanation}</p>
                </div>
              ))}
              <Link href="/review" className="inline-flex items-center gap-1 text-xs font-extrabold hover:underline">Rever vocabulário <ArrowRight size={13} /></Link>
            </div>
          )}
        </section>
      </div>

      {analytics.totalAttempts === 0 && (
        <p className="flex items-center gap-2 rounded-2xl bg-cream px-4 py-3 text-xs text-muted">
          <Clock3 size={14} /> As estatísticas aparecem à medida que estudas. Nada aqui é inventado.
        </p>
      )}
    </div>
  );
}
