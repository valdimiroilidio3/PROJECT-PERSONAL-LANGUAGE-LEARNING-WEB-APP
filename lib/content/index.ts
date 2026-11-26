import type { DiagnosticQuestion, Exercise, LanguageId, Lesson, PracticeScenario } from '../types';
import { normalizeAnswer } from '../scoring';
import { a1Lessons } from './a1';
import { laterLessons } from './advanced';
import { esLessons } from './es';
import { nlLessons } from './nl';
import { frLessons } from './fr';
import { deLessons } from './de';
import { itLessons } from './it';
import { javascriptLessons } from './javascript';
import { pythonLessons } from './python';
import { scenarios as enScenarios } from './scenarios.en';
import { extraScenarios } from './scenarios.extra';

const packs: Record<LanguageId, Lesson[]> = {
  en: [...a1Lessons, ...laterLessons],
  es: esLessons,
  nl: nlLessons,
  fr: frLessons,
  de: deLessons,
  it: itLessons,
  javascript: javascriptLessons,
  python: pythonLessons,
};

export const lessons: Lesson[] = Object.values(packs).flat();
export const scenarios: PracticeScenario[] = [...enScenarios, ...extraScenarios];

/** Content is checked once at module load so a broken exercise cannot silently ship. */
export function validateLessons(items: Lesson[]): void {
  const lessonIds = new Set<string>();
  for (const lesson of items) {
    if (!lesson.id || lessonIds.has(lesson.id)) throw new Error(`Invalid or duplicate lesson id: ${lesson.id}`);
    lessonIds.add(lesson.id);
    if (!lesson.objective || !lesson.title || lesson.vocabulary.length < 4 || lesson.exercises.length < 6) {
      throw new Error(`Incomplete lesson: ${lesson.id}`);
    }
    const exerciseIds = new Set<string>();
    for (const exercise of lesson.exercises) {
      validateExercise(exercise, lesson.id);
      if (exerciseIds.has(exercise.id)) throw new Error(`Duplicate exercise ${exercise.id} in ${lesson.id}`);
      exerciseIds.add(exercise.id);
    }
  }
}

function validateExercise(exercise: Exercise, lessonId: string): void {
  const label = `${lessonId}/${exercise.id}`;
  if (!exercise.explanation.trim()) throw new Error(`Missing explanation in ${label}`);
  const assertAnswers = (answers: string[]) => {
    if (!answers.length || answers.some((answer) => !normalizeAnswer(answer))) {
      throw new Error(`Missing accepted answer in ${label}`);
    }
  };
  if ('options' in exercise) {
    if (exercise.options.length < 2 || exercise.correctIndex < 0 || exercise.correctIndex >= exercise.options.length) {
      throw new Error(`Invalid options in ${label}`);
    }
  }
  switch (exercise.type) {
    case 'translation':
    case 'sentence':
    case 'fill-blank':
      assertAnswers(exercise.answers);
      break;
    case 'word-order': {
      assertAnswers([exercise.answer]);
      const answerWords = normalizeAnswer(exercise.answer).split(' ');
      for (const word of exercise.words) {
        for (const token of normalizeAnswer(word).split(' ')) {
          if (!answerWords.includes(token)) throw new Error(`Word "${word}" is absent from the answer in ${label}`);
        }
      }
      break;
    }
    case 'matching':
      if (exercise.pairs.length < 3 || exercise.pairs.some((pair) => !pair.term || !pair.translation)) {
        throw new Error(`Invalid matching pairs in ${label}`);
      }
      break;
    default:
      break;
  }
}

validateLessons(lessons);

export function lessonsFor(languageId: LanguageId): Lesson[] {
  return packs[languageId] ?? packs.en;
}

export function getLesson(id: string, languageId?: LanguageId): Lesson | undefined {
  const pool = languageId ? lessonsFor(languageId) : lessons;
  return pool.find((lesson) => lesson.id === id);
}

export function scenariosFor(languageId: LanguageId): PracticeScenario[] {
  return scenarios.filter((scenario) => scenario.languageId === languageId);
}

export function getScenario(id: string, languageId?: LanguageId): PracticeScenario | undefined {
  const pool = languageId ? scenariosFor(languageId) : scenarios;
  return pool.find((scenario) => scenario.id === id);
}

/** Diagnostics are drawn from the pack's own exercises: no invented questions. */
export function diagnosticFor(languageId: LanguageId): DiagnosticQuestion[] {
  const first = lessonsFor(languageId)[0];
  if (!first) return [];
  return first.exercises
    .filter((exercise): exercise is Exercise & { options: string[]; correctIndex: number } => 'options' in exercise)
    .slice(0, 3)
    .map((exercise, index) => ({
      prompt: 'question' in exercise ? exercise.question : 'sentence' in exercise ? exercise.sentence : exercise.prompt,
      options: exercise.options,
      answerIndex: exercise.correctIndex,
      points: index + 1,
      hint: exercise.explanation,
    }));
}

/** Maps a indicative score onto a real lesson in the pack. */
export function lessonForScore(languageId: LanguageId, score: number): Lesson {
  const items = lessonsFor(languageId);
  const index = score <= 1 ? 0 : score <= 3 ? 1 : score <= 5 ? 2 : 3;
  return items[Math.min(index, items.length - 1)];
}
