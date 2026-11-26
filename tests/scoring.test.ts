import { describe, expect, it } from 'vitest';
import { accuracyPercent, answersEqual, correctAnswerOf, isExerciseCorrect, normalizeAnswer } from '../lib/scoring';
import type { Exercise } from '../lib/types';

describe('answer scoring', () => {
  it('normalises accents, case and punctuation', () => {
    expect(normalizeAnswer('  Ô ô, how are you?  ')).toBe('o o how are you');
    expect(answersEqual('My name is Ana!', ['My name is Ana', "I'm Ana"])).toBe(true);
  });

  it('accepts multiple correct translations', () => {
    const exercise = { type: 'translation', answers: ['I am fine, thank you', "I'm fine, thanks"] } as Exercise;
    expect(isExerciseCorrect(exercise, "I'm fine, thanks")).toBe(true);
    expect(isExerciseCorrect(exercise, 'I am good')).toBe(false);
  });

  it('checks multiple choice against the configured index', () => {
    const exercise = { type: 'multiple-choice', options: ['left', 'right', 'straight'], correctIndex: 1 } as Exercise;
    expect(isExerciseCorrect(exercise, 'Right')).toBe(true);
    expect(isExerciseCorrect(exercise, 'left')).toBe(false);
    expect(correctAnswerOf(exercise)).toBe('right');
  });

  it('requires every matching pair to be correct', () => {
    const exercise = {
      type: 'matching',
      pairs: [
        { term: 'hello', translation: 'olá' },
        { term: 'bread', translation: 'pão' },
      ],
    } as Exercise;
    expect(isExerciseCorrect(exercise, [['hello', 'olá'], ['bread', 'pão']])).toBe(true);
    expect(isExerciseCorrect(exercise, [['hello', 'olá'], ['bread', 'queijo']])).toBe(false);
    expect(isExerciseCorrect(exercise, [['hello', 'olá']])).toBe(false);
  });

  it('accepts alternatives for word ordering', () => {
    const exercise = { type: 'word-order', words: ['My', 'name', 'is', 'Ana'], answer: 'My name is Ana', alternatives: ['My name is Anna'] } as Exercise;
    expect(isExerciseCorrect(exercise, 'my name is ana')).toBe(true);
    expect(isExerciseCorrect(exercise, 'My name is Anna')).toBe(true);
  });

  it('calculates accuracy safely with zero attempts', () => {
    expect(accuracyPercent(3, 4)).toBe(75);
    expect(accuracyPercent(0, 0)).toBe(0);
  });
});
