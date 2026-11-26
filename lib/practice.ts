import { normalizeAnswer } from './scoring';

/** Scenario answers are checked for meaning-bearing keywords, never as phonetic scoring. */
export function evaluateScenarioAnswer(answer: string, keywords: string[] | string[][]): boolean {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return false;
  const groups: string[][] = keywords.length > 0 && typeof keywords[0] === 'string' ? [keywords as string[]] : (keywords as string[][]);
  return groups.every((group) => group.some((keyword) => normalized.includes(normalizeAnswer(keyword))));
}

export function scenarioXp(correctCount: number, total: number): number {
  if (total <= 0) return 0;
  return 4 + Math.round((correctCount / total) * 8);
}
