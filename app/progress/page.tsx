'use client';

import { ArrowRight, Award, BarChart3, Clock3, GraduationCap, Info, Trophy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useApp } from '@/components/AppContext';
import { EmptyState, PageHeader, ProgressBar, SectionTitle, StatTile, Tag } from '@/components/ui';
import { popIn } from '@/components/effects';
import { deriveAchievements, deriveAnalytics } from '@/lib/analytics';
import { accuracyPercent } from '@/lib/scoring';
import { getLesson } from '@/lib/content';
import { examsFor, examAttemptStats, examAttemptHistory } from '@/lib/exams';

export default function ProgressPage() {
  const { language, completions, attempts, vocabulary, sessions } = useApp();
  const analytics = deriveAnalytics(completions, attempts, vocabulary);
  const reviewCount = attempts.filter((item) => item.source === 'review').length;
  const achievements = deriveAchievements(analytics, reviewCount, sessions.length);
  const maxXp = Math.max(1, ...analytics.week.map((day) => day.xp));
  const exams = examsFor(language.id);
  const examStats = exams.map((exam) => examAttemptStats(exam, attempts));
  const examHistory = exams.map((exam) => ({ exam, records: examAttemptHistory(exam, attempts) }));
  const passPercentByExam = new Map(exams.map((exam) => [exam.id, exam.passPercent]));

  return (
    <div>
      <PageHeader
        eyebrow="Estatísticas reais"
        title={`O teu progresso em ${language.label.toLowerCase()}`}
        description="Tudo o que vês aqui vem das tuas lições, respostas e revisões guardadas neste browser."
        action={
          <Image
            src="/images/nori-progress.jpg"
            alt="Nori no cimo de um monte, com uma bandeira de estrela a assinalar a subida"
            width={1024}
            height={1024}
            className="hidden h-36 w-36 shrink-0 rounded-3xl border border-line object-cover object-[50%_20%] shadow-card sm:block"
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Tempo de estudo" value={`${analytics.studyMinutes} min`} hint="Tempo registado em lições e prática" icon={<Clock3 size={17} className="text-muted" />} />
        <StatTile label="Lições concluídas" value={analytics.completedLessons} hint="Cada lição conta uma vez" icon={<BarChart3 size={17} className="text-sun-deep" />} />
        <StatTile label="Vocabulário ativo" value={analytics.vocabularyLearned} hint={`de ${vocabulary.length} palavras guardadas`} icon={<Award size={17} className="text-success" />} />
        <StatTile label="Precisão" value={`${analytics.accuracy}%`} hint={`${analytics.totalAttempts} respostas registadas`} icon={<Trophy size={17} className="text-danger" />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle title="Atividade dos últimos 7 dias" />
          <div className="card">
            <div className="space-y-3">
              {analytics.week.map((day) => (
                <div key={day.key} className="flex items-center gap-3">
                  <span className="w-12 text-xs font-bold capitalize text-muted">{new Date(day.key).toLocaleDateString('pt-PT', { weekday: 'short' })}</span>
                  <div className="flex-1"><ProgressBar value={day.xp} max={maxXp} label={`XP registado em ${new Date(day.key).toLocaleDateString('pt-PT')}`} /></div>
                  <span className="w-14 text-right text-xs font-extrabold">{day.xp} XP</span>
                  <span className="w-12 text-right text-[11px] text-muted">{day.minutes}m</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <p><span className="block text-xs text-muted">Sequência atual</span><strong>{analytics.streak} dias</strong></p>
              <p><span className="block text-xs text-muted">Melhor dia</span><strong>{analytics.personalBestXp} XP</strong></p>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle title="Categorias" />
          {analytics.categories.length === 0 ? (
            <EmptyState title="Ainda sem dados por categoria" description="Responde a exercícios para veres onde estás mais forte e onde precisas de praticar mais." />
          ) : (
            <div className="card space-y-4">
              {analytics.categories.slice(0, 8).map((category) => (
                <div key={category.category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-bold">{category.category}</span>
                    <span className="text-xs text-muted">{category.accuracy}% · {category.total} respostas</span>
                  </div>
                  <ProgressBar value={category.correct} max={category.total} color={category.accuracy >= 80 ? 'bg-success' : category.accuracy >= 50 ? 'bg-sun' : 'bg-danger'} label={`Acertos em ${category.category}`} />
                </div>
              ))}
              <p className="border-t border-line pt-3 text-xs text-muted">
                {analytics.strongest ? `Mais forte: ${analytics.strongest.category}. ` : ''}
                {analytics.weakest ? `A precisar de prática: ${analytics.weakest.category}.` : ''}
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-8">
        <SectionTitle title="Conquistas" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((badge, index) =>
            badge.earned ? (
              <motion.div key={badge.id} {...popIn(index * 0.05)} className="rounded-3xl border border-sun bg-sun-soft p-5">
                <div className="flex items-start justify-between gap-3">
                  <Award size={22} className="text-sun-deep" />
                  <Tag tone="green">Conquistada</Tag>
                </div>
                <p className="mt-3 font-black">{badge.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{badge.description}</p>
                <p className="mt-3 text-xs font-extrabold">{badge.progress}</p>
              </motion.div>
            ) : (
              <div key={badge.id} className="rounded-3xl border border-line bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <Award size={22} className="text-line" />
                </div>
                <p className="mt-3 font-black">{badge.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{badge.description}</p>
                <p className="mt-3 text-xs font-extrabold">{badge.progress}</p>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle
          title="Simulados"
          action={<Link href="/exames" className="inline-flex items-center gap-1 text-xs font-extrabold text-muted hover:text-ink">Ver simulados <ArrowRight size={13} /></Link>}
        />
        {examStats.length === 0 ? (
          <EmptyState
            title="Sem simulados para programação"
            description="Os pacotes de JavaScript e Python praticam com exercícios e projetos guiados. Os simulados de proficiência existem para inglês, espanhol (A1 e A2) e neerlandês, francês, alemão e italiano (A1)."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {examStats.map((stats) => {
              const history = examHistory.find((item) => item.exam.id === stats.examId)?.records ?? [];
              return (
                <div key={stats.examId} className="card flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-soft text-sun-deep"><GraduationCap size={22} /></span>
                      <div>
                        <p className="font-extrabold">Simulado {stats.level}</p>
                        <p className="text-[11px] text-muted">{stats.total} questões · com cronómetro · aprovação ≥ {exams.find((item) => item.id === stats.examId)?.passPercent}%</p>
                      </div>
                    </div>
                    {stats.attempts > 0 ? (
                      <Tag tone={stats.passed ? 'green' : 'sun'}>{stats.passed ? 'Aprovado' : 'Em treino'}</Tag>
                    ) : (
                      <Tag tone="sun">Por fazer</Tag>
                    )}
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <p className="text-4xl font-black">{stats.attempts > 0 ? stats.bestPercent : '—'}<span className="text-lg text-muted">%</span></p>
                    <p className="text-right text-xs leading-relaxed text-muted">
                      {stats.attempts > 0 ? (
                        <>melhor: <strong className="text-ink">{stats.bestCorrect}/{stats.total}</strong><br />{stats.attempts} {stats.attempts === 1 ? 'tentativa' : 'tentativas'} · {stats.xp} XP</>
                      ) : (
                        'Ainda sem tentativas'
                      )}
                    </p>
                  </div>
                  <div className="mt-2"><ProgressBar value={stats.bestCorrect} max={stats.total} color={stats.passed ? 'bg-success' : 'bg-sun'} label={`Melhor resultado do Simulado ${stats.level}`} /></div>

                  {history.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">Últimas tentativas</p>
                      <ul className="mt-2 divide-y divide-line rounded-2xl border border-line">
                        {history.map((record, index) => (
                          <li key={`${record.timestamp}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                            <span className="text-muted">{new Date(record.timestamp).toLocaleDateString('pt-PT')}</span>
                            <span className="font-bold">{record.correct}/{record.total} · {record.percent}%</span>
                            <span className="text-muted">{record.xp} XP</span>
                            <Tag tone={record.percent >= (passPercentByExam.get(stats.examId) ?? 60) ? 'green' : 'neutral'}>{record.percent >= (passPercentByExam.get(stats.examId) ?? 60) ? 'Aprovado' : 'Não aprovado'}</Tag>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link href="/exames" className="btn-ghost mt-4 w-full !py-2 text-xs">
                    {stats.attempts > 0 ? 'Repetir simulado' : 'Fazer simulado'} <ArrowRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-muted">Resultados indicativos: não são exames oficiais nem emitem certificados.</p>
      </section>

      <section className="mt-8">
        <SectionTitle title="Histórico de sessões" />
        {completions.length === 0 ? (
          <EmptyState title="Ainda sem sessões guardadas" description="As lições concluídas aparecem aqui com data, precisão e XP recebido." />
        ) : (
          <div className="card divide-y divide-line !p-0">
            {[...completions]
              .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
              .slice(0, 6)
              .map((completion) => (
                <div key={completion.lessonId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-extrabold">{getLesson(completion.lessonId)?.title ?? completion.lessonId}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(completion.completedAt).toLocaleDateString('pt-PT')} · {accuracyPercent(completion.correctCount, completion.totalExercises)}% de acerto · {completion.mistakes.length} {completion.mistakes.length === 1 ? 'erro' : 'erros'}
                    </p>
                  </div>
                  <Tag tone={completion.xpAwarded > 0 ? 'sun' : 'neutral'}>{completion.xpAwarded} XP</Tag>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle title="Erros mais repetidos" />
          {analytics.mistakes.length === 0 ? (
            <EmptyState title="Sem padrões de erro ainda" description="Quando repetires um erro, aparece aqui para poderes trabalhar essa estrutura." />
          ) : (
            <div className="card space-y-3">
              {analytics.mistakes.map((mistake) => (
                <div key={mistake.key} className="flex items-start justify-between gap-3 rounded-2xl bg-cream p-3">
                  <div><p className="text-xs text-muted">Lição: {mistake.prompt}</p><p className="mt-1 font-bold">{mistake.answer}</p></div>
                  <Tag tone="red">{mistake.count}×</Tag>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <SectionTitle title="O que estes números significam" />
          <div className="card space-y-3 text-sm leading-relaxed text-muted">
            <p className="flex gap-2"><Info size={17} className="mt-0.5 shrink-0 text-muted" /> A precisão inclui todas as respostas guardadas, incluindo revisões e tutor. A taxa de acerto de uma lição específica é mostrada no fim dela.</p>
            <p>As estatísticas medem <strong className="text-ink">prática</strong>, não um nível oficial. {language.kind === 'programming' ? 'Os rótulos de dificuldade indicam apenas a complexidade do código.' : 'Os rótulos A1, A2 e B1 indicam apenas a dificuldade do conteúdo das lições.'}</p>
            <p>Para uma avaliação certificada é necessário um exame externo; esta aplicação não emite certificados.</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl bg-cream p-3"><p className="text-xs text-muted">Respostas corretas</p><p className="text-lg font-black">{accuracyPercent(attempts.filter((item) => item.correct).length, attempts.length)}%</p></div>
              <div className="rounded-2xl bg-cream p-3"><p className="text-xs text-muted">Revisões feitas</p><p className="text-lg font-black">{reviewCount}</p></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
