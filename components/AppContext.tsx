'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  deleteRecord,
  describeStorageError,
  getAll,
  getRecord,
  getStorageMode,
  markMemoryMode,
  putRecord,
  readKv,
  replaceAll,
  writeKv,
  type StorageMode,
} from '@/lib/db';
import { getLanguage } from '@/lib/languages';
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
  supportLocale: 'pt-PT',
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

interface AppContextExtras {
  language: ReturnType<typeof getLanguage>;
  allCompletions: LessonCompletion[];
  allAttempts: Attempt[];
  allVocabulary: VocabularyItem[];
  allSessions: TutorSession[];
}

type AppContextValue = AppState & AppActions & AppContextExtras;

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

function uniqueBy<T>(items: T[], keyOf: (item: T) => string | number): T[] {
  const seen = new Map<string | number, T>();
  for (const item of items) seen.set(keyOf(item), item);
  return [...seen.values()];
}

/** Imported backups may contain repeated ids; normalise before replacing local data. */
function normalizeSnapshot(snapshot: AppSnapshot): AppSnapshot {
  const withLanguage = <T extends { languageId?: string }>(items: T[]): T[] =>
    items.map((item) => ({ ...item, languageId: item.languageId ?? 'en' }));
  const attempts = withLanguage(snapshot.attempts).map((attempt, index) => ({
    ...attempt,
    id: typeof attempt.id === 'number' && Number.isFinite(attempt.id) ? attempt.id : index + 1,
  })) as Attempt[];
  return {
    ...snapshot,
    completions: uniqueBy(withLanguage(snapshot.completions), (item) => item.lessonId),
    attempts: uniqueBy(attempts, (item) => item.id as number),
    vocabulary: uniqueBy(withLanguage(snapshot.vocabulary), (item) => item.id),
    sessions: uniqueBy(withLanguage(snapshot.sessions), (item) => item.id),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const completingLessons = useRef(new Set<string>());
  const attemptSequence = useRef(0);

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
        const withLanguage = <T extends { languageId?: string }>(items: T[]): T[] =>
          items.map((item) => ({ ...item, languageId: item.languageId ?? 'en' }));
        setState({
          ready: true,
          profile: profile ?? defaultProfile,
          completions: withLanguage(completions),
          attempts: withLanguage(attempts).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
          vocabulary: withLanguage(vocabulary),
          sessions: withLanguage(sessions),
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
      const detail = describeStorageError(error);
      markMemoryMode();
      setState((previous) => ({
        ...previous,
        storageMode: 'memory',
        error: `Não foi possível guardar no armazenamento local (${detail}). O progresso desta sessão fica apenas em memória; exporta um backup antes de fechar.`,
      }));
      try {
        await operation();
      } catch (retryError) {
        setState((previous) => ({ ...previous, error: `Não foi possível guardar: ${describeStorageError(retryError)}` }));
      }
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
      attemptSequence.current += 1;
      const attempt: Attempt = {
        languageId: state.profile.targetLanguage,
        ...input,
        id: Date.now() * 1000 + (attemptSequence.current % 1000),
        timestamp: new Date().toISOString(),
      };
      await persist(() => putRecord('attempts', attempt));
      setState((previous) => ({ ...previous, attempts: [...previous.attempts, attempt] }));
    },
    [persist, state.profile.targetLanguage],
  );

  const completeLesson = useCallback(
    async ({ lesson, correctCount, totalExercises, durationMs, mistakes }: CompleteLessonInput) => {
      if (completingLessons.current.has(lesson.id)) return 0;
      completingLessons.current.add(lesson.id);
      try {
        const stored = await getRecord<LessonCompletion>('completions', lesson.id).catch(() => undefined);
        if (stored || state.completions.some((item) => item.lessonId === lesson.id)) return 0;

        const xpAwarded = calculateLessonXp({ totalExercises, correctCount, firstCompletion: true });
        const completion: LessonCompletion = {
          languageId: lesson.languageId,
          lessonId: lesson.id,
          completedAt: new Date().toISOString(),
          correctCount,
          totalExercises,
          xpAwarded,
          durationMs,
          mistakes,
        };
        const newWords = vocabularyFromLesson(lesson);
        await persist(async () => {
          await putRecord('completions', completion);
          for (const item of newWords) await putRecord('vocabulary', item);
        });
        setState((previous) => {
          if (previous.completions.some((item) => item.lessonId === lesson.id)) return previous;
          return {
            ...previous,
            completions: [...previous.completions, completion],
            vocabulary: [
              ...previous.vocabulary,
              ...newWords.filter((item) => !previous.vocabulary.some((existing) => existing.id === item.id)),
            ],
          };
        });
        return xpAwarded;
      } finally {
        completingLessons.current.delete(lesson.id);
      }
    },
    [persist, state.completions],
  );

  const addVocabulary = useCallback(
    async (item: VocabularyItem) => {
      const record = { ...item, languageId: item.languageId ?? state.profile.targetLanguage };
      await persist(() => putRecord('vocabulary', record));
      setState((previous) => ({
        ...previous,
        vocabulary: previous.vocabulary.some((existing) => existing.id === record.id)
          ? previous.vocabulary.map((existing) => (existing.id === record.id ? record : existing))
          : [...previous.vocabulary, record],
      }));
    },
    [persist, state.profile.targetLanguage],
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
      const record = { ...session, languageId: session.languageId ?? state.profile.targetLanguage };
      await persist(() => putRecord('sessions', record));
      setState((previous) => ({
        ...previous,
        sessions: previous.sessions.some((existing) => existing.id === record.id)
          ? previous.sessions.map((existing) => (existing.id === record.id ? record : existing))
          : [record, ...previous.sessions],
      }));
    },
    [persist, state.profile.targetLanguage],
  );

  const importSnapshot = useCallback(
    async (rawSnapshot: AppSnapshot) => {
      const snapshot = normalizeSnapshot(rawSnapshot);
      await persist(() => replaceAll({
        profile: snapshot.profile,
        completions: snapshot.completions,
        attempts: snapshot.attempts,
        vocabulary: snapshot.vocabulary,
        sessions: snapshot.sessions,
      }));
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
    await persist(() => replaceAll({
      profile: defaultProfile,
      completions: [],
      attempts: [],
      vocabulary: [],
      sessions: [],
    }));
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

  const value = useMemo<AppContextValue>(() => {
    const languageId = state.profile.targetLanguage;
    const inLanguage = <T extends { languageId?: string }>(items: T[]) =>
      items.filter((item) => (item.languageId ?? 'en') === languageId);
    return {
      ...state,
      completions: inLanguage(state.completions),
      attempts: inLanguage(state.attempts),
      vocabulary: inLanguage(state.vocabulary),
      sessions: inLanguage(state.sessions),
      allCompletions: state.completions,
      allAttempts: state.attempts,
      allVocabulary: state.vocabulary,
      allSessions: state.sessions,
      language: getLanguage(languageId),
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
    };
  }, [
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
