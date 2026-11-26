import { describe, expect, it } from 'vitest';
import { findCorrections, offlineReply } from '../lib/tutor/offline';

describe('offline tutor', () => {
  it('detects common Portuguese-speaker errors', () => {
    expect(findCorrections('I am agree with you.')[0]?.corrected).toBe('I agree');
    expect(findCorrections('I have 25 years.')[0]?.corrected).toBe('I am 25 years old');
  });

  it('provides a scenario reply, translation and alternatives without any API', () => {
    const reply = offlineReply({
      scenarioId: 'order-food',
      personality: 'friendly',
      difficulty: 'beginner',
      userText: 'I would like a sandwich, please.',
      turn: 0,
    });
    expect(reply.text).toContain('Welcome');
    expect(reply.translation.length).toBeGreaterThan(0);
    expect(reply.alternatives.length).toBeGreaterThan(0);
  });
});
