export type AgeRange = '4-6' | '7-9' | '10-12';

export type SupportLanguage = 'en' | 'es' | 'ar' | 'bn' | 'hi' | 'fr' | 'zh';

export type LearningGoal =
  | 'alphabet_basics'
  | 'phonics_reading'
  | 'everyday_speaking'
  | 'school_readiness';

export type LumoExpression =
  | 'happy'
  | 'thinking'
  | 'excited'
  | 'encouraging'
  | 'surprised'
  | 'celebrating';

export type NavTab = 'home' | 'learn' | 'practice' | 'teacher' | 'profile';

export type OnboardingStep =
  | 'welcome'
  | 'parent'
  | 'child'
  | 'assessment'
  | 'path';

export interface UserProfile {
  id: string;
  nickname: string;
  ageRange: AgeRange;
  avatarId: string;
  preferredLanguage: SupportLanguage;
  learningGoal: LearningGoal;
  isGuestDemo: boolean;
  parentConsentGiven: boolean;
  parentPin: string;
  createdAt: string;
}

export interface LearningProfile {
  userId: string;
  currentLevel: number;
  totalXP: number;
  stars: number;
  coins: number;
  currentStreak: number;
  lastActiveDate: string;
  totalMinutesLearned: number;
  startingWorldId: string;
  learningGoals: string[];
}

export type ExerciseType =
  | 'letter_explore'
  | 'multiple_choice'
  | 'picture_to_word'
  | 'audio_to_picture'
  | 'letter_select'
  | 'word_build'
  | 'sentence_order'
  | 'fill_blank'
  | 'listening_comprehension'
  | 'pronunciation_speak'
  | 'memory_match'
  | 'letter_trace';

export interface ExerciseOption {
  id: string;
  label: string;
  visualKey?: string;
  subLabel?: string;
}

export interface MemoryPair {
  id: string;
  word: string;
  visualKey: string;
}

export interface Exercise {
  id: string;
  lessonId: string;
  exerciseType: ExerciseType;
  prompt: string;
  audioText?: string;
  targetLetter?: string;
  targetWord?: string;
  question: string;
  options?: ExerciseOption[];
  tiles?: string[];
  expectedAnswer: string;
  explanation: string;
  hint?: string;
  memoryPairs?: MemoryPair[];
  visualKey?: string;
}

export interface Lesson {
  id: string;
  worldId: string;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Explorer' | 'Builder' | 'Conversational';
  estimatedMinutes: number;
  sequence: number;
  focusItems: string[];
  exercises: Exercise[];
}

export interface LearningWorld {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  sequence: number;
  themeColor: string;
  bannerImage?: string;
  unlockXP: number;
  lessons: Lesson[];
}

export interface AlphabetEntry {
  letter: string;
  lowercase: string;
  letterNameIPA: string;
  phoneticSound: string;
  phoneticHint: string;
  multipleSoundsNote: string;
  exampleWord: string;
  exampleSentence: string;
  visualKey: string;
  accentColor: string;
}

export type VocabCategory =
  | 'Animals'
  | 'Fruits'
  | 'Colors'
  | 'Numbers'
  | 'Body Parts'
  | 'Family'
  | 'Food'
  | 'Objects'
  | 'Nature';

export interface VocabularyItem {
  id: string;
  word: string;
  category: VocabCategory;
  phonetic: string;
  definition: string;
  exampleSentence: string;
  visualKey: string;
  colorHex?: string;
  translations: Record<SupportLanguage, string>;
}

export interface StoryPage {
  id: string;
  text: string;
  highlightWords: string[];
  repeatPrompt: string;
  illustrationKey: string;
}

export interface StoryQuestion {
  id: string;
  question: string;
  options: string[];
  expectedAnswer: string;
  explanation: string;
}

export interface StoryAdventure {
  id: string;
  title: string;
  theme: string;
  readingMinutes: number;
  coverImage: string;
  newVocabulary: string[];
  pages: StoryPage[];
  comprehensionQuestions: StoryQuestion[];
}

export interface LessonProgressRecord {
  lessonId: string;
  worldId: string;
  completionStatus: 'in_progress' | 'completed';
  score: number;
  totalQuestions: number;
  starsEarned: number;
  completedAt: string;
}

export interface PronunciationAttempt {
  id: string;
  targetText: string;
  recognizedText: string;
  status: 'great' | 'good' | 'try_again' | 'unclear';
  feedback: string;
  focusSound?: string;
  source: 'ai' | 'offline_fallback';
  attemptTimestamp: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  iconKey: string;
}

export interface DailyMission {
  id: string;
  title: string;
  target: number;
  current: number;
  rewardXP: number;
  rewardCoins: number;
  type: 'lessons' | 'letters' | 'pronunciation' | 'teacher';
}

export interface PersonalizedRecommendation {
  id: string;
  title: string;
  reason: string;
  actionLabel: string;
  targetTab: NavTab;
  focusTarget?: string;
  breakdownGroups?: string[];
  kind: 'confused_letters' | 'word_breakdown' | 'spaced_repetition' | 'next_lesson';
}

export interface ParentSettings {
  dailyScreenTimeMinutes: number;
  remindersEnabled: boolean;
  soundEffectsEnabled: boolean;
  autoPlayAudio: boolean;
  speechSpeed: 'normal' | 'slow';
  reducedAnimations: boolean;
  saveVoiceClipsOptIn: boolean;
}

export interface AppPersistedState {
  onboardingComplete: boolean;
  user: UserProfile;
  learning: LearningProfile;
  completedLessons: Record<string, LessonProgressRecord>;
  masteredLetters: string[];
  masteredWords: string[];
  confusedLetters: Record<string, number>;
  misspelledWords: Record<string, number>;
  pronunciationHistory: PronunciationAttempt[];
  unlockedAchievements: string[];
  downloadedWorldIds: string[];
  completedStoryIds: string[];
  teacherTurnsCompleted: number;
  weeklyMinutes: number[];
  parentSettings: ParentSettings;
}
