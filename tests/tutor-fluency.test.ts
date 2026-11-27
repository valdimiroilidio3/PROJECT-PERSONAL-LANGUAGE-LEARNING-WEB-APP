import { describe, expect, it } from 'vitest';
import { analyzeFluency, difficultyHint } from '../lib/tutor/fluency';
import { characterFor, characterIds } from '../lib/tutor/characters';
import { scenarioOpening } from '../lib/tutor/offline';
import { languages } from '../lib/languages';
import { scenariosFor } from '../lib/content';
import type { TutorMessage } from '../lib/types';

const tutorMessage = (overrides: Partial<TutorMessage> = {}): TutorMessage => ({
  id: `m-${Math.random()}`,
  role: 'tutor',
  text: 'Hello!',
  timestamp: new Date().toISOString(),
  scenarioId: 'everyday',
  provider: 'offline',
  ...overrides,
});

const userMessage = (text: string, corrections = 0): TutorMessage =>
  tutorMessage({
    role: 'user',
    text,
    corrections: Array.from({ length: corrections }, () => ({ original: 'a', corrected: 'b', explanation: 'c' })),
  });

describe('fluency analysis', () => {
  it('counts words, fillers and unique ratio from the learner text only', () => {
    const report = analyzeFluency(['I I really like uh reading and you know reading']);
    expect(report.words).toBe(10);
    expect(report.fillers).toBe(2); // uh + you know
    expect(report.repeatedWords).toBe(1); // "I I"
    expect(report.uniqueRatio).toBeCloseTo(0.8, 2);
  });

  it('computes sentence length from real sentence boundaries', () => {
    const report = analyzeFluency(['I am from Portugal. I work in Porto! Do you like it?']);
    expect(report.longestSentence).toBe(4);
    expect(report.avgSentenceLength).toBeCloseTo(4, 1);
  });

  it('returns zeros and no suggestions for empty input', () => {
    const report = analyzeFluency(['   ', '']);
    expect(report.words).toBe(0);
    expect(report.suggestions).toEqual([]);
  });

  it('flags filler overuse only when measurable', () => {
    const withFillers = analyzeFluency(['uh um uh you know like uh um']);
    expect(withFillers.fillers).toBeGreaterThanOrEqual(6);
    expect(withFillers.suggestions.join(' ')).toMatch(/muletas/i);
    const clean = analyzeFluency(['I like reading books at home with my family on Sundays']);
    expect(clean.fillers).toBe(0);
  });
});

describe('difficulty hint', () => {
  it('stays neutral below four user messages', () => {
    const messages = [userMessage('Hello there'), userMessage('I am good'), userMessage('Nice')];
    expect(difficultyHint(messages)).toBeNull();
  });

  it('suggests stepping up with clean, structured sentences', () => {
    const messages = [
      'I am from Portugal and I like reading books',
      'My favourite food is fish with salad and rice',
      'On weekends I usually walk with my dog',
      'I work in an office near the city centre',
    ].map((text) => userMessage(text, 0));
    expect(difficultyHint(messages)).toBe('up');
  });

  it('suggests consolidating when corrections pile up', () => {
    const messages = [
      userMessage('I am agree', 1),
      userMessage('I no have car', 1),
      userMessage('I go to London yesterday', 1),
      userMessage('can you to help me', 1),
    ];
    expect(difficultyHint(messages)).toBe('down');
  });
});

describe('characters', () => {
  it('covers every scenario of every language pack with a real character', () => {
    for (const language of languages) {
      for (const scenario of scenariosFor(language.id)) {
        const character = characterFor(scenario.id);
        expect(character.name.length, `character for ${scenario.id}`).toBeGreaterThan(0);
        expect(character.role.length).toBeGreaterThan(0);
        expect(character.backstory.length).toBeGreaterThan(0);
      }
    }
  });

  it('falls back to a generic partner for unknown scenarios', () => {
    expect(characterFor('nao-existe').name).toBe('Alex');
  });

  it('has no duplicate character ids', () => {
    const ids = characterIds();
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('scenario opening', () => {
  it('produces a non-empty opening line and translation for every pack scenario', () => {
    for (const language of languages) {
      for (const scenario of scenariosFor(language.id)) {
        const opening = scenarioOpening(scenario.id, 'pt-PT');
        expect(opening.text.length, `opening for ${scenario.id}`).toBeGreaterThan(0);
        expect(opening.translation.length).toBeGreaterThan(0);
        expect(opening.corrections).toEqual([]);
      }
    }
  });
});
