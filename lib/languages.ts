import type { LanguageId, LessonLevel } from './types';

export interface LanguageMeta {
  id: LanguageId;
  label: string;
  emblem: string;
  locale: string;
  kind: 'natural' | 'programming';
  /** Speech synthesis/recognition only makes sense for spoken languages. */
  speech: boolean;
  termLabel: string;
  translationLabel: string;
  levels: Record<LessonLevel, string>;
  description: string;
}

const naturalLevels: Record<LessonLevel, string> = {
  A1: 'A1 · Base',
  A2: 'A2 · Elementar',
  B1: 'B1 · Intermédio',
  L1: 'Iniciação',
  L2: 'Intermédio',
  L3: 'Avançado',
};

const codeLevels: Record<LessonLevel, string> = {
  A1: 'Iniciação',
  A2: 'Elementar',
  B1: 'Intermédio',
  L1: 'Iniciação',
  L2: 'Intermédio',
  L3: 'Avançado',
};

export const languages: LanguageMeta[] = [
  {
    id: 'en',
    label: 'Inglês',
    emblem: '🇬🇧',
    locale: 'en-GB',
    kind: 'natural',
    speech: true,
    termLabel: 'Inglês',
    translationLabel: 'Português',
    levels: naturalLevels,
    description: 'Lições completas, de A1 a B1, com conversação e escuta.',
  },
  {
    id: 'es',
    label: 'Espanhol',
    emblem: '🇪🇸',
    locale: 'es-ES',
    kind: 'natural',
    speech: true,
    termLabel: 'Espanhol',
    translationLabel: 'Português',
    levels: naturalLevels,
    description: 'Começa a falar espanhol com situações do dia a dia.',
  },
  {
    id: 'nl',
    label: 'Holandês',
    emblem: '🇳🇱',
    locale: 'nl-NL',
    kind: 'natural',
    speech: true,
    termLabel: 'Holandês',
    translationLabel: 'Português',
    levels: naturalLevels,
    description: 'Frases curtas e vocabulário útil para os Países Baixos.',
  },
  {
    id: 'fr',
    label: 'Francês',
    emblem: '🇫🇷',
    locale: 'fr-FR',
    kind: 'natural',
    speech: true,
    termLabel: 'Francês',
    translationLabel: 'Português',
    levels: naturalLevels,
    description: 'Saudações, números e primeiras conversas em francês.',
  },
  {
    id: 'de',
    label: 'Alemão',
    emblem: '🇩🇪',
    locale: 'de-DE',
    kind: 'natural',
    speech: true,
    termLabel: 'Alemão',
    translationLabel: 'Português',
    levels: naturalLevels,
    description: 'Estruturas simples e vocabulário essencial em alemão.',
  },
  {
    id: 'it',
    label: 'Italiano',
    emblem: '🇮🇹',
    locale: 'it-IT',
    kind: 'natural',
    speech: true,
    termLabel: 'Italiano',
    translationLabel: 'Português',
    levels: naturalLevels,
    description: 'Primeiros passos em italiano com exemplos práticos.',
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    emblem: 'JS',
    locale: 'en-US',
    kind: 'programming',
    speech: false,
    termLabel: 'Código',
    translationLabel: 'Explicação',
    levels: codeLevels,
    description: 'Sintaxe, variáveis e funções com exercícios de código.',
  },
  {
    id: 'python',
    label: 'Python',
    emblem: 'PY',
    locale: 'en-US',
    kind: 'programming',
    speech: false,
    termLabel: 'Código',
    translationLabel: 'Explicação',
    levels: codeLevels,
    description: 'Variáveis, condições e funções em Python, passo a passo.',
  },
];

const languageMap = new Map(languages.map((item) => [item.id, item]));

export function getLanguage(id: LanguageId): LanguageMeta {
  return languageMap.get(id) ?? languages[0];
}

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === 'string' && languageMap.has(value as LanguageId);
}

export function levelLabel(id: LanguageId, level: LessonLevel): string {
  return getLanguage(id).levels[level] ?? level;
}

export function languageEmblem(id: LanguageId): string {
  return getLanguage(id).emblem;
}
