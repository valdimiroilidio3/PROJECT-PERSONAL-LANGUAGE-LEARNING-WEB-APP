import { describe, expect, it } from 'vitest';
import { isLessonUnlocked, recommendLesson } from '../lib/analytics';
import { lessons } from '../lib/content';
import type { Profile } from '../lib/types';

const profile: Profile = {
  onboarded: true,
  nativeLanguage: 'pt',
  targetLanguage: 'en',
  level: 'beginner',
  goal: 'everyday',
  dailyGoalMinutes: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('lesson progression', () => {
  it('never recommends a locked lesson from the diagnostic', () => {
    const recommended = recommendLesson(
      { ...profile, recommendedLessonId: 'past-experiences' },
      lessons,
      [],
    );
    expect(recommended.id).toBe('greetings');
    expect(isLessonUnlocked(recommended.id, lessons, [])).toBe(true);
  });

  it('follows completed prerequisites after the first lesson', () => {
    const completion = {
      lessonId: 'greetings',
      completedAt: '2026-01-01T00:00:00.000Z',
      correctCount: 7,
      totalExercises: 7,
      xpAwarded: 25,
      durationMs: 60_000,
      mistakes: [],
    };
    expect(recommendLesson(profile, lessons, [completion]).id).toBe('numbers-time');
    expect(isLessonUnlocked('numbers-time', lessons, [completion])).toBe(true);
    expect(isLessonUnlocked('family', lessons, [completion])).toBe(false);
  });
});
