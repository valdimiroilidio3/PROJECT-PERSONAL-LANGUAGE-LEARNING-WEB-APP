/**
 * Métricas locais de fluência a partir do texto que o aluno escreveu ou ditou.
 * Medimos apenas o que é mensurável sem inventar regras:
 * palavras, variedade, muletas, tamanho das frases e repetições.
 * Isto NÃO avalia fala, pronúncia nem sotaque — a transcrição vem do browser.
 */
import type { TutorMessage } from '../types';

export interface FluencyReport {
  /** Número total de palavras escritas/ditadas pelo aluno. */
  words: number;
  /** Proporção de palavras únicas (0–1). Mede variedade, não qualidade. */
  uniqueRatio: number;
  /** Contagem de muletas comuns em português e inglês (uh, um, like, tipo, então, …). */
  fillers: number;
  /** Comprimento médio das frases do aluno, em palavras. */
  avgSentenceLength: number;
  /** Comprimento da frase mais longa, em palavras. */
  longestSentence: number;
  /** Repetições da mesma palavra seguidas (ex.: "I I think"). */
  repeatedWords: number;
  /** Sugestões curtas e acionáveis, derivadas apenas destes números. */
  suggestions: string[];
}

// Conjunto de alta precisão: exclui usos legítimos como "tipo de…" e não conta "like" (verbo comum).
const FILLER_WORDS = /\b(uh|um|erm|hmm|you know|tipo(?!\s+de)|então|ou\s+seja)\b/gi;

function tokensOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function sentencesOf(text: string): string[] {
  return text
    .split(/[.!?…\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function analyzeFluency(userTexts: string[]): FluencyReport {
  const combined = userTexts.join(' ');
  const tokens = tokensOf(combined);
  const words = tokens.length;
  if (words === 0) {
    return { words: 0, uniqueRatio: 0, fillers: 0, avgSentenceLength: 0, longestSentence: 0, repeatedWords: 0, suggestions: [] };
  }

  const unique = new Set(tokens).size;
  const uniqueRatio = unique / words;
  const fillers = (combined.match(FILLER_WORDS) ?? []).length;

  const sentenceLengths = sentencesOf(combined).map((sentence) => tokensOf(sentence).length);
  const longestSentence = sentenceLengths.reduce((max, length) => Math.max(max, length), 0);
  const avgSentenceLength = sentenceLengths.length > 0
    ? Math.round((sentenceLengths.reduce((sum, length) => sum + length, 0) / sentenceLengths.length) * 10) / 10
    : 0;

  let repeatedWords = 0;
  for (let index = 1; index < tokens.length; index += 1) {
    if (tokens[index] === tokens[index - 1]) repeatedWords += 1;
  }

  const suggestions: string[] = [];
  if (fillers >= 4) suggestions.push('Muitas muletas (uh, um, tipo…). Faz pequenas pausas silenciosas em vez de preencher o espaço.');
  if (uniqueRatio < 0.4 && words >= 25) suggestions.push('Pouca variedade de vocabulário — tenta sinónimos e estruturas diferentes.');
  if (avgSentenceLength > 0 && avgSentenceLength < 4 && words >= 20) suggestions.push('Frases muito curtas — liga duas ideias com “and”, “but” ou “because”.');
  if (longestSentence > 28) suggestions.push('Uma frase muito longa — divide-a em duas para ganhar clareza.');
  if (repeatedWords >= 2) suggestions.push('Repetição da mesma palavra seguida — pausa e reformula.');
  if (suggestions.length === 0 && words >= 15) suggestions.push('Texto claro e variado. Mantém este ritmo.');

  return { words, uniqueRatio: Math.round(uniqueRatio * 100) / 100, fillers, avgSentenceLength, longestSentence, repeatedWords, suggestions };
}

export type DifficultyHint = 'up' | 'down' | null;

/**
 * Sugere subir/descer a dificuldade com regras transparentes,
 * apenas a partir de correções e tamanho de frase guardados nesta sessão.
 */
export function difficultyHint(messages: TutorMessage[]): DifficultyHint {
  const userMessages = messages.filter((item) => item.role === 'user');
  if (userMessages.length < 4) return null;
  const corrections = messages.reduce((sum, item) => sum + (item.corrections?.length ?? 0), 0);
  const report = analyzeFluency(userMessages.map((item) => item.text));

  if (corrections >= Math.max(2, Math.ceil(userMessages.length / 2))) return 'down';
  if (corrections === 0 && report.avgSentenceLength >= 6 && report.uniqueRatio >= 0.45) return 'up';
  return null;
}
