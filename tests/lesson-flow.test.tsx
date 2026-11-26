// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppProvider, useApp } from '../components/AppContext';
import { LessonPlayer } from '../components/LessonPlayer';
import { deriveAnalytics } from '../lib/analytics';
import { getLesson } from '../lib/content';
import { correctAnswerOf } from '../lib/scoring';
import type { Exercise, Lesson } from '../lib/types';

type AppApi = ReturnType<typeof useApp>;

const lesson = getLesson('greetings') as Lesson;
let latest: AppApi | null = null;

function Probe({ currentLesson }: { currentLesson: Lesson }) {
  const app = useApp();
  useEffect(() => {
    latest = app;
  }, [app]);
  return app.ready ? <LessonPlayer lesson={currentLesson} /> : null;
}

function renderApp() {
  latest = null;
  return render(
    <AppProvider>
      <Probe currentLesson={lesson} />
    </AppProvider>,
  );
}

async function waitForReady() {
  await waitFor(() => expect(latest?.ready).toBe(true));
}

function clickByName(name: string | RegExp) {
  fireEvent.click(screen.getByRole('button', { name }));
}

async function answerExercise(exercise: Exercise, shouldBeCorrect: boolean) {
  if ('options' in exercise) {
    const correct = correctAnswerOf(exercise);
    const target = shouldBeCorrect ? correct : (exercise.options.find((option) => option !== correct) ?? correct);
    clickByName(target);
  } else if (exercise.type === 'translation' || exercise.type === 'sentence' || exercise.type === 'fill-blank') {
    const input = screen.getByLabelText('A tua resposta');
    fireEvent.change(input, {
      target: { value: shouldBeCorrect ? exercise.answers[0] : 'Resposta deliberadamente errada' },
    });
    clickByName('Verificar resposta');
  } else if (exercise.type === 'word-order') {
    const sequence = shouldBeCorrect ? exercise.answer.split(' ') : [...exercise.words].reverse();
    for (const token of sequence) {
      const candidates = screen
        .getAllByRole('button', { name: token })
        .filter((button) => !button.hasAttribute('disabled'));
      fireEvent.click(candidates[candidates.length - 1]);
    }
    clickByName('Verificar frase');
  } else if (exercise.type === 'matching') {
    for (const pair of exercise.pairs) {
      clickByName(pair.english);
      clickByName(shouldBeCorrect ? pair.portuguese : exercise.pairs.find((item) => item.english !== pair.english)!.portuguese);
    }
    clickByName('Verificar associações');
  }

  const explanation = await screen.findByText(exercise.explanation);
  expect(explanation).toBeTruthy();
  if (!shouldBeCorrect) {
    expect(screen.getByRole('button', { name: /Tentar novamente/ })).toBeTruthy();
  }
  if (exercise.type === 'listening') {
    expect(screen.getByText(/Transcrição:/)).toBeTruthy();
  }
  const advanceName = /Próximo exercício|Ver resultado/;
  await waitFor(() => expect(screen.getByRole('button', { name: advanceName })).toBeTruthy());
  clickByName(advanceName);
}

async function runLesson(wrongIndex: number | null) {
  fireEvent.click(screen.getByRole('button', { name: /Começar lição/ }));
  await waitFor(() => expect(screen.getByText('Exercício 1 de 7')).toBeTruthy());
  for (let index = 0; index < lesson.exercises.length; index += 1) {
    await answerExercise(lesson.exercises[index], index !== wrongIndex);
  }
  await screen.findByText('Muito bem!', {}, { timeout: 5000 });
}

afterEach(() => {
  cleanup();
});

describe('real lesson flow with persisted data', () => {
  it('scores answers, awards XP once, and restores data after a reload', async () => {
    const first = renderApp();
    await waitForReady();
    expect(latest?.completions).toHaveLength(0);

    await runLesson(1);

    await waitFor(() => expect(latest?.completions).toHaveLength(1));
    expect(latest?.completions[0].lessonId).toBe('greetings');
    expect(latest?.completions[0].correctCount).toBe(6);
    expect(latest?.completions[0].xpAwarded).toBe(19);
    expect(latest?.attempts).toHaveLength(7);
    expect(latest?.vocabulary).toHaveLength(lesson.vocabulary.length);
    expect(
      latest?.attempts.some((attempt) => attempt.correct === false && attempt.userAnswer === 'Resposta deliberadamente errada'),
    ).toBe(true);
    expect(screen.getByText(/19/)).toBeTruthy();

    // Simulate a full page reload: new provider instance reading the same IndexedDB database.
    first.unmount();
    renderApp();
    await waitForReady();
    await waitFor(() => expect(latest?.completions).toHaveLength(1));
    expect(latest?.attempts).toHaveLength(7);
    expect(latest?.vocabulary).toHaveLength(lesson.vocabulary.length);

    // Reopen the completed lesson: XP must stay unchanged.
    await runLesson(null);
    await waitFor(() => expect(screen.getByText(/não atribui XP duplicado/)).toBeTruthy());
    expect(latest?.completions).toHaveLength(1);
    expect(latest?.completions[0].xpAwarded).toBe(19);

    const analytics = deriveAnalytics(latest!.completions, latest!.attempts, latest!.vocabulary);
    expect(analytics.totalXp).toBe(19);
    expect(analytics.completedLessons).toBe(1);
    expect(analytics.totalAttempts).toBe(14);
    expect(analytics.accuracy).toBe(93);
    expect(analytics.streak).toBe(1);

    // Two simultaneous completion calls must not both award XP.
    const nextLesson = getLesson('numbers-time') as Lesson;
    const input = {
      lesson: nextLesson,
      correctCount: 6,
      totalExercises: 6,
      durationMs: 1000,
      mistakes: [],
    };
    const rewards = await Promise.all([
      latest!.completeLesson(input),
      latest!.completeLesson(input),
    ]);
    expect(rewards.filter((xp) => xp > 0)).toHaveLength(1);
    await waitFor(() => expect(latest!.completions).toHaveLength(2));
  }, 20_000);
});
