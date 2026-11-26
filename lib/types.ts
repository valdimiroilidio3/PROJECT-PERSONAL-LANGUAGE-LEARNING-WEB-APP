export type CEFR = 'A1' | 'A2' | 'B1';
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
  targetLanguage: 'en';
  level: LearnerLevel;
  goal: LearnerGoal;
  dailyGoalMinutes: 5 | 10 | 15 | 20;
  diagnosticScore?: number;
  recommendedLessonId?: string;
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
  english: string;
  portuguese: string;
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
  english: string;
  portuguese: string;
  example: string;
  context: string;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  objective: string;
  cefr: CEFR;
  category: string;
  minutes: number;
  xp: number;
  vocabulary: VocabularySeed[];
  exercises: Exercise[];
}

export interface Attempt {
  id?: number;
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
  lessonId: string;
  completedAt: string;
  correctCount: number;
  totalExercises: number;
  xpAwarded: number;
  durationMs: number;
  mistakes: LessonMistake[];
}

export interface VocabularyItem extends VocabularySeed {
  id: string;
  familiarity: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  correctCount: number;
  incorrectCount: number;
  source: 'lesson' | 'manual';
  lessonId?: string;
  createdAt: string;
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
  title: string;
  description: string;
  icon: string;
  category: string;
  cefr: CEFR;
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
