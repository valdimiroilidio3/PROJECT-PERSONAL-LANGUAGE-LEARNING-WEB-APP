import type { Exercise, Lesson } from '../types';
import { normalizeAnswer } from '../scoring';
import { a1Lessons } from './a1';
import { laterLessons } from './advanced';

export const lessons: Lesson[] = [...a1Lessons, ...laterLessons];

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
      if (exercise.pairs.length < 3 || exercise.pairs.some((pair) => !pair.english || !pair.portuguese)) {
        throw new Error(`Invalid matching pairs in ${label}`);
      }
      break;
    default:
      break;
  }
}

validateLessons(lessons);

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}
