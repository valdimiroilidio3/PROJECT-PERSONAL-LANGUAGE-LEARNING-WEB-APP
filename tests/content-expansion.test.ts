import { describe, expect, it } from 'vitest';
import { getLesson, lessonsFor, scenariosFor } from '../lib/content';
import { characterFor } from '../lib/tutor/characters';
import { scenarioOpening } from '../lib/tutor/offline';
import { languages } from '../lib/languages';
import type { LanguageId } from '../lib/types';

const packs: LanguageId[] = ['en', 'es', 'nl', 'fr', 'de', 'it', 'javascript', 'python'];

describe('catálogo de conteúdo por pacote', () => {
  it('cada pacote tem pelo menos 3 lições', () => {
    for (const id of packs) {
      expect(lessonsFor(id).length, `pacote ${id}`).toBeGreaterThanOrEqual(3);
    }
    expect(lessonsFor('en').length).toBe(16);
  });

  it('cada pacote tem pelo menos 2 cenários de prática', () => {
    for (const id of packs) {
      expect(scenariosFor(id).length, `pacote ${id}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('os novos cenários têm palavras-chave e modelos com o mesmo comprimento dos prompts', () => {
    const newScenarioIds = ['es-cafe', 'nl-winkel', 'fr-restaurant', 'de-bahnhof', 'it-mercato', 'js-arrays', 'py-ciclos'];
    for (const id of newScenarioIds) {
      const all = packs.flatMap((pack) => scenariosFor(pack));
      const scenario = all.find((item) => item.id === id);
      expect(scenario, `cenário ${id}`).toBeTruthy();
      if (!scenario) continue;
      expect(scenario.keywords.length).toBe(scenario.prompts.length);
      expect(scenario.modelAnswers.length).toBe(scenario.prompts.length);
      expect(scenario.translations.length).toBe(scenario.prompts.length);
      expect(scenario.hints.length).toBe(scenario.prompts.length);
    }
  });

  it('cada cenário novo tem personagem e abertura do tutor em personagem', () => {
    const newScenarioIds = ['es-cafe', 'nl-winkel', 'fr-restaurant', 'de-bahnhof', 'it-mercato', 'js-arrays', 'py-ciclos'];
    for (const id of newScenarioIds) {
      const character = characterFor(id);
      expect(character.name.length).toBeGreaterThan(0);
      expect(character.backstory.length).toBeGreaterThan(0);
      const opening = scenarioOpening(id, 'pt-PT');
      expect(opening.text.length).toBeGreaterThan(0);
      expect(opening.translation.length).toBeGreaterThan(0);
      expect(opening.corrections).toEqual([]);
    }
  });

  it('as novas lições existem no pacote certo e têm o mesmo id em lessonsFor', () => {
    const expected: Record<string, string> = {
      'es-familia': 'es',
      'nl-winkelen': 'nl',
      'fr-restaurant': 'fr',
      'de-einkauf': 'de',
      'it-ristorante': 'it',
      'js-arrays': 'javascript',
      'py-ciclos': 'python',
    };
    for (const [lessonId, languageId] of Object.entries(expected)) {
      expect(getLesson(lessonId, languageId as LanguageId)?.languageId, lessonId).toBe(languageId);
    }
  });

  it('cada língua continua resolúvel pelo LanguageId declarado', () => {
    for (const language of languages) {
      expect(lessonsFor(language.id).length, language.id).toBeGreaterThanOrEqual(3);
    }
  });
});
