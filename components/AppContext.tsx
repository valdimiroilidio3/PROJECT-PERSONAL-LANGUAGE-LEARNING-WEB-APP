'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearStore, deleteRecord, describeStorageError, getAll, getStorageMode, putRecord, readKv, writeKv, type StorageMode } from '@/lib/db';
import { calculateLessonXp } from '@/lib/scoring';
import { vocabularyFromLesson } from '@/lib/vocabulary';
import type {
  AppSnapshot,
  Attempt,
  Lesson,
  LessonCompletion,
  LessonMistake,
  Profile,
  TutorSession,
  VocabularyItem,
} from '@/lib/types';

export const defaultProfile: Profile = {
  onboarded: false,
  nativeLanguage: 'pt',
  targetLanguage: 'en',
  level: 'beginner',
  goal: 'everyday',
  dailyGoalMinutes: 10,
  createdAt: new Date().toISOString(),
};

interface AppState {
  ready: boolean;
  profile: Profile;
  completions: LessonCompletion[];
  attempts: Attempt[];
  vocabulary: VocabularyItem[];
  sessions: TutorSession[];
  storageMode: StorageMode;
  error: string | null;
}

interface CompleteLessonInput {
  lesson: Lesson;
  correctCount: number;
  totalExercises: number;
  durationMs: number;
  mistakes: LessonMistake[];
}

interface AppActions {
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  completeLesson: (input: CompleteLessonInput) => Promise<number>;
  recordAttempt: (attempt: Omit<Attempt, 'id' | 'timestamp'>) => Promise<void>;
  addVocabulary: (item: VocabularyItem) => Promise<void>;
  updateVocabulary: (item: VocabularyItem) => Promise<void>;
  deleteVocabulary: (id: string) => Promise<void>;
  saveSession: (session: TutorSession) => Promise<void>;
  importSnapshot: (snapshot: AppSnapshot) => Promise<void>;
  resetAll: () => Promise<void>;
  dismissError: () => void;
}

