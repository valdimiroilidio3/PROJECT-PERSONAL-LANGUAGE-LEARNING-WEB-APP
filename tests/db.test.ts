import { describe, expect, it } from 'vitest';
import { getAll, getRecord, markMemoryMode, putRecord, readKv, replaceAll, writeKv } from '../lib/db';

describe('local persistence', () => {
  it('replaces every store in one operation', async () => {
    await writeKv('profile', { onboarded: true });
    await putRecord('completions', { lessonId: 'old', xpAwarded: 100 });

    await replaceAll({
      profile: { onboarded: false },
      completions: [{ lessonId: 'greetings', xpAwarded: 19 }],
      attempts: [{ id: 7, lessonId: 'greetings' }],
      vocabulary: [{ id: 'hello', english: 'hello' }],
      sessions: [{ id: 'chat-1', messages: [] }],
    });

    expect(await getRecord('completions', 'old')).toBeUndefined();
    expect(await getAll('completions')).toHaveLength(1);
    expect(await getAll('attempts')).toHaveLength(1);
    expect(await getAll('vocabulary')).toHaveLength(1);
    expect(await getAll('sessions')).toHaveLength(1);
    expect(await readKv<{ onboarded: boolean }>('profile')).toEqual({ onboarded: false });
  });

  it('keeps working in session-only memory when storage is marked unavailable', async () => {
    markMemoryMode();
    await putRecord('kv', { key: 'profile', value: { onboarded: true } });
    expect(await readKv<{ onboarded: boolean }>('profile')).toEqual({ onboarded: true });
  });
});
