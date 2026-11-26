import type { AppSnapshot, Profile } from './types';

export function createSnapshot(data: Omit<AppSnapshot, 'version' | 'exportedAt'>): AppSnapshot {
  return { version: 1, exportedAt: new Date().toISOString(), ...data };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length < 5000;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validateProfile(value: unknown): Profile {
  if (!isObject(value)) throw new Error('Perfil inválido no ficheiro.');
  const levels = ['beginner', 'elementary', 'intermediate', 'advanced'];
  const goals = ['everyday', 'work', 'travel', 'study', 'fluency'];
  if (
    typeof value.onboarded !== 'boolean' ||
    value.nativeLanguage !== 'pt' ||
    value.targetLanguage !== 'en' ||
    !levels.includes(String(value.level)) ||
    !goals.includes(String(value.goal)) ||
    ![5, 10, 15, 20].includes(Number(value.dailyGoalMinutes)) ||
    (value.supportLocale !== undefined && !['pt-PT', 'pt-BR'].includes(String(value.supportLocale))) ||
    !isString(value.createdAt)
  ) {
    throw new Error('As preferências do ficheiro não são válidas.');
  }
  return value as unknown as Profile;
}

/** Validates a backup before any existing data is touched. */
export function parseSnapshot(raw: string): AppSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('O ficheiro não contém JSON válido.');
  }
  if (!isObject(parsed) || parsed.version !== 1 || !Array.isArray(parsed.completions) || !Array.isArray(parsed.attempts) || !Array.isArray(parsed.vocabulary) || !Array.isArray(parsed.sessions)) {
    throw new Error('Formato de backup desconhecido ou incompleto.');
  }
  if (!parsed.completions.every((item) =>
    isObject(item) && isString(item.lessonId) && isString(item.completedAt) &&
    isNumber(item.xpAwarded) && isNumber(item.correctCount) && isNumber(item.totalExercises) &&
    isNumber(item.durationMs) && Array.isArray(item.mistakes))) {
    throw new Error('Existem lições inválidas no ficheiro.');
  }
  if (!parsed.vocabulary.every((item) =>
    isObject(item) && isString(item.id) && isString(item.english) && isString(item.portuguese) &&
    isString(item.example) && isString(item.context) && isString(item.nextReviewAt) &&
    isNumber(item.familiarity) && isNumber(item.correctCount) && isNumber(item.incorrectCount))) {
    throw new Error('Existe vocabulário inválido no ficheiro.');
  }
  if (!parsed.attempts.every((item) =>
    isObject(item) && isString(item.lessonId) && isString(item.exerciseId) && isString(item.timestamp) &&
    typeof item.correct === 'boolean' && isNumber(item.durationMs) && isNumber(item.xpAwarded) &&
    ['lesson', 'practice', 'review', 'tutor'].includes(String(item.source)))) {
    throw new Error('Existem tentativas inválidas no ficheiro.');
  }
  if (!parsed.sessions.every((item) =>
    isObject(item) && isString(item.id) && isString(item.createdAt) && isString(item.updatedAt) &&
    Array.isArray(item.messages))) {
    throw new Error('Existem conversas inválidas no ficheiro.');
  }
  return {
    version: 1,
    exportedAt: isString(parsed.exportedAt) ? parsed.exportedAt : new Date().toISOString(),
    profile: validateProfile(parsed.profile),
    completions: parsed.completions as AppSnapshot['completions'],
    attempts: parsed.attempts as AppSnapshot['attempts'],
    vocabulary: parsed.vocabulary as AppSnapshot['vocabulary'],
    sessions: parsed.sessions as AppSnapshot['sessions'],
  };
}