type AppContextValue = AppState & AppActions;

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
  ready: false,
  profile: defaultProfile,
  completions: [],
  attempts: [],
  vocabulary: [],
  sessions: [],
  storageMode: 'indexeddb',
  error: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    let active = true;
    async function load() {
      const mode = await getStorageMode();
      try {
        const [profile, completions, attempts, vocabulary, sessions] = await Promise.all([
          readKv<Profile>('profile'),
          getAll<LessonCompletion>('completions'),
          getAll<Attempt>('attempts'),
          getAll<VocabularyItem>('vocabulary'),
          getAll<TutorSession>('sessions'),
        ]);
        if (!active) return;
        setState({
          ready: true,
          profile: profile ?? defaultProfile,
          completions,
          attempts: attempts.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
          vocabulary,
          sessions,
          storageMode: mode,
          error: mode === 'memory' ? 'O armazenamento local não está disponível. O progresso durará apenas esta sessão.' : null,
        });
      } catch (error) {
        if (!active) return;
        setState({
          ...initialState,
          ready: true,
          storageMode: mode,
          error: `Não foi possível ler os dados guardados: ${describeStorageError(error)}`,
        });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(async (operation: () => Promise<void>) => {
    try {
      await operation();
    } catch (error) {
      setState((previous) => ({ ...previous, error: `Não foi possível guardar: ${describeStorageError(error)}` }));
    }
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      const next = { ...state.profile, ...patch };
      await persist(() => writeKv('profile', next));
      setState((previous) => ({ ...previous, profile: next }));
    },
    [persist, state.profile],
  );

  const recordAttempt = useCallback(
    async (input: Omit<Attempt, 'id' | 'timestamp'>) => {
      const attempt: Attempt = {
        ...input,
        id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
      };
      await persist(() => putRecord('attempts', attempt));
      setState((previous) => ({ ...previous, attempts: [...previous.attempts, attempt] }));
    },
    [persist],
  );

  const completeLesson = useCallback(
    async ({ lesson, correctCount, totalExercises, durationMs, mistakes }: CompleteLessonInput) => {
      const alreadyCompleted = state.completions.some((item) => item.lessonId === lesson.id);
      if (alreadyCompleted) return 0;
      const xpAwarded = calculateLessonXp({
        totalExercises,
        correctCount,
        firstCompletion: true,
      });
      const completion: LessonCompletion = {
        lessonId: lesson.id,
        completedAt: new Date().toISOString(),
        correctCount,
        totalExercises,
        xpAwarded,
        durationMs,
        mistakes,
      };
      await persist(async () => {
        await putRecord('completions', completion);
        for (const item of vocabularyFromLesson(lesson)) await putRecord('vocabulary', item);
      });
      setState((previous) => ({
        ...previous,
        completions: [...previous.completions, completion],
        vocabulary: [
          ...previous.vocabulary,
          ...vocabularyFromLesson(lesson).filter((item) => !previous.vocabulary.some((existing) => existing.id === item.id)),
        ],
      }));
      return xpAwarded;
    },
    [persist, state.completions],
  );

  const addVocabulary = useCallback(
    async (item: VocabularyItem) => {
      await persist(() => putRecord('vocabulary', item));
      setState((previous) => ({
        ...previous,
        vocabulary: previous.vocabulary.some((existing) => existing.id === item.id)
          ? previous.vocabulary.map((existing) => (existing.id === item.id ? item : existing))
          : [...previous.vocabulary, item],
      }));
    },
    [persist],
  );

  const updateVocabulary = useCallback(
    async (item: VocabularyItem) => {
      await persist(() => putRecord('vocabulary', item));
      setState((previous) => ({
        ...previous,
        vocabulary: previous.vocabulary.map((existing) => (existing.id === item.id ? item : existing)),
      }));
    },
    [persist],
  );

  const deleteVocabulary = useCallback(
    async (id: string) => {
      await persist(() => deleteRecord('vocabulary', id));
      setState((previous) => ({ ...previous, vocabulary: previous.vocabulary.filter((item) => item.id !== id) }));
    },
    [persist],
  );

  const saveSession = useCallback(
    async (session: TutorSession) => {
      await persist(() => putRecord('sessions', session));
      setState((previous) => ({
        ...previous,
        sessions: previous.sessions.some((existing) => existing.id === session.id)
          ? previous.sessions.map((existing) => (existing.id === session.id ? session : existing))
          : [session, ...previous.sessions],
      }));
    },
    [persist],
  );

  const importSnapshot = useCallback(
    async (snapshot: AppSnapshot) => {
      await persist(async () => {
        for (const store of ['completions', 'attempts', 'vocabulary', 'sessions'] as const) await clearStore(store);
        await writeKv('profile', snapshot.profile);
        for (const item of snapshot.completions) await putRecord('completions', item);
        for (const item of snapshot.attempts) await putRecord('attempts', item);
        for (const item of snapshot.vocabulary) await putRecord('vocabulary', item);
        for (const item of snapshot.sessions) await putRecord('sessions', item);
      });
      setState((previous) => ({
        ...previous,
        profile: snapshot.profile,
        completions: snapshot.completions,
        attempts: snapshot.attempts,
        vocabulary: snapshot.vocabulary,
        sessions: snapshot.sessions,
      }));
    },
    [persist],
  );

  const resetAll = useCallback(async () => {
    await persist(async () => {
      for (const store of ['kv', 'completions', 'attempts', 'vocabulary', 'sessions'] as const) await clearStore(store);
      await writeKv('profile', defaultProfile);
    });
    setState((previous) => ({
      ...previous,
      profile: defaultProfile,
      completions: [],
      attempts: [],
      vocabulary: [],
      sessions: [],
    }));
  }, [persist]);

  const dismissError = useCallback(() => setState((previous) => ({ ...previous, error: null })), []);

  const value = useMemo<AppContextValue>(() => ({ ...state, updateProfile, completeLesson, recordAttempt, addVocabulary, updateVocabulary, deleteVocabulary, saveSession, importSnapshot, resetAll, dismissError }), [
    state,
    updateProfile,
    completeLesson,
    recordAttempt,
    addVocabulary,
    updateVocabulary,
    deleteVocabulary,
    saveSession,
    importSnapshot,
    resetAll,
    dismissError,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}


export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider.');
  return context;
}
