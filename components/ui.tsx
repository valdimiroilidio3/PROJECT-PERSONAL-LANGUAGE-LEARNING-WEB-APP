'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-muted">{eyebrow}</p>}
        <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-black tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

export function StatTile({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="h-full rounded-3xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function ProgressBar({ value, max, color = 'bg-sun' }: { value: number; max: number; color?: string }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div
        className={`progress-fill h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  href,
  linkLabel,
  illustration,
}: {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
  /** Ilustração original (gerada localmente) mostrada acima do texto. */
  illustration?: { src: string; alt: string };
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white/60 p-8 text-center">
      {illustration && (
        <div className="mx-auto mb-5 max-w-xs overflow-hidden rounded-2xl border border-line bg-cream shadow-card">
          <Image src={illustration.src} alt={illustration.alt} width={640} height={400} className="h-36 w-full object-cover object-center sm:h-44" />
        </div>
      )}
      <h3 className="text-base font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {href && linkLabel && (
        <Link href={href} className="btn-primary mt-5">
          {linkLabel} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'sun' | 'green' | 'red' }) {
  const tones = {
    neutral: 'bg-cream text-muted',
    sun: 'bg-sun text-ink',
    green: 'bg-success-soft text-success',
    red: 'bg-danger-soft text-danger',
  };
  return <span className={`pill ${tones[tone]}`}>{children}</span>;
}
