export type LanguageId =
  | 'en'
  | 'es'
  | 'nl'
  | 'fr'
  | 'de'
  | 'it'
  | 'javascript'
  | 'python';

export type LessonLevel = 'A1' | 'A2' | 'B1' | 'L1' | 'L2' | 'L3';

/** Kept as a named alias so existing callers read naturally. */
export type CEFR = Exclude<LessonLevel, 'L1' | 'L2' | 'L3'>;

export type LearnerLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced';
export type LearnerGoal = 'everyday' | 'work' | 'travel' | 'study' | 'fluency';
export type ExerciseType =
  | 'multiple-choice'
  | 'translation'
  | 'word-order'
  | 'matching'
  | 'fill-blank'
  | 'listening'
  | 'dialogue'
  | 'sentence'
  | 'reading';

export interface Profile {
  onboarded: boolean;
  nativeLanguage: 'pt';
  targetLanguage: LanguageId;
  level: LearnerLevel;
  goal: LearnerGoal;
  dailyGoalMinutes: 5 | 10 | 15 | 20;
  diagnosticScore?: number;
  recommendedLessonId?: string;
  supportLocale?: 'pt-PT' | 'pt-BR';
  createdAt: string;
}

interface BaseExercise {
  id: string;
  prompt: string;
  explanation: string;
  category: string;
  translation?: string;
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TranslationExercise extends BaseExercise {
  type: 'translation';
  answers: string[];
}

export interface WordOrderExercise extends BaseExercise {
  type: 'word-order';
  words: string[];
  answer: string;
  alternatives?: string[];
}

export interface MatchingPair {
  term: string;
  translation: string;
}

export interface MatchingExercise extends BaseExercise {
  type: 'matching';
  pairs: MatchingPair[];
}

export interface FillBlankExercise extends BaseExercise {
  type: 'fill-blank';
  sentence: string;
  answers: string[];
}

export interface ListeningExercise extends BaseExercise {
  type: 'listening';
  audioText: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface DialogueExercise extends BaseExercise {
  type: 'dialogue';
  lines: string[];
  blankIndex: number;
  options: string[];
  correctIndex: number;
}

export interface SentenceExercise extends BaseExercise {
  type: 'sentence';
  hint: string;
  answers: string[];
}

export interface ReadingExercise extends BaseExercise {
  type: 'reading';
  passage: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export type Exercise =
  | MultipleChoiceExercise
  | TranslationExercise
  | WordOrderExercise
  | MatchingExercise
  | FillBlankExercise
  | ListeningExercise
  | DialogueExercise
  | SentenceExercise
  | ReadingExercise;

export interface VocabularySeed {
  term: string;
  translation: string;
  example: string;
  context: string;
}

export interface Lesson {
  id: string;
  languageId: LanguageId;
  title: string;
  subtitle: string;
  objective: string;
  level: LessonLevel;
  category: string;
  minutes: number;
  xp: number;
  vocabulary: VocabularySeed[];
  exercises: Exercise[];
}

/** A diagnostic question is derived from real lesson content, never from demo data. */
export interface DiagnosticQuestion {
  prompt: string;
  options: string[];
  answerIndex: number;
  points: number;
  hint: string;
}

export interface Attempt {
  id?: number;
  languageId?: LanguageId;
  lessonId: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  category: string;
  timestamp: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  durationMs: number;
  xpAwarded: number;
  source: 'lesson' | 'practice' | 'review' | 'tutor';
}

export interface LessonMistake {
  exerciseId: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export interface LessonCompletion {
  languageId?: LanguageId;
  lessonId: string;
  completedAt: string;
  correctCount: number;
  totalExercises: number;
  xpAwarded: number;
  durationMs: number;
  mistakes: LessonMistake[];
}

export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy';
export type MasteryStatus = 'new' | 'learning' | 'mastered';

export interface ReviewEvent {
  timestamp: string;
  quality: ReviewQuality;
  familiarityAfter: number;
  intervalDays: number;
}

export interface VocabularyItem extends VocabularySeed {
  id: string;
  languageId?: LanguageId;
  familiarity: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  correctCount: number;
  incorrectCount: number;
  source: 'lesson' | 'manual';
  lessonId?: string;
  createdAt: string;
  /** Optional so backups created before 2.0 remain valid. */
  history?: ReviewEvent[];
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  translation?: string;
  alternatives?: string[];
  corrections?: GrammarCorrection[];
  timestamp: string;
  scenarioId: string;
  provider: 'offline' | 'ollama' | 'openai-compatible';
}

export interface TutorSession {
  id: string;
  languageId?: LanguageId;
  createdAt: string;
  updatedAt: string;
  scenarioId: string;
  personality: string;
  difficulty: LearnerLevel;
  messages: TutorMessage[];
  summary?: string;
}

export interface PracticeScenario {
  id: string;
  languageId: LanguageId;
  title: string;
  description: string;
  icon: string;
  category: string;
  level: LessonLevel;
  prompts: string[];
  translations: string[];
  hints: string[];
  keywords: string[][];
  modelAnswers: string[];
}

export interface AppSnapshot {
  version: 1;
  exportedAt: string;
  profile: Profile;
  completions: LessonCompletion[];
  attempts: Attempt[];
  vocabulary: VocabularyItem[];
  sessions: TutorSession[];
}
