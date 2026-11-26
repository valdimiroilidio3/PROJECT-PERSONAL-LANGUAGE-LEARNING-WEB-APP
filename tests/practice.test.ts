import { describe, expect, it } from 'vitest';
import { evaluateScenarioAnswer, scenarioXp } from '../lib/practice';

describe('scenario practice', () => {
  it('recognises answers that contain the expected ideas', () => {
    expect(evaluateScenarioAnswer('Hi, my name is Ana!', [['hello', 'hi', 'name']])).toBe(true);
    expect(evaluateScenarioAnswer('I like bread', [['where', 'station']])).toBe(false);
    expect(evaluateScenarioAnswer('', [['hi']])).toBe(false);
  });

  it('awards XP proportionally and never for an empty session', () => {
    expect(scenarioXp(3, 3)).toBe(12);
    expect(scenarioXp(0, 3)).toBe(4);
    expect(scenarioXp(3, 0)).toBe(0);
  });
});
