import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLessonRewards,
  computeLevelFromXP,
  determineStartingPath,
  evaluateExerciseAnswer,
  evaluatePronunciationHeuristic,
  generatePersonalizedRecommendations,
  splitWordIntoSoundGroups,
} from './learningEngine';
import type { Exercise, LearningWorld } from '../types/learning';

test('determineStartingPath routes absolute beginner to Alphabet Forest', () => {
  const path = determineStartingPath({
    knowsAlphabet: 'none',
    pictureWordAnswer: 'ball',
    listeningAnswer: 'dog',
  });
  assert.equal(path.startingWorldId, 'world-alphabet');
  assert.equal(path.startingLessonId, 'lesson-alpha-1');
});

test('determineStartingPath routes experienced learner to Vocabulary Kingdom', () => {
  const path = determineStartingPath({
    knowsAlphabet: 'all',
    pictureWordAnswer: 'Apple',
    listeningAnswer: 'cat',
  });
  assert.equal(path.startingWorldId, 'world-vocab');
});

test('evaluateExerciseAnswer detects B vs D confusion gently', () => {
  const ex: Exercise = {
    id: 'ex-1',
    lessonId: 'l1',
    exerciseType: 'letter_select',
    prompt: 'Letter Sound',
    question: 'Which letter makes the /b/ sound in Ball?',
    expectedAnswer: 'B',
    explanation: 'B makes the /b/ sound in Ball.',
  };

  const wrong = evaluateExerciseAnswer(ex, 'd');
  assert.equal(wrong.isCorrect, false);
  assert.equal(wrong.confusedPair, 'B-D');
  assert.equal(wrong.feedbackTitle, 'Great try!');

  const right = evaluateExerciseAnswer(ex, 'b');
  assert.equal(right.isCorrect, true);
});

test('calculateLessonRewards and computeLevelFromXP compute stars, XP, and level', () => {
  const rewards = calculateLessonRewards(5, 5, 2);
  assert.equal(rewards.accuracyPercent, 100);
  assert.equal(rewards.starsEarned, 3);
  assert.equal(rewards.xpEarned, 20 + 40 + 6);
  assert.equal(rewards.coinsEarned, 20);

  const levelInfo = computeLevelFromXP(245);
  assert.equal(levelInfo.level, 3);
  assert.equal(levelInfo.currentLevelXP, 45);
});

test('evaluatePronunciationHeuristic gives encouraging, accent-respectful feedback', () => {
  const exact = evaluatePronunciationHeuristic('Apple', 'apple', 0.9);
  assert.equal(exact.status, 'great');

  const close = evaluatePronunciationHeuristic('Apple', 'aple', 0.7);
  assert.equal(close.status, 'good');
  assert.equal(close.focusSound, 'A');

  const empty = evaluatePronunciationHeuristic('Apple', '', 0);
  assert.equal(empty.status, 'unclear');
});

test('splitWordIntoSoundGroups breaks ELEPHANT into EL-E-PHANT', () => {
  assert.deepEqual(splitWordIntoSoundGroups('elephant'), ['EL', 'E', 'PHANT']);
});

test('generatePersonalizedRecommendations prioritizes B-D confusion and word breakdown', () => {
  const mockWorlds: LearningWorld[] = [
    {
      id: 'world-alphabet',
      title: 'Alphabet Forest',
      subtitle: 'Letters A to Z',
      description: 'Learn letters',
      sequence: 1,
      themeColor: '#56C88A',
      unlockXP: 0,
      lessons: [
        {
          id: 'lesson-alpha-1',
          worldId: 'world-alphabet',
          title: 'Letters A–E',
          subtitle: 'First 5 letters',
          difficulty: 'Beginner',
          estimatedMinutes: 4,
          sequence: 1,
          focusItems: ['A', 'B', 'C', 'D', 'E'],
          exercises: [],
        },
      ],
    },
  ];

  const recs = generatePersonalizedRecommendations(
    {
      completedLessons: {},
      confusedLetters: { 'B-D': 2 },
      misspelledWords: { ELEPHANT: 3 },
      pronunciationHistory: [],
    },
    mockWorlds
  );

  assert.equal(recs.length, 3);
  assert.equal(recs[0].kind, 'confused_letters');
  assert.equal(recs[1].kind, 'word_breakdown');
  assert.deepEqual(recs[1].breakdownGroups, ['EL', 'E', 'PHANT']);
});
