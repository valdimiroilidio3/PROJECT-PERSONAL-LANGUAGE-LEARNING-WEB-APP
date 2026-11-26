import type {
  LanguageId,
  LessonLevel,
  Exercise,
  MatchingPair,
  VocabularySeed,
} from '../types';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** Exercises are authored as small factories; ids and categories are injected by createLesson. */
export type ExerciseDraft = (id: string) => DistributiveOmit<Exercise, 'id' | 'category'>;

export interface LessonMeta {
  id: string;
  title: string;
  subtitle: string;
  objective: string;
  level: LessonLevel;
  category: string;
  minutes: number;
  xp: number;
  vocabulary: VocabularySeed[];
}

export function createLesson(meta: LessonMeta, drafts: ExerciseDraft[], languageId: LanguageId = 'en') {
  const exercises = drafts.map((draft, index) => ({
    ...draft(`${meta.id}-e${index + 1}`),
    id: `${meta.id}-e${index + 1}`,
    category: meta.category,
  })) as Exercise[];
  return { ...meta, languageId, exercises };
}

export function v(term: string, translation: string, example: string, context: string): VocabularySeed {
  return { term, translation, example, context };
}

export function mc(question: string, options: string[], correctIndex: number, explanation: string, translation?: string): ExerciseDraft;
export function mc(prompt: string, question: string, options: string[], correctIndex: number, explanation: string, translation?: string): ExerciseDraft;
export function mc(
  first: string,
  second: string | string[],
  third: string[] | number,
  fourth: number | string,
  fifth?: string,
  sixth?: string,
): ExerciseDraft {
  const hasPrompt = typeof second === 'string';
  const prompt = hasPrompt ? first : 'Escolha a resposta correta.';
  const question = hasPrompt ? second : first;
  const options = hasPrompt ? (third as string[]) : second;
  const correctIndex = hasPrompt ? (fourth as number) : (third as number);
  const explanation = hasPrompt ? (fifth ?? '') : (fourth as string);
  const translation = hasPrompt ? sixth : fifth;
  return () => ({
    type: 'multiple-choice',
    prompt,
    question,
    options,
    correctIndex,
    explanation,
    translation,
  });
}

export function translate(prompt: string, answers: string[], explanation: string): ExerciseDraft {
  return () => ({ type: 'translation', prompt, answers, explanation });
}

export function word(words: string[], answer: string, explanation: string, alternatives?: string[]): ExerciseDraft {
  return () => ({
    type: 'word-order',
    prompt: 'Coloque as palavras na ordem correta.',
    words,
    answer,
    alternatives,
    explanation,
  });
}

export function match(pairs: MatchingPair[], explanation: string): ExerciseDraft {
  return () => ({
    type: 'matching',
    prompt: 'Associe cada termo à sua explicação.',
    pairs,
    explanation,
  });
}

export function fill(sentence: string, answers: string[], explanation: string, translation?: string): ExerciseDraft {
  return () => ({
    type: 'fill-blank',
    prompt: 'Complete a frase com a palavra correta.',
    sentence,
    answers,
    explanation,
    translation,
  });
}

export function listen(audioText: string, question: string, options: string[], correctIndex: number, explanation: string): ExerciseDraft {
  return () => ({
    type: 'listening',
    prompt: 'Ouça e escolha a resposta correta.',
    audioText,
    question,
    options,
    correctIndex,
    explanation,
  });
}

export function dialogue(lines: string[], options: string[], correctIndex: number, explanation: string): ExerciseDraft {
  const blankIndex = Math.max(0, lines.findIndex((line) => line.includes('____')));
  return () => ({
    type: 'dialogue',
    prompt: 'Complete a conversa.',
    lines,
    blankIndex,
    options,
    correctIndex,
    explanation,
  });
}

export function sentence(prompt: string, hint: string, answers: string[], explanation: string): ExerciseDraft {
  return () => ({ type: 'sentence', prompt, hint, answers, explanation });
}

export function read(passage: string, question: string, options: string[], correctIndex: number, explanation: string): ExerciseDraft {
  return () => ({
    type: 'reading',
    prompt: 'Leia o texto e responda.',
    passage,
    question,
    options,
    correctIndex,
    explanation,
  });
}
