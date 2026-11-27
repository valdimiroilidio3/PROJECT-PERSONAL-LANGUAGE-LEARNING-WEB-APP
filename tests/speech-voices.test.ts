import { describe, expect, it } from 'vitest';
import {
  VOICE_PERSONAS,
  langPrefix,
  pickVoice,
  rankVoices,
  scoreVoice,
  type VoiceDescriptor,
} from '../lib/speech';

const voice = (
  name: string,
  lang: string,
  voiceURI: string,
  localService = true,
  isDefault = false,
): VoiceDescriptor => ({ name, lang, voiceURI, localService, isDefault });

const pool = [
  voice('Google US English', 'en-US', 'google-us'),
  voice('Samantha', 'en-US', 'samantha', true, true),
  voice('Google português do Brasil', 'pt-BR', 'google-pt-br'),
  voice('Mónica', 'pt-PT', 'monica'),
  voice('eSpeak compact pt-PT', 'pt-PT', 'espeak-pt'),
  voice('Google español', 'es-ES', 'google-es'),
];

describe('voice ranking', () => {
  it('keeps only voices that match the requested language prefix', () => {
    const ranked = rankVoices(pool, 'pt-PT');
    expect(ranked.map((item) => item.voiceURI)).toEqual(['monica', 'espeak-pt', 'google-pt-br']);
  });

  it('prefers exact locale, local engines and full (non-compact) voices', () => {
    const ranked = rankVoices(pool, 'pt-PT');
    expect(ranked[0].voiceURI).toBe('monica');
    expect(scoreVoice(voice('eSpeak compact pt-PT', 'pt-PT', 'x'), 'pt-PT')).toBeLessThan(
      scoreVoice(voice('Mónica', 'pt-PT', 'y'), 'pt-PT'),
    );
  });

  it('ranks exact locale above plain prefix matches', () => {
    const ranked = rankVoices([voice('Paulina', 'es-MX', 'pau'), voice('Google español', 'es-ES', 'goo')], 'es-ES');
    expect(ranked[0].voiceURI).toBe('goo');
  });

  it('honours a stored preferred voice when it belongs to the language', () => {
    // Mesmo sendo a voz "pior" por pontuação, a escolha explícita do utilizador vence.
    expect(pickVoice(pool, 'pt-PT', 'espeak-pt')?.voiceURI).toBe('espeak-pt');
  });

  it('ignores a stored preference from a different language and falls back to ranking', () => {
    expect(pickVoice(pool, 'pt-PT', 'google-us')?.voiceURI).toBe('monica');
  });

  it('returns undefined when no voice fits the language', () => {
    expect(pickVoice(pool, 'fr-FR', null)).toBeUndefined();
  });

  it('derives language prefixes correctly', () => {
    expect(langPrefix('pt-PT')).toBe('pt');
    expect(langPrefix('en-US')).toBe('en');
    expect(langPrefix('nl')).toBe('nl');
  });
});

describe('voice personas', () => {
  it('offers unique personas with sane pitch and rate bounds', () => {
    const ids = VOICE_PERSONAS.map((persona) => persona.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('auto');
    for (const persona of VOICE_PERSONAS) {
      expect(persona.pitch).toBeGreaterThanOrEqual(0.5);
      expect(persona.pitch).toBeLessThanOrEqual(2);
      expect(persona.rate).toBeGreaterThanOrEqual(0.5);
      expect(persona.rate).toBeLessThanOrEqual(2);
      expect(persona.label.length).toBeGreaterThan(0);
      expect(persona.description.length).toBeGreaterThan(0);
    }
  });
});
