import type {
  AppPersistedState,
  Exercise,
  LearningWorld,
  LessonProgressRecord,
  PersonalizedRecommendation,
  PronunciationAttempt,
} from '../types/learning';

export interface AssessmentAnswers {
  knowsAlphabet: 'none' | 'some' | 'all';
  pictureWordAnswer: string;
  listeningAnswer: string;
}

export function determineStartingPath(answers: AssessmentAnswers): {
  startingWorldId: string;
  startingLessonId: string;
  levelLabel: string;
  summary: string;
} {
  let score = 0;
  if (answers.knowsAlphabet === 'some') score += 1;
  if (answers.knowsAlphabet === 'all') score += 2;
  if (answers.pictureWordAnswer.trim().toLowerCase() === 'apple') score += 1;
  if (answers.listeningAnswer.trim().toLowerCase() === 'cat') score += 1;

  if (score <= 1) {
    return {
      startingWorldId: 'world-alphabet',
      startingLessonId: 'lesson-alpha-1',
      levelLabel: 'Starter Explorer (Level 1)',
      summary:
        'We will start at the beginning of Alphabet Forest with Lumo so every letter name and sound feels clear and fun.',
    };
  }
  if (score <= 3) {
    return {
      startingWorldId: 'world-phonics',
      startingLessonId: 'lesson-phonics-1',
      levelLabel: 'Phonics Adventurer (Level 2)',
      summary:
        'Great start! You already recognize some letters, so we unlocked Phonics Mountain alongside Alphabet Forest.',
    };
  }
  return {
    startingWorldId: 'world-vocab',
    startingLessonId: 'lesson-vocab-1',
    levelLabel: 'Word Builder (Level 3)',
    summary:
      'Awesome! You know your letters and starter words. Jump into Vocabulary Kingdom or review any world anytime.',
  };
}

export function normalizeAnswerText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,!?'"`]/g, '')
    .replace(/\s+/g, ' ');
}

export function evaluateExerciseAnswer(
  exercise: Exercise,
  userAnswer: string
): {
  isCorrect: boolean;
  feedbackTitle: string;
  feedbackMessage: string;
  confusedPair?: string;
} {
  if (exercise.exerciseType === 'letter_explore' || exercise.exerciseType === 'letter_trace' || exercise.exerciseType === 'memory_match') {
    return {
      isCorrect: true,
      feedbackTitle: 'Wonderful job!',
      feedbackMessage: exercise.explanation || 'You completed this activity!',
    };
  }

  const normalizedUser = normalizeAnswerText(userAnswer);
  const normalizedExpected = normalizeAnswerText(exercise.expectedAnswer);

  if (normalizedUser === normalizedExpected) {
    return {
      isCorrect: true,
      feedbackTitle: 'Fantastic!',
      feedbackMessage: exercise.explanation,
    };
  }

  let confusedPair: string | undefined;
  if (
    (normalizedExpected === 'b' && normalizedUser === 'd') ||
    (normalizedExpected === 'd' && normalizedUser === 'b')
  ) {
    confusedPair = 'B-D';
  } else if (
    (normalizedExpected === 'p' && normalizedUser === 'q') ||
    (normalizedExpected === 'q' && normalizedUser === 'p')
  ) {
    confusedPair = 'P-Q';
  }

  return {
    isCorrect: false,
    feedbackTitle: 'Great try!',
    feedbackMessage:
      exercise.hint ||
      `Let's look closely together. ${exercise.explanation}`,
    confusedPair,
  };
}

export function computeLevelFromXP(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
} {
  const safeXP = Math.max(0, Math.floor(totalXP));
  const xpPerLevel = 100;
  const level = Math.floor(safeXP / xpPerLevel) + 1;
  const currentLevelXP = safeXP % xpPerLevel;
  return {
    level,
    currentLevelXP,
    nextLevelXP: xpPerLevel,
    progressPercent: Math.min(100, Math.round((currentLevelXP / xpPerLevel) * 100)),
  };
}

