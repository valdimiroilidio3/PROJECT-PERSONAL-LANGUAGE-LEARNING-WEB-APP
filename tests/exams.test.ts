import { describe, expect, it } from 'vitest';
import { EXAMS, examAttemptHistory, examAttemptStats, examFor, examsFor, parseExamScore, scoreExam } from '../lib/exams';
import type { LanguageId } from '../lib/types';

const naturalPacks: LanguageId[] = ['en', 'es', 'nl', 'fr', 'de', 'it'];

describe('simulados de proficiência', () => {
  it('existe um simulado A1 por língua natural, com 10 questões e 3 secções', () => {
    for (const id of naturalPacks) {
      const exam = examFor(id);
      expect(exam, id).toBeTruthy();
      expect(exam?.level).toBe('A1');
      expect(exam?.questions.length).toBe(10);
      const sections = new Map<string, number>();
      for (const question of exam?.questions ?? []) {
        sections.set(question.section, (sections.get(question.section) ?? 0) + 1);
      }
      expect(sections.get('reading')).toBe(4);
      expect(sections.get('listening')).toBe(3);
      expect(sections.get('vocabulary')).toBe(3);
    }
  });

  it('inglês e espanhol têm também simulado A2 com 15 questões em 15 min', () => {
    expect(EXAMS.length).toBe(naturalPacks.length + 2);
    for (const id of ['en', 'es'] as LanguageId[]) {
      const exam = examFor(id, 'A2');
      expect(exam, `${id} A2`).toBeTruthy();
      expect(exam?.level).toBe('A2');
      expect(exam?.durationMinutes).toBe(15);
      expect(exam?.passPercent).toBe(60);
      expect(exam?.questions.length).toBe(15);
      const sections = new Map<string, number>();
      for (const question of exam?.questions ?? []) {
        sections.set(question.section, (sections.get(question.section) ?? 0) + 1);
      }
      expect(sections.get('reading')).toBe(6);
      expect(sections.get('listening')).toBe(5);
      expect(sections.get('vocabulary')).toBe(4);
    }
    expect(examsFor('en').map((item) => item.level)).toEqual(['A1', 'A2']);
    expect(examsFor('es').map((item) => item.level)).toEqual(['A1', 'A2']);
    for (const id of ['nl', 'fr', 'de', 'it'] as LanguageId[]) {
      expect(examsFor(id).map((item) => item.level)).toEqual(['A1']);
      expect(examFor(id, 'A2')).toBeUndefined();
    }
    expect(examsFor('javascript')).toEqual([]);
    expect(examsFor('python')).toEqual([]);
  });

  it('cada questão tem 2+ opções, correctIndex válido, explicação e ids únicos', () => {
    for (const exam of EXAMS) {
      const ids = new Set<string>();
      for (const question of exam.questions) {
        expect(ids.has(question.id), `${exam.id}/${question.id} duplicada`).toBe(false);
        ids.add(question.id);
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(question.options.length);
        expect(question.explanation.trim().length).toBeGreaterThan(0);
        if (question.section === 'listening') expect(question.audioText?.trim().length).toBeGreaterThan(0);
        if (question.section === 'reading') expect(question.passage?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('scoreExam: tudo certo → 100%, aprovado, 20 XP (10 acertos + 10 bónus)', () => {
    const exam = EXAMS[0];
    const answers = Object.fromEntries(exam.questions.map((question) => [question.id, question.correctIndex]));
    const score = scoreExam(exam, answers);
    expect(score.correct).toBe(10);
    expect(score.percent).toBe(100);
    expect(score.passed).toBe(true);
    expect(score.xp).toBe(20);
    expect(score.perSection.reading.percent).toBe(100);
    expect(score.perSection.listening.percent).toBe(100);
    expect(score.perSection.vocabulary.percent).toBe(100);
  });

  it('scoreExam: abaixo de 60% reprova e não dá bónus', () => {
    const exam = EXAMS[0];
    const answers = Object.fromEntries(
      exam.questions.map((question, index) => [question.id, index < 5 ? question.correctIndex : (question.correctIndex + 1) % question.options.length]),
    );
    const score = scoreExam(exam, answers);
    expect(score.correct).toBe(5);
    expect(score.percent).toBe(50);
    expect(score.passed).toBe(false);
    expect(score.xp).toBe(5);
  });

  it('scoreExam: respostas em branco contam como erradas', () => {
    const exam = EXAMS[0];
    const score = scoreExam(exam, {});
    expect(score.correct).toBe(0);
    expect(score.percent).toBe(0);
    expect(score.passed).toBe(false);
    expect(score.xp).toBe(0);
  });

  it('scoreExam A2: 9 de 15 (60%) aprova no patamar; tudo certo vale 25 XP', () => {
    const exam = examFor('en', 'A2');
    expect(exam).toBeTruthy();
    if (!exam) return;
    const passing = Object.fromEntries(
      exam.questions.map((question, index) => [question.id, index < 9 ? question.correctIndex : (question.correctIndex + 1) % question.options.length]),
    );
    const scorePass = scoreExam(exam, passing);
    expect(scorePass.percent).toBe(60);
    expect(scorePass.passed).toBe(true);
    expect(scorePass.xp).toBe(19);
    const perfect = Object.fromEntries(exam.questions.map((question) => [question.id, question.correctIndex]));
    const scorePerfect = scoreExam(exam, perfect);
    expect(scorePerfect.percent).toBe(100);
    expect(scorePerfect.xp).toBe(25);
  });

  it('scoreExam: 6 de 10 (60%) aprova exatamente no patamar', () => {
    const exam = EXAMS[0];
    const answers = Object.fromEntries(
      exam.questions.map((question, index) => [question.id, index < 6 ? question.correctIndex : (question.correctIndex + 1) % question.options.length]),
    );
    const score = scoreExam(exam, answers);
    expect(score.percent).toBe(60);
    expect(score.passed).toBe(true);
    expect(score.xp).toBe(16);
  });

  it('pacotes de programação não têm simulado (null de examFor)', () => {
    expect(examFor('javascript')).toBeUndefined();
    expect(examFor('python')).toBeUndefined();
  });

  it('parseExamScore: lê "N/M" e rejeita formatos estranhos', () => {
    expect(parseExamScore('7/10')).toEqual({ correct: 7, total: 10 });
    expect(parseExamScore('10/10')).toEqual({ correct: 10, total: 10 });
    expect(parseExamScore('n/a')).toBeNull();
    expect(parseExamScore('7')).toBeNull();
    expect(parseExamScore(undefined)).toBeNull();
    expect(parseExamScore('')).toBeNull();
  });
it('examAttemptStats: tentativas, melhor resultado, XP, patamar e última data', () => {
    const exam = EXAMS[0];
    const attempts = [
      { exerciseId: `${exam.id}-complete`, userAnswer: '7/10', xpAwarded: 17, timestamp: '2026-11-20T10:00:00.000Z' },
      { exerciseId: `${exam.id}-complete`, userAnswer: '9/10', xpAwarded: 19, timestamp: '2026-11-22T10:00:00.000Z' },
      { exerciseId: `${exam.id}-complete`, userAnswer: 'formato estranho', xpAwarded: 0, timestamp: '2026-11-23T10:00:00.000Z' },
      { exerciseId: `${exam.id}-q1`, userAnswer: 'qualquer coisa', xpAwarded: 0, timestamp: '2026-11-23T11:00:00.000Z' },
    ];
    const stats = examAttemptStats(exam, attempts);
    expect(stats.attempts).toBe(3);
    expect(stats.bestCorrect).toBe(9);
    expect(stats.bestPercent).toBe(90);
    expect(stats.passed).toBe(true);
    expect(stats.xp).toBe(36);
    expect(stats.lastAttemptAt).toBe('2026-11-23T10:00:00.000Z');

    const empty = examAttemptStats(exam, []);
    expect(empty.attempts).toBe(0);
    expect(empty.bestCorrect).toBe(0);
    expect(empty.bestPercent).toBe(0);
    expect(empty.passed).toBe(false);
    expect(empty.xp).toBe(0);
    expect(empty.lastAttemptAt).toBeUndefined();

    const failing = examAttemptStats(exam, [
      { exerciseId: `${exam.id}-complete`, userAnswer: '5/10', xpAwarded: 5, timestamp: '2026-11-25T10:00:00.000Z' },
    ]);
    expect(failing.passed).toBe(false);
    expect(failing.bestPercent).toBe(50);
  });
it('examAttemptHistory: mais recentes primeiro, ignora formatos estranhos e respeita o limite', () => {
    const exam = EXAMS[0];
    const attempts = [
      { exerciseId: `${exam.id}-complete`, userAnswer: '5/10', xpAwarded: 5, timestamp: '2026-11-20T10:00:00.000Z' },
      { exerciseId: `${exam.id}-complete`, userAnswer: '9/10', xpAwarded: 19, timestamp: '2026-11-25T10:00:00.000Z' },
      { exerciseId: `${exam.id}-complete`, userAnswer: 'estranho', xpAwarded: 0, timestamp: '2026-11-26T10:00:00.000Z' },
      { exerciseId: `${exam.id}-complete`, userAnswer: '6/10', xpAwarded: 6, timestamp: '2026-11-22T10:00:00.000Z' },
      { exerciseId: `${exam.id}-q3`, userAnswer: 'ignorado', xpAwarded: 0, timestamp: '2026-11-27T10:00:00.000Z' },
    ];
    const history = examAttemptHistory(exam, attempts, 2);
    expect(history.length).toBe(2);
    expect(history[0].timestamp).toBe('2026-11-25T10:00:00.000Z');
    expect(history[0].percent).toBe(90);
    expect(history[0].correct).toBe(9);
    expect(history[1].timestamp).toBe('2026-11-22T10:00:00.000Z');
    expect(history[1].percent).toBe(60);
    const all = examAttemptHistory(exam, attempts, 10);
    expect(all.length).toBe(3);
    expect(all.map((record) => record.timestamp)).toEqual(['2026-11-25T10:00:00.000Z', '2026-11-22T10:00:00.000Z', '2026-11-20T10:00:00.000Z']);
  });
});
