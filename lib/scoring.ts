import type { Exercise } from './types';

/** Normalises learner input so that casing, accents and punctuation never cause a false negative. */
export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function answersEqual(value: string, accepted: string | string[]): boolean {
  const normalized = normalizeAnswer(value);
  if (!normalized) return false;
  const options = Array.isArray(accepted) ? accepted : [accepted];
  return options.some((option) => normalizeAnswer(option) === normalized);
}

export function correctAnswerOf(exercise: Exercise): string {
  switch (exercise.type) {
    case 'multiple-choice':
    case 'listening':
    case 'dialogue':
    case 'reading':
      return exercise.options[exercise.correctIndex] ?? '';
    case 'matching':
      return exercise.pairs.map((pair) => `${pair.term} = ${pair.translation}`).join('; ');
    case 'translation':
    case 'sentence':
    case 'fill-blank':
      return exercise.answers[0] ?? '';
    case 'word-order':
      return exercise.answer;
  }
}

export type SubmittedAnswer = string | Array<[string, string]>;

export function isExerciseCorrect(exercise: Exercise, answer: SubmittedAnswer): boolean {
  if (exercise.type === 'matching') {
    if (!Array.isArray(answer) || answer.length !== exercise.pairs.length) return false;
    const expected = new Map(exercise.pairs.map((pair) => [pair.term, pair.translation]));
    return answer.every(([term, translation]) => expected.get(term) === translation);
  }
  if (Array.isArray(answer) || typeof answer !== 'string') return false;

  switch (exercise.type) {
    case 'multiple-choice':
    case 'listening':
    case 'dialogue':
    case 'reading':
      return answersEqual(answer, exercise.options[exercise.correctIndex] ?? '');
    case 'translation':
    case 'sentence':
    case 'fill-blank':
      return answersEqual(answer, exercise.answers);
    case 'word-order':
      return answersEqual(answer, [exercise.answer, ...(exercise.alternatives ?? [])]);
  }
}

export interface XpInput {
  totalExercises: number;
  correctCount: number;
  firstCompletion: boolean;
}

/** XP is only granted once per lesson. Accuracy and a perfect run add small bonuses. */
export function calculateLessonXp({ totalExercises, correctCount, firstCompletion }: XpInput): number {
  if (!firstCompletion || totalExercises <= 0) return 0;
  const accuracy = Math.min(1, Math.max(0, correctCount / totalExercises));
  const perfectBonus = correctCount === totalExercises ? 5 : 0;
  return 10 + Math.round(accuracy * 10) + perfectBonus;
}

export function accuracyPercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}
