import { describe, expect, it } from 'vitest';
import { diagnosticFor, getLesson, lessonForScore, lessonsFor, scenariosFor, validateLessons } from '../lib/content';
import { getLanguage, languages, levelLabel } from '../lib/languages';
import type { LanguageId } from '../lib/types';

describe('language packs', () => {
  it('offers every advertised pack with real content', () => {
    expect(languages.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(languages.map((item) => item.id));
    expect(ids.size).toBe(languages.length);
    for (const language of languages) {
      expect(lessonsFor(language.id).length).toBeGreaterThanOrEqual(2);
      expect(scenariosFor(language.id).length).toBeGreaterThanOrEqual(1);
      expect(diagnosticFor(language.id).length).toBeGreaterThan(0);
      expect(lessonsFor(language.id).every((lesson) => lesson.languageId === language.id)).toBe(true);
    }
  });

  it('keeps all lesson and scenario ids globally unique', () => {
    const allLessons = languages.flatMap((item) => lessonsFor(item.id));
    const allScenarios = languages.flatMap((item) => scenariosFor(item.id));
    expect(() => validateLessons(allLessons)).not.toThrow();
    expect(new Set(allLessons.map((item) => item.id)).size).toBe(allLessons.length);
    expect(new Set(allScenarios.map((item) => item.id)).size).toBe(allScenarios.length);
  });

  it('does not invent CEFR levels for programming tracks', () => {
    const programming: LanguageId[] = ['javascript', 'python'];
    for (const id of programming) {
      for (const lesson of lessonsFor(id)) {
        expect(['L1', 'L2', 'L3']).toContain(lesson.level);
        expect(levelLabel(id, lesson.level)).not.toMatch(/CEFR/);
        expect(lesson.exercises.some((exercise) => exercise.type === 'listening')).toBe(false);
      }
    }
  });

  it('recommends a lesson that exists inside the chosen pack', () => {
    for (const language of languages) {
      const lesson = lessonForScore(language.id, 2);
      expect(lesson.languageId).toBe(language.id);
      expect(getLesson(lesson.id, language.id)?.id).toBe(lesson.id);
    }
  });

  it('falls back to English for unknown language metadata without creating content', () => {
    expect(getLanguage('unknown' as LanguageId).id).toBe('en');
    expect(lessonsFor('unknown' as LanguageId)).toBe(lessonsFor('en'));
  });
});
