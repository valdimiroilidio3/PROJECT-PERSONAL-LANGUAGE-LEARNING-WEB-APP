'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Flame,
  GraduationCap,
  Home,
  MessageCircle,
  Route,
  Settings,
  Sparkles,
  Trophy,
  Volume2,
  X,
} from 'lucide-react';
import { buildEvents, calculateStreak } from '@/lib/analytics';
import { deriveLeague } from '@/lib/gamification';
import { languages } from '@/lib/languages';
import type { LanguageId } from '@/lib/types';
import { useApp } from './AppContext';
import { Mascot } from './Mascot';

const navigation = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/learn', label: 'Aprender', icon: Route },
  { href: '/practice', label: 'Praticar', icon: Volume2 },
  { href: '/tutor', label: 'Tutor', icon: MessageCircle },
  { href: '/vocabulary', label: 'Vocabulário', icon: BookOpen },
  { href: '/review', label: 'Revisão', icon: Sparkles },
  { href: '/exames', label: 'Simulados', icon: GraduationCap },
  { href: '/progress', label: 'Progresso', icon: BarChart3 },
  { href: '/settings', label: 'Definições', icon: Settings },
];

const bottomNavigation = [navigation[0], navigation[1], navigation[2], navigation[3], navigation[7]];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, profile, completions, attempts, error, dismissError, updateProfile } = useApp();
  const xp = completions.reduce((sum, item) => sum + item.xpAwarded, 0)
    + attempts.filter((item) => item.source === 'practice' || item.source === 'review').reduce((sum, item) => sum + item.xpAwarded, 0);
  const streakDays = calculateStreak(buildEvents(completions, attempts));
  const league = deriveLeague(xp);

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white px-5 py-7 lg:flex">
        <Link href="/" className="mb-9 flex items-center gap-3 rounded-2xl px-2">
          <Mascot className="h-12 w-12" mood="wink" />
          <div>
            <p className="text-xl font-black leading-none tracking-tight">Lumio</p>
            <p className="mt-1 text-[11px] font-bold text-muted">Inglês, um passo de cada vez</p>
          </div>
        </Link>
        <label className="mb-5 block">
          <span className="label">A aprender</span>
          <select
            className="input mt-1 !py-2 text-sm"
            aria-label="Língua de aprendizagem"
            value={profile.targetLanguage}
            onChange={(event) => void updateProfile({ targetLanguage: event.target.value as LanguageId, recommendedLessonId: undefined })}
          >
            {languages.map((item) => <option key={item.id} value={item.id}>{item.emblem} {item.label}</option>)}
          </select>
        </label>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Navegação principal">
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active ? 'bg-sun text-ink' : 'text-muted hover:bg-cream hover:text-ink'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={19} strokeWidth={2.2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-3xl bg-cream p-4 text-xs text-muted">
          <p className="font-extrabold text-ink">Os teus dados ficam contigo</p>
          <p className="mt-1 leading-relaxed">Guardados neste browser. Podes exportar uma cópia nas definições.</p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-cream/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Mascot className="h-9 w-9" mood="wink" />
          <span className="text-lg font-black tracking-tight">Lumio</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-extrabold">
          <motion.span
            className="pill bg-white text-muted"
            title={`${streakDays} dias consecutivos`}
            animate={streakDays > 0 ? { scale: [1, 1.22, 1] } : { scale: 1 }}
            transition={streakDays > 0 ? { repeat: Infinity, duration: 1.9, ease: 'easeInOut' } : undefined}
          >
            <Flame size={13} className="text-danger" /> {streakDays}
          </motion.span>
          <span className="pill bg-white" title={`Liga ${league.name}`}>{league.emblem}</span>
          <span className="pill bg-sun"><Trophy size={13} /> {xp} XP</span>
          <Link href="/settings" className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white" aria-label="Definições">
            <Settings size={16} />
          </Link>
        </div>
      </header>
      <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-2 lg:hidden">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">A aprender</span>
        <select
          className="min-w-0 flex-1 rounded-xl border border-line bg-cream px-3 py-1.5 text-sm font-extrabold"
          aria-label="Língua de aprendizagem"
          value={profile.targetLanguage}
          onChange={(event) => void updateProfile({ targetLanguage: event.target.value as LanguageId, recommendedLessonId: undefined })}
        >
          {languages.map((item) => <option key={item.id} value={item.id}>{item.emblem} {item.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-ink lg:mx-8" role="status">
          <p className="flex-1">{error}</p>
          <button type="button" onClick={dismissError} aria-label="Fechar aviso"><X size={16} /></button>
        </div>
      )}

      {!ready ? (
        <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
          <div className="text-center">
            <Mascot className="mx-auto h-24 w-24 animate-pulse" />
            <p className="mt-3 text-sm font-bold text-muted">A preparar o teu espaço…</p>
          </div>
        </div>
      ) : (
        <>
          {!profile.onboarded && pathname !== '/onboarding' && (
            <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sun-soft px-4 py-3 text-sm lg:mx-8">
              <p className="font-semibold">Ainda não configuraste o teu perfil. Leva menos de 2 minutos.</p>
              <Link href="/onboarding" className="btn-primary !py-2">Configurar agora</Link>
            </div>
          )}
          <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-10">{children}</main>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Navegação inferior">
        {bottomNavigation.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold ${active ? 'text-ink' : 'text-muted'}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className={`flex h-8 w-10 items-center justify-center rounded-full ${active ? 'bg-sun' : ''}`}>
                <Icon size={19} strokeWidth={2.2} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
