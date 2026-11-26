import { describe, expect, it } from 'vitest';
import { createSnapshot, parseSnapshot } from '../lib/backup';
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

describe('backup validation', () => {
  it('round-trips a valid snapshot', () => {
    const snapshot = createSnapshot({ profile, completions: [], attempts: [], vocabulary: [], sessions: [] });
    expect(parseSnapshot(JSON.stringify(snapshot)).profile.level).toBe('beginner');
  });

  it('rejects unknown formats and broken records before import', () => {
    expect(() => parseSnapshot('{not json')).toThrow(/JSON/);
    expect(() => parseSnapshot(JSON.stringify({ version: 2 }))).toThrow(/Formato/);
    const snapshot = createSnapshot({ profile, completions: [], attempts: [], vocabulary: [], sessions: [] });
    expect(() => parseSnapshot(JSON.stringify({ ...snapshot, vocabulary: [{ id: 'x' }] }))).toThrow(/vocabulário/);
    expect(() => parseSnapshot(JSON.stringify({ ...snapshot, profile: { ...profile, level: 'wizard' } }))).toThrow(/preferências/);
    expect(() => parseSnapshot(JSON.stringify({ ...snapshot, profile: { ...profile, supportLocale: 'pt-XX' } }))).toThrow(/preferências/);
  });
});