export function calculateLessonRewards(
  correctCount: number,
  totalCount: number,
  currentStreak: number
): {
  xpEarned: number;
  starsEarned: number;
  coinsEarned: number;
  accuracyPercent: number;
} {
  const safeTotal = Math.max(1, totalCount);
  const clampedCorrect = Math.max(0, Math.min(safeTotal, correctCount));
  const accuracyPercent = Math.round((clampedCorrect / safeTotal) * 100);
  const starsEarned = accuracyPercent >= 85 ? 3 : accuracyPercent >= 55 ? 2 : 1;
  const streakBonus = Math.min(15, Math.max(0, currentStreak) * 3);
  const xpEarned = 20 + clampedCorrect * 8 + streakBonus;
  const coinsEarned = 5 + starsEarned * 5;

  return {
    xpEarned,
    starsEarned,
    coinsEarned,
    accuracyPercent,
  };
}

export function evaluatePronunciationHeuristic(
  targetText: string,
  recognizedText: string,
  confidence = 0.85
): {
  status: PronunciationAttempt['status'];
  feedback: string;
  focusSound?: string;
} {
  const cleanTarget = normalizeAnswerText(targetText);
  const cleanSpoken = normalizeAnswerText(recognizedText);

  if (!cleanSpoken || cleanSpoken.length === 0) {
    return {
      status: 'unclear',
      feedback: 'We did not catch your voice clearly. Move closer to the microphone and try once more!',
      focusSound: cleanTarget.charAt(0).toUpperCase(),
    };
  }

  if (cleanSpoken === cleanTarget) {
    if (confidence >= 0.65) {
      return {
        status: 'great',
        feedback: `Super clear! You said "${targetText}" wonderfully.`,
      };
    }
    return {
      status: 'good',
      feedback: `Good try! We heard "${targetText}". Let's say it one more time nice and clearly.`,
    };
  }

  if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
    return {
      status: 'good',
      feedback: `Wonderful effort! You are very close to "${targetText}". Let's practice saying it slowly together.`,
      focusSound: cleanTarget.charAt(0).toUpperCase(),
    };
  }

  // Simple Levenshtein similarity check
  const distance = levenshteinDistance(cleanTarget, cleanSpoken);
  const maxLen = Math.max(cleanTarget.length, cleanSpoken.length);
  const similarity = maxLen === 0 ? 1 : 1 - distance / maxLen;

  if (similarity >= 0.55) {
    const firstChar = cleanTarget.charAt(0).toUpperCase();
    return {
      status: 'good',
      feedback: `Wonderful effort! Let's practice the "${firstChar}" sound in "${targetText}" again.`,
      focusSound: firstChar,
    };
  }

  return {
    status: 'try_again',
    feedback: `Great try! Listen to "${targetText}" once more and say it slowly with Lumo.`,
    focusSound: cleanTarget.charAt(0).toUpperCase(),
  };
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

export function splitWordIntoSoundGroups(word: string): string[] {
  const clean = word.trim().toUpperCase();
  if (clean === 'ELEPHANT') return ['EL', 'E', 'PHANT'];
  if (clean === 'WATERMELON') return ['WA', 'TER', 'MEL', 'ON'];
  if (clean === 'BANANA') return ['BA', 'NA', 'NA'];
  if (clean === 'BUTTERFLY') return ['BUT', 'TER', 'FLY'];
  if (clean === 'GRANDMOTHER') return ['GRAND', 'MOTH', 'ER'];
  if (clean.length <= 4) return [clean];
  const groups: string[] = [];
  for (let i = 0; i < clean.length; i += 3) {
    groups.push(clean.slice(i, i + 3));
  }
  return groups;
}

