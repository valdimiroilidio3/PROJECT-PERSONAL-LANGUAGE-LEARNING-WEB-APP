import type { LanguageId, Lesson, VocabularyItem, VocabularySeed } from './types';

export function vocabularyId(term: string, languageId: LanguageId = 'en'): string {
  return `${languageId}-${term}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
}

export function createVocabularyItem(
  seed: VocabularySeed,
  options: { source: 'lesson' | 'manual'; lessonId?: string; languageId?: LanguageId; now?: Date } = { source: 'manual' },
): VocabularyItem {
  const now = options.now ?? new Date();
  return {
    ...seed,
    id: vocabularyId(seed.term, options.languageId),
    familiarity: 0,
    lastReviewedAt: null,
    nextReviewAt: now.toISOString(),
    correctCount: 0,
    incorrectCount: 0,
    source: options.source,
    lessonId: options.lessonId,
    languageId: options.languageId,
    createdAt: now.toISOString(),
  };
}

export function vocabularyFromLesson(lesson: Lesson, now = new Date()): VocabularyItem[] {
  return lesson.vocabulary.map((seed) =>
    createVocabularyItem(seed, { source: 'lesson', lessonId: lesson.id, languageId: lesson.languageId, now }),
  );
}
