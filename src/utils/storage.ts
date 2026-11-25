import type { AppPersistedState } from '../types/learning';

const STORAGE_KEY = 'littlelingo_ai_state_v1';

export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createSeededDemoState(onboardingComplete = false): AppPersistedState {
  const today = getTodayISO();
  return {
    onboardingComplete,
    user: {
      id: 'learner-demo-1',
      nickname: 'Ali',
      ageRange: '7-9',
      avatarId: 'owl',
      preferredLanguage: 'en',
      learningGoal: 'alphabet_basics',
      isGuestDemo: true,
      parentConsentGiven: true,
      parentPin: '1234',
      createdAt: new Date().toISOString(),
    },
    learning: {
      userId: 'learner-demo-1',
      currentLevel: 1,
      totalXP: 45,
      stars: 3,
      coins: 25,
      currentStreak: 2,
      lastActiveDate: today,
      totalMinutesLearned: 14,
      startingWorldId: 'world-alphabet',
      learningGoals: ['Learn all 26 letters', 'Speak 5 words with Lumo'],
    },
    completedLessons: {},
    masteredLetters: ['A', 'B'],
    masteredWords: ['Apple', 'Ball'],
    confusedLetters: { 'B-D': 1 },
    misspelledWords: { ELEPHANT: 1 },
    pronunciationHistory: [
      {
        id: 'pa-seed-1',
        targetText: 'Apple',
        recognizedText: 'Apple',
        status: 'great',
        feedback: 'Super clear! You said "Apple" wonderfully.',
        source: 'offline_fallback',
        attemptTimestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
    ],
    unlockedAchievements: ['ach-first-letter'],
    downloadedWorldIds: ['world-alphabet'],
    completedStoryIds: [],
    teacherTurnsCompleted: 0,
    weeklyMinutes: [8, 12, 10, 15, 6, 14, 14],
    parentSettings: {
      dailyScreenTimeMinutes: 25,
      remindersEnabled: true,
      soundEffectsEnabled: true,
      autoPlayAudio: true,
      speechSpeed: 'normal',
      reducedAnimations: false,
      saveVoiceClipsOptIn: false,
    },
  };
}

export function loadAppState(): AppPersistedState {
  if (typeof window === 'undefined') {
    return createSeededDemoState(false);
  }
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppPersistedState;
      if (autostart && !parsed.onboardingComplete) {
        return { ...parsed, onboardingComplete: true };
      }
      return parsed;
    }
  } catch {
    // Ignore corrupted storage
  }

  return createSeededDemoState(autostart);
}

export function saveAppState(state: AppPersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearAppState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
