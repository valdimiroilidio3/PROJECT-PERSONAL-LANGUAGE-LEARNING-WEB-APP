'use client';

import { Award, BarChart3, Clock3, Info, Trophy } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { EmptyState, PageHeader, ProgressBar, SectionTitle, StatTile, Tag } from '@/components/ui';
import { deriveAchievements, deriveAnalytics } from '@/lib/analytics';
import { accuracyPercent } from '@/lib/scoring';
import { getLesson } from '@/lib/content';

export default function ProgressPage() {
  const { language, completions, attempts, vocabulary, sessions } = useApp();
  const analytics = deriveAnalytics(completions, attempts, vocabulary);
  const reviewCount = attempts.filter((item) => item.source === 'review').length;
  const achievements = deriveAchievements(analytics, reviewCount, sessions.length);
  const maxXp = Math.max(1, ...analytics.week.map((day) => day.xp));

  return (
    <div>
      <PageHeader
        eyebrow="Estatísticas reais"
        title={`O teu progresso em ${language.label.toLowerCase()}`}
        description="Tudo o que vês aqui vem das tuas lições, respostas e revisões guardadas neste browser."
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
                  <div className="flex-1"><ProgressBar value={day.xp} max={maxXp} /></div>
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
                  <ProgressBar value={category.correct} max={category.total} color={category.accuracy >= 80 ? 'bg-success' : category.accuracy >= 50 ? 'bg-sun' : 'bg-danger'} />
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
          {achievements.map((badge) => (
            <div key={badge.id} className={`rounded-3xl border p-5 ${badge.earned ? 'border-sun bg-sun-soft' : 'border-line bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <Award size={22} className={badge.earned ? 'text-sun-deep' : 'text-line'} />
                {badge.earned && <Tag tone="green">Conquistada</Tag>}
              </div>
              <p className="mt-3 font-black">{badge.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{badge.description}</p>
              <p className="mt-3 text-xs font-extrabold">{badge.progress}</p>
            </div>
          ))}
        </div>
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
