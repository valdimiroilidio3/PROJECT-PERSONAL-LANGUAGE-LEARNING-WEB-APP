'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Mascot } from '@/components/Mascot';
import { useApp } from '@/components/AppContext';
import { EmptyState, ProgressBar, SectionTitle, StatTile, Tag } from '@/components/ui';
import { FadeUp } from '@/components/effects';
import { dateKey, deriveAnalytics, isLessonUnlocked, recommendLesson } from '@/lib/analytics';
import { getNextStep } from '@/lib/recommendations';
import { lessonsFor, scenariosFor } from '@/lib/content';
import { examsFor, examAttemptStats } from '@/lib/exams';
import { isOverdue } from '@/lib/srs';
import { deriveDailyQuests, deriveHabitGarden, deriveLeague, deriveMonthlyChallenge, deriveWeeklyChallenges } from '@/lib/gamification';

export default function DashboardPage() {
  const { profile, language, completions, attempts, vocabulary } = useApp();
  const lessons = useMemo(() => lessonsFor(profile.targetLanguage), [profile.targetLanguage]);
  const scenarios = useMemo(() => scenariosFor(profile.targetLanguage), [profile.targetLanguage]);
  const analytics = useMemo(() => deriveAnalytics(completions, attempts, vocabulary), [completions, attempts, vocabulary]);
  const recommended = useMemo(() => recommendLesson(profile, lessons, completions), [profile, completions, lessons]);
  const nextStep = useMemo(
    () => getNextStep({ analytics, profile, lessons, completions, attempts, vocabulary }),
    [analytics, profile, completions, attempts, vocabulary, lessons],
  );
  const quests = useMemo(
    () => deriveDailyQuests({ analytics, profile, completions, attempts, vocabulary }),
    [analytics, profile, completions, attempts, vocabulary],
  );
  const league = useMemo(() => deriveLeague(analytics.totalXp), [analytics.totalXp]);
  const weekly = useMemo(
    () => deriveWeeklyChallenges({ analytics, profile, completions, attempts, vocabulary }),
    [analytics, profile, completions, attempts, vocabulary],
  );
  const garden = useMemo(
    () => deriveHabitGarden({ completions, attempts }),
    [completions, attempts],
  );
  const monthly = useMemo(
    () => deriveMonthlyChallenge({ analytics, profile, completions, attempts, vocabulary }),
    [analytics, profile, completions, attempts, vocabulary],
  );
  const examStats = useMemo(
    () => examsFor(profile.targetLanguage).map((exam) => examAttemptStats(exam, attempts)),
    [profile.targetLanguage, attempts],
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
              O teu {language.label.toLowerCase()} cresce<br />um dia de cada vez.
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
        {[
          { label: 'Sequência', value: `${analytics.streak} dias`, hint: 'Dias consecutivos com atividade', delay: 0, icon: <Flame size={17} className="text-danger" /> },
          { label: 'XP total', value: analytics.totalXp, hint: 'Lições, prática e revisões', delay: 1, icon: <Trophy size={17} className="text-sun-deep" /> },
          { label: 'Estudo', value: `${analytics.studyMinutes} min`, hint: 'Tempo guardado nas sessões', delay: 2, icon: <Clock3 size={17} className="text-muted" /> },
          { label: 'Lições', value: analytics.completedLessons, hint: `de ${lessons.length} disponíveis`, delay: 3, icon: <CheckCircle2 size={17} className="text-success" /> },
          { label: 'Precisão', value: `${analytics.accuracy}%`, hint: `${analytics.totalAttempts} respostas`, delay: 4, icon: <CheckCircle2 size={17} className="text-success" /> },
          { label: 'Palavras', value: vocabulary.length, hint: `${overdue.length} para revisar`, delay: 5, icon: <BookOpen size={17} className="text-muted" /> },
        ].map((tile) => (
          <FadeUp key={tile.label} delay={tile.delay * 0.05} className="h-full">
            <StatTile label={tile.label} value={tile.value} hint={tile.hint} icon={tile.icon} />
          </FadeUp>
        ))}
      </section>

      <section>
        <SectionTitle title="Missões de hoje" action={<span className="text-xs font-bold text-muted">{quests.filter((quest) => quest.completed).length} de {quests.length} concluídas</span>} />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {quests.map((quest) => (
            <Link
              key={quest.id}
              href={quest.href}
              className={`card flex flex-col gap-3 transition hover:-translate-y-0.5 hover:border-ink/25 ${quest.completed ? 'border-success/40 bg-success-soft' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-extrabold">{quest.title}</p>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${quest.completed ? 'bg-success text-white' : 'bg-cream text-muted'}`}>
                  {quest.completed ? <CheckCircle2 size={16} /> : `${quest.progress}`}
                </span>
              </div>
              <p className="flex-1 text-xs leading-relaxed text-muted">{quest.description}</p>
              <ProgressBar value={quest.progress} max={quest.target} color={quest.completed ? 'bg-success' : 'bg-sun'} />
              <p className="text-[11px] font-extrabold text-muted">{quest.progress} / {quest.target} {quest.unit}</p>
            </Link>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          As duas últimas missões mudam todos os dias. Todo o progresso vem apenas de atividade guardada neste browser.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex items-center gap-4 rounded-4xl border border-line bg-white p-5 shadow-card">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-sun-soft text-3xl" aria-hidden>{league.emblem}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">A tua liga</p>
            <p className="mt-1 text-2xl font-black">{league.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {league.next
                ? `${league.next.minXp - analytics.totalXp} XP até ${league.next.name}.`
                : 'Topo da escala pessoal. Continua a praticar para manter o ritmo.'}
            </p>
            <div className="mt-3"><ProgressBar value={league.progress} max={league.target} /></div>
          </div>
          <Image
            src="/images/nori-league.jpg"
            alt="Nori no pódio com o troféu ao alto"
            width={1024}
            height={1024}
            className="hidden h-28 w-28 shrink-0 rounded-3xl border border-line object-cover sm:block"
          />
        </div>
        <div className="rounded-4xl border border-line bg-white p-5 shadow-card">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Como funcionam as ligas</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Não há rivais inventados: a liga sobe apenas com o XP que ganhaste nas lições, prática e revisões guardadas neste browser.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-extrabold">
            <Tag>🥉 Bronze · 0 XP</Tag><Tag>🥈 Prata · 100 XP</Tag><Tag>🥇 Ouro · 300 XP</Tag><Tag>💎 Safira · 700 XP</Tag><Tag>👑 Diamante · 1500 XP</Tag>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-4xl bg-ink text-white shadow-card">
        <div className="absolute -left-10 -bottom-12 h-44 w-44 rounded-full bg-sun/15 blur-2xl" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-5 p-5 sm:p-6">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-sun text-ink" aria-hidden>
            <Trophy size={30} />
          </span>
          <div className="min-w-[220px] flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-sun">Desafio do mês · {monthly.monthLabel}</p>
            <h2 className="mt-1 text-2xl font-black">{monthly.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-white/70">{monthly.description}</p>
            <div className="mt-3 max-w-md"><ProgressBar value={monthly.progress} max={monthly.target} /></div>
            <p className="mt-2 text-[11px] font-extrabold text-white/60">{monthly.progress} / {monthly.target} {monthly.unit}{monthly.completed ? ' · concluído' : ''}</p>
          </div>
          <Link href={monthly.href} className="btn-primary shrink-0">
            {monthly.completed ? 'Repetir' : 'Começar'} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="card min-w-0">
          <SectionTitle
            title="Desafios da semana"
            action={<span className="text-xs font-bold text-muted">{weekly.window.label}</span>}
          />
          <div className="space-y-3">
            {weekly.challenges.slice(0, 4).map((challenge) => (
              <Link
                key={challenge.id}
                href={challenge.href}
                className="flex flex-col gap-2 rounded-2xl border border-line p-3 transition hover:border-ink/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-extrabold">{challenge.title}</p>
                  <Tag tone={challenge.completed ? 'green' : 'sun'}>
                    {challenge.completed ? 'Feito' : `${challenge.progress} / ${challenge.target}`}
                  </Tag>
                </div>
                <p className="text-xs leading-relaxed text-muted">{challenge.description}</p>
                <ProgressBar value={challenge.progress} max={challenge.target} color={challenge.completed ? 'bg-success' : 'bg-sun'} />
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted">
            A semana começa à segunda-feira. Quatro desafios de cada vez; dois alternam semanalmente. Não há penalização por dias sem atividade.
          </p>
        </div>

        <div className="card min-w-0">
          <div className="flex items-start justify-between gap-3">
            <SectionTitle title="Jardim de hábitos" />
            <Image
              src="/images/nori-garden.jpg"
              alt="Nori a regar plantas que nascem de livros abertos"
              width={1024}
              height={1024}
              className="-mt-2 h-20 w-20 shrink-0 rounded-2xl border border-line object-cover"
            />
          </div>
          <div className="grid grid-cols-7 gap-1.5" aria-label="Atividade dos últimos 28 dias">
            {garden.days.map((day) => {
              const dateLabel = new Date(`${day.key}T12:00:00`).toLocaleDateString('pt-PT', {
                day: 'numeric',
                month: 'short',
              });
              return (
                <div
                  key={day.key}
                  title={`${dateLabel}: ${day.active ? `${day.xp} XP · ${day.minutes} min` : 'sem atividade guardada'}`}
                  aria-label={`${dateLabel}: ${day.active ? `${day.xp} XP` : 'sem atividade'}`}
                  className={`flex h-9 items-center justify-center rounded-xl text-[10px] font-black ${
                    day.active
                      ? day.isToday
                        ? 'bg-ink text-white'
                        : 'bg-success-soft text-success'
                      : 'bg-line text-muted'
                  }`}
                >
                  {day.label}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
            <span><strong className="text-ink">{garden.activeDays}</strong> dias com atividade</span>
            <span><strong className="text-ink">{garden.totalXp}</strong> XP no período</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Cada quadrado é um dia real guardado neste browser. Dias vazios não apagam XP, liga nem conquistas.
          </p>
        </div>
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
        <section className="min-w-0">
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
                    <p className="mt-0.5 text-xs text-muted">{lesson.level} · {lesson.minutes} min · {lesson.exercises.length} exercícios</p>
                  </div>
                  {done && <Tag tone="green">Concluída</Tag>}
                </Link>
              );
            })}
          </div>
        </section>

        <div className="min-w-0 space-y-4">
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

          <section className="card">
            <SectionTitle
              title="Simulados"
              action={<Link href="/exames" className="text-xs font-extrabold text-muted hover:text-ink">Ver tudo →</Link>}
            />
            {examStats.length === 0 ? (
              <p className="text-xs leading-relaxed text-muted">Os simulados existem para as línguas naturais. No teu pacote praticas com exercícios e projetos guiados.</p>
            ) : (
              <div className="space-y-3">
                {examStats.map((stats) => (
                  <div key={stats.examId} className="rounded-2xl border border-line p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-extrabold"><GraduationCap size={15} className="text-sun-deep" /> Simulado {stats.level}</p>
                      {stats.attempts > 0 ? (
                        <Tag tone={stats.passed ? 'green' : 'sun'}>{stats.passed ? 'Aprovado' : `${stats.bestPercent}%`}</Tag>
                      ) : (
                        <Tag tone="sun">Por fazer</Tag>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {stats.attempts > 0 ? (
                        <>Melhor: <strong className="text-ink">{stats.bestCorrect}/{stats.total}</strong> · {stats.attempts} {stats.attempts === 1 ? 'tentativa' : 'tentativas'} · {stats.xp} XP ganhos</>
                      ) : (
                        `${stats.total} questões · com cronómetro · resultado indicativo`
                      )}
                    </p>
                    {stats.attempts > 0 && <div className="mt-2"><ProgressBar value={stats.bestCorrect} max={stats.total} color={stats.passed ? 'bg-success' : 'bg-sun'} /></div>}
                    <Link href="/exames" className="btn-ghost mt-3 w-full !py-2 text-xs">
                      {stats.attempts > 0 ? 'Repetir simulado' : 'Fazer simulado'} <ArrowRight size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
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
