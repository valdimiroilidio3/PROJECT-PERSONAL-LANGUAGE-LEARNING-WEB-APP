import { getScenario } from '@/lib/content/scenarios';
import type { LearnerLevel } from '@/lib/types';
import type { Personality, TutorMode } from './offline';

export const TUTOR_LIMITS = {
  maxBodyChars: 16_000,
  maxMessageChars: 2_000,
  maxMessages: 16,
  requestsPerMinute: 12,
} as const;

export type SupportLocale = 'pt-PT' | 'pt-BR';

export interface ValidTutorRequest {
  mode: Exclude<TutorMode, 'offline'>;
  scenarioId: string;
  personality: Personality;
  difficulty: LearnerLevel;
  supportLocale: SupportLocale;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

type ValidationResult = { ok: true; value: ValidTutorRequest } | { ok: false; status: number; error: string };

const modes = ['ollama', 'openai-compatible'] as const;
const personalities = ['friendly', 'patient', 'formal'] as const;
const levels: LearnerLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced'];
const locales: SupportLocale[] = ['pt-PT', 'pt-BR'];

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export function validateTutorRequest(raw: unknown, bodyChars: number): ValidationResult {
  if (typeof raw !== 'object' || raw === null) return { ok: false, status: 400, error: 'Pedido inválido.' };
  const body = raw as Record<string, unknown>;
  if (bodyChars > TUTOR_LIMITS.maxBodyChars) {
    return { ok: false, status: 413, error: 'O pedido é demasiado grande. Envie mensagens mais curtas.' };
  }
  if (!oneOf(body.mode, modes)) return { ok: false, status: 400, error: 'Modo de tutor desconhecido.' };
  if (typeof body.scenarioId !== 'string' || !getScenario(body.scenarioId)) {
    return { ok: false, status: 400, error: 'Cenário desconhecido.' };
  }
  if (!oneOf(body.personality, personalities)) return { ok: false, status: 400, error: 'Personalidade inválida.' };
  if (!oneOf(body.difficulty, levels)) return { ok: false, status: 400, error: 'Dificuldade inválida.' };
  if (!oneOf(body.supportLocale, locales)) return { ok: false, status: 400, error: 'Idioma de apoio inválido.' };
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return { ok: false, status: 400, error: 'Falta o histórico da conversa.' };
  }
  if (body.messages.length > TUTOR_LIMITS.maxMessages) {
    return { ok: false, status: 400, error: 'Demasiadas mensagens no histórico.' };
  }

  const messages: ValidTutorRequest['messages'] = [];
  for (const item of body.messages) {
    if (typeof item !== 'object' || item === null) return { ok: false, status: 400, error: 'Mensagem inválida.' };
    const message = item as Record<string, unknown>;
    if (message.role !== 'user' && message.role !== 'assistant') {
      return { ok: false, status: 400, error: 'Função de mensagem inválida.' };
    }
    if (typeof message.content !== 'string' || !message.content.trim()) {
      return { ok: false, status: 400, error: 'Mensagem vazia.' };
    }
    if (message.content.length > TUTOR_LIMITS.maxMessageChars) {
      return { ok: false, status: 413, error: 'Uma mensagem ultrapassa o tamanho permitido.' };
    }
    messages.push({ role: message.role, content: message.content.trim() });
  }

  return {
    ok: true,
    value: {
      mode: body.mode,
      scenarioId: body.scenarioId,
      personality: body.personality,
      difficulty: body.difficulty,
      supportLocale: body.supportLocale,
      messages,
    },
  };
}

/** Per-process limit; serverless platforms may run several instances. */
const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
  const windowMs = 60_000;
  const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= TUTOR_LIMITS.requestsPerMinute) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}