export function generatePersonalizedRecommendations(
  state: Pick<
    AppPersistedState,
    'completedLessons' | 'confusedLetters' | 'misspelledWords' | 'pronunciationHistory'
  >,
  worlds: LearningWorld[]
): PersonalizedRecommendation[] {
  const recs: PersonalizedRecommendation[] = [];

  // 1. Confused letter pair detection (e.g., B vs D)
  const confusedBD = state.confusedLetters['B-D'] || 0;
  const confusedPQ = state.confusedLetters['P-Q'] || 0;
  if (confusedBD > 0) {
    recs.push({
      id: 'rec-confused-bd',
      title: 'B vs D Sound & Shape Spotlight',
      reason: 'Lumo noticed B and D looked tricky earlier. Let’s compare their shapes and sounds side by side!',
      actionLabel: 'Practice B & D',
      targetTab: 'practice',
      focusTarget: 'B-D',
      kind: 'confused_letters',
    });
  } else if (confusedPQ > 0) {
    recs.push({
      id: 'rec-confused-pq',
      title: 'P vs Q Sound Spotlight',
      reason: 'Let’s practice telling P and Q apart with playful sound clues.',
      actionLabel: 'Practice P & Q',
      targetTab: 'practice',
      focusTarget: 'P-Q',
      kind: 'confused_letters',
    });
  }

  // 2. Misspelled long words -> break into sound groups
  const sortedMisspelled = Object.entries(state.misspelledWords).sort((a, b) => b[1] - a[1]);
  if (sortedMisspelled.length > 0) {
    const [hardWord] = sortedMisspelled[0];
    recs.push({
      id: `rec-word-${hardWord}`,
      title: `Sound Breakdown: ${hardWord.toUpperCase()}`,
      reason: `Let’s break "${hardWord.toUpperCase()}" into gentle sound chunks and practice slowly.`,
      actionLabel: 'Hear & Practice',
      targetTab: 'practice',
      focusTarget: hardWord.toUpperCase(),
      breakdownGroups: splitWordIntoSoundGroups(hardWord),
      kind: 'word_breakdown',
    });
  }

  // 3. Spaced repetition for low-score completed lessons
  const reviewCandidate = Object.values(state.completedLessons).find(
    (rec: LessonProgressRecord) => rec.starsEarned < 3
  );
  if (reviewCandidate) {
    recs.push({
      id: `rec-review-${reviewCandidate.lessonId}`,
      title: 'Quick Memory Boost Review',
      reason: 'Bringing back a recent lesson helps your brain remember words even better!',
      actionLabel: 'Review Lesson',
      targetTab: 'learn',
      focusTarget: reviewCandidate.lessonId,
      kind: 'spaced_repetition',
    });
  }

  // 4. Next uncompleted lesson across worlds
  for (const world of worlds) {
    const nextLesson = world.lessons.find((l) => !state.completedLessons[l.id]);
    if (nextLesson) {
      recs.push({
        id: `rec-next-${nextLesson.id}`,
        title: `Up Next: ${nextLesson.title}`,
        reason: `${world.title} · ${nextLesson.estimatedMinutes} min adventure tailored for you.`,
        actionLabel: 'Start Lesson',
        targetTab: 'learn',
        focusTarget: nextLesson.id,
        kind: 'next_lesson',
      });
      break;
    }
  }

  return recs.slice(0, 3);
}

export function computeUnlockedAchievements(state: AppPersistedState): string[] {
  const unlocked = new Set(state.unlockedAchievements);
  const completedCount = Object.keys(state.completedLessons).length;

  if (state.masteredLetters.length >= 1 || completedCount >= 1) {
    unlocked.add('ach-first-letter');
  }
  if (state.masteredLetters.length >= 26) {
    unlocked.add('ach-alphabet-hero');
  }
  if (state.masteredWords.length >= 15) {
    unlocked.add('ach-word-explorer');
  }
  if (state.pronunciationHistory.length >= 5) {
    unlocked.add('ach-speaking-star');
  }
  if (state.completedStoryIds.length >= 1) {
    unlocked.add('ach-story-reader');
  }
  if (state.teacherTurnsCompleted >= 3) {
    unlocked.add('ach-lumo-friend');
  }

  return Array.from(unlocked);
}
