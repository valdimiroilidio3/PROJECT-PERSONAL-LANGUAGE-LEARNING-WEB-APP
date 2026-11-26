import { describe, expect, it } from 'vitest';
import { localizePortuguese } from '../lib/tutor/offline';
import { checkRateLimit, TUTOR_LIMITS, validateTutorRequest } from '../lib/tutor/validation';

const valid = {
  mode: 'ollama',
  scenarioId: 'everyday',
  personality: 'friendly',
  difficulty: 'beginner',
  supportLocale: 'pt-PT',
  messages: [{ role: 'user', content: 'Hello!' }],
};

describe('tutor request validation', () => {
  it('accepts a valid request', () => {
    const result = validateTutorRequest(valid, JSON.stringify(valid).length);
    expect(result.ok).toBe(true);
  });

  it('rejects invalid modes, scenarios and oversized messages', () => {
    expect(validateTutorRequest({ ...valid, mode: 'unknown' }, 100).ok).toBe(false);
    expect(validateTutorRequest({ ...valid, scenarioId: 'missing' }, 100).ok).toBe(false);
    const longMessage = { ...valid, messages: [{ role: 'user', content: 'x'.repeat(TUTOR_LIMITS.maxMessageChars + 1) }] };
    const tooLong = validateTutorRequest(longMessage, JSON.stringify(longMessage).length);
    expect(tooLong.ok ? 0 : tooLong.status).toBe(413);
  });

  it('limits request frequency per process', () => {
    let last: { allowed: boolean; retryAfterSeconds: number } = { allowed: true, retryAfterSeconds: 0 };
    for (let index = 0; index < TUTOR_LIMITS.requestsPerMinute; index += 1) {
      last = checkRateLimit('test-client', 1000);
    }
    expect(last.allowed).toBe(true);
    const blocked = checkRateLimit('test-client', 1001);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('adapts built-in translations to Brazilian Portuguese', () => {
    expect(localizePortuguese('Prazer em conhecer-te. Como foi o teu fim de semana?', 'pt-BR')).toBe(
      'Prazer em conhecer você. Como foi o seu fim de semana?',
    );
    expect(localizePortuguese('Prazer em conhecer-te', 'pt-PT')).toBe('Prazer em conhecer-te');
  });
});
