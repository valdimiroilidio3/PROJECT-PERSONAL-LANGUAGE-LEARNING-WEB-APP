// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppProvider, useApp } from '../components/AppContext';
import { getLesson } from '../lib/content';
import type { AppSnapshot, Lesson } from '../lib/types';

type AppApi = ReturnType<typeof useApp>;
let latest: AppApi | null = null;

function Probe() {
  const app = useApp();
  useEffect(() => {
    latest = app;
  }, [app]);
  return null;
}

function renderApp() {
  latest = null;
  return render(<AppProvider><Probe /></AppProvider>);
}

function completionInput(lesson: Lesson) {
  return {
    lesson,
    correctCount: lesson.exercises.length,
    totalExercises: lesson.exercises.length,
    durationMs: 60_000,
    mistakes: [],
  };
}

afterEach(() => cleanup());

describe('language-scoped progress', () => {
  it('keeps each pack separate while preserving a single backup', async () => {
    renderApp();
    await waitFor(() => expect(latest?.ready).toBe(true));

    const en = getLesson('greetings', 'en')!;
    const es = getLesson('es-saludos', 'es')!;
    const js = getLesson('js-variaveis', 'javascript')!;

    await act(async () => {
      await latest!.completeLesson(completionInput(en));
    });
    expect(latest!.completions.map((item) => item.lessonId)).toEqual(['greetings']);
    expect(latest!.allCompletions).toHaveLength(1);

    await act(async () => {
      await latest!.updateProfile({ targetLanguage: 'es' });
    });
    expect(latest!.completions).toHaveLength(0);
    await act(async () => {
      await latest!.completeLesson(completionInput(es));
    });
    expect(latest!.completions.map((item) => item.lessonId)).toEqual(['es-saludos']);
    expect(latest!.allCompletions).toHaveLength(2);

    await act(async () => {
      await latest!.updateProfile({ targetLanguage: 'javascript' });
    });
    expect(latest!.completions).toHaveLength(0);
    await act(async () => {
      await latest!.completeLesson(completionInput(js));
    });
    expect(latest!.completions[0].languageId).toBe('javascript');
    expect(latest!.language.kind).toBe('programming');
    expect(latest!.allCompletions).toHaveLength(3);

    await act(async () => {
      await latest!.recordAttempt({
        lessonId: 'js-variaveis',
        exerciseId: 'js-variaveis-e1',
        exerciseType: 'multiple-choice',
        category: 'Sintaxe',
        correct: true,
        userAnswer: 'const',
        correctAnswer: 'const',
        durationMs: 1000,
        xpAwarded: 0,
        source: 'lesson',
      });
    });
    expect(latest!.attempts[0].languageId).toBe('javascript');

    const snapshot: AppSnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: latest!.profile,
      completions: latest!.allCompletions,
      attempts: latest!.allAttempts,
      vocabulary: latest!.allVocabulary,
      sessions: latest!.allSessions,
    };
    expect(snapshot.completions).toHaveLength(3);
    expect(new Set(snapshot.completions.map((item) => item.languageId))).toEqual(
      new Set(['en', 'es', 'javascript']),
    );
  }, 15_000);
});
