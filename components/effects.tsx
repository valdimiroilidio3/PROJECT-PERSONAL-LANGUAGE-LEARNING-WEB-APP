'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { animate, motion, useReducedMotion } from 'framer-motion';

const CONFETTI_COLORS = ['#FFE500', '#3FA66B', '#E46B5A', '#8FBFE8', '#C9B8E8', '#20201D'];

interface ConfettiPiece {
  id: number;
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
  drift: number;
  round: boolean;
  dx: number;
  dy: number;
}

function makePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, id) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 110;
    return {
      id,
      left: 8 + Math.random() * 84,
      size: 6 + Math.random() * 8,
      color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
      delay: Math.random() * 0.3,
      duration: 1.5 + Math.random() * 0.9,
      rotate: Math.random() * 720 - 360,
      drift: (Math.random() - 0.5) * 130,
      round: Math.random() < 0.35,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 30,
    };
  });
}

/**
 * Confete 100% local. `rain` cai do topo (para o ecrã de resultados);
 * `burst` rebenta a partir do centro (para o feedback de resposta certa).
 * Respeita prefers-reduced-motion.
 */
export function Confetti({ mode = 'rain', count, className = '' }: { mode?: 'rain' | 'burst'; count?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const pieces = useMemo(() => makePieces(count ?? (mode === 'rain' ? 56 : 26)), [count, mode]);
  if (reduceMotion) return null;

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {mode === 'rain'
        ? pieces.map((piece) => (
            <motion.span
              key={piece.id}
              className="absolute top-0 block"
              style={{
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.round ? piece.size : piece.size * 0.55,
                backgroundColor: piece.color,
                borderRadius: piece.round ? '50%' : 2,
              }}
              initial={{ y: -32, x: 0, opacity: 1, rotate: 0 }}
              animate={{ y: '60vh', x: piece.drift, opacity: [1, 1, 0.9, 0], rotate: piece.rotate }}
              transition={{ duration: piece.duration, delay: piece.delay, ease: [0.2, 0.6, 0.45, 1] }}
            />
          ))
        : pieces.map((piece) => (
            <motion.span
              key={piece.id}
              className="absolute left-1/2 top-16 block"
              style={{
                width: piece.size,
                height: piece.round ? piece.size : piece.size * 0.55,
                backgroundColor: piece.color,
                borderRadius: piece.round ? '50%' : 2,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
              animate={{ x: piece.dx, y: piece.dy + 90, opacity: 0, scale: 0.6, rotate: piece.rotate }}
              transition={{ duration: 0.9 + Math.random() * 0.45, delay: piece.delay * 0.4, ease: 'easeOut' }}
            />
          ))}
    </div>
  );
}

/** Número que conta até ao valor real — nunca mostra um número inventado. */
export function CountUp({ value, duration = 1.1, className }: { value: number; duration?: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  return <span className={className}>{display}</span>;
}

/** Animação de "pop" para elementos que entram com energia (troféu, corações, emblemas). */
export function popIn(delay = 0) {
  return {
    initial: { scale: 0.4, opacity: 0, rotate: -8 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    transition: { type: 'spring' as const, stiffness: 320, damping: 16, delay },
  };
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

/** Entrada suave em cascata para listas e grelhas — respeita prefers-reduced-motion. */
export function Stagger({ className = '', children }: { className?: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className={className}>
      {children}
    </motion.div>
  );
}

/** Filho de {@link Stagger} que entra com fade + deslize. */
export function StaggerItem({ className = '', children }: { className?: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/** Envolve uma secção para entrar com fade + deslize — respeita prefers-reduced-motion. */
export function FadeUp({ delay = 0, className = '', children }: { delay?: number; className?: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease: 'easeOut' }} className={className}>
      {children}
    </motion.div>
  );
}
