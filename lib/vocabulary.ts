import type { Lesson, VocabularyItem, VocabularySeed } from './types';

export function vocabularyId(english: string): string {
  return english
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function createVocabularyItem(
  seed: VocabularySeed,
  options: { source: 'lesson' | 'manual'; lessonId?: string; now?: Date } = { source: 'manual' },
): VocabularyItem {
  const now = options.now ?? new Date();
  return {
    ...seed,
    id: vocabularyId(seed.english),
    familiarity: 0,
    lastReviewedAt: null,
    nextReviewAt: now.toISOString(),
    correctCount: 0,
    incorrectCount: 0,
    source: options.source,
    lessonId: options.lessonId,
    createdAt: now.toISOString(),
  };
}

export function vocabularyFromLesson(lesson: Lesson, now = new Date()): VocabularyItem[] {
  return lesson.vocabulary.map((seed) =>
    createVocabularyItem(seed, { source: 'lesson', lessonId: lesson.id, now }),
  );
}
