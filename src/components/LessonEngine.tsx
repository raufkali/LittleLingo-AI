import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Coins,
  Mic,
  RotateCcw,
  Star,
  Volume2,
} from 'lucide-react';
import { ALPHABET_DATA } from '../data/curriculum';
import type { Exercise, Lesson, LumoExpression } from '../types/learning';
import { calculateLessonRewards, evaluateExerciseAnswer } from '../utils/learningEngine';
import { playToneFeedback, speakEnglish } from '../utils/audioSpeech';
import { AudioControls } from './AudioControls';
import { LetterTracingCanvas } from './LetterTracingCanvas';
import { LumoMascot } from './LumoMascot';
import { VisualIllustration } from './VisualIllustration';

interface LessonEngineProps {
  lesson: Lesson;
  worldTitle: string;
  currentStreak: number;
  soundEffectsEnabled: boolean;
  onExit: () => void;
  onCompleteLesson: (payload: {
    lessonId: string;
    worldId: string;
    score: number;
    totalQuestions: number;
    starsEarned: number;
    xpEarned: number;
    coinsEarned: number;
    confusedPairs: string[];
    misspelledWords: string[];
    masteredLetters: string[];
    masteredWords: string[];
  }) => void;
}

export const LessonEngine: React.FC<LessonEngineProps> = ({
  lesson,
  worldTitle,
  currentStreak,
  soundEffectsEnabled,
  onExit,
  onCompleteLesson,
}) => {
  const [phase, setPhase] = useState<'intro' | 'exercise' | 'complete'>('intro');
  const [exIdx, setExIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [builtTiles, setBuiltTiles] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    checked: boolean;
    isCorrect: boolean;
    title: string;
    message: string;
  } | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [confusedPairs, setConfusedPairs] = useState<string[]>([]);
  const [misspelledWords, setMisspelledWords] = useState<string[]>([]);
  const [micStatus, setMicStatus] = useState<'idle' | 'listening' | 'done'>('idle');
  const [spokenResult, setSpokenResult] = useState('');

  // Memory match state
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [pickedCard, setPickedCard] = useState<{ side: 'word' | 'pic'; id: string } | null>(null);

  const exercise: Exercise | undefined = lesson.exercises[exIdx];
  const progressPercent =
    phase === 'complete'
      ? 100
      : Math.round(((exIdx + (feedback?.isCorrect ? 1 : 0)) / Math.max(1, lesson.exercises.length)) * 100);

  const alphabetEntry = useMemo(() => {
    if (!exercise?.targetLetter) return undefined;
    return ALPHABET_DATA.find((a) => a.letter === exercise.targetLetter);
  }, [exercise?.targetLetter]);

  const lumoExpression: LumoExpression = useMemo(() => {
    if (phase === 'complete') return 'celebrating';
    if (feedback?.checked) return feedback.isCorrect ? 'excited' : 'encouraging';
    if (exercise?.exerciseType === 'pronunciation_speak') return 'happy';
    return 'happy';
  }, [phase, feedback, exercise?.exerciseType]);

  const resetExerciseLocalState = () => {
    setSelectedAnswer('');
    setBuiltTiles([]);
    setFeedback(null);
    setMicStatus('idle');
    setSpokenResult('');
    setMatchedPairIds([]);
    setPickedCard(null);
  };

  const handleCheck = (overrideAnswer?: string) => {
    if (!exercise) return;
    const answerToCheck =
      overrideAnswer ??
      (exercise.exerciseType === 'word_build'
        ? builtTiles.join('')
        : exercise.exerciseType === 'sentence_order'
          ? builtTiles.join(' ')
          : selectedAnswer);

    const res = evaluateExerciseAnswer(exercise, answerToCheck);
    setFeedback({
      checked: true,
      isCorrect: res.isCorrect,
      title: res.feedbackTitle,
      message: res.feedbackMessage,
    });

    if (res.isCorrect) {
      playToneFeedback('success', soundEffectsEnabled);
      setCorrectCount((c) => c + 1);
    } else {
      playToneFeedback('try_again', soundEffectsEnabled);
      if (res.confusedPair) {
        setConfusedPairs((prev) => [...prev, res.confusedPair!]);
      }
      if (exercise.exerciseType === 'word_build' && exercise.expectedAnswer) {
        setMisspelledWords((prev) => [...prev, exercise.expectedAnswer]);
      }
    }
  };

  const handleNext = () => {
    if (exIdx + 1 < lesson.exercises.length) {
      setExIdx((i) => i + 1);
      resetExerciseLocalState();
    } else {
      const total = Math.max(1, lesson.exercises.length);
      const rewards = calculateLessonRewards(correctCount, total, currentStreak);
      playToneFeedback('celebrate', soundEffectsEnabled);
      setPhase('complete');
      onCompleteLesson({
        lessonId: lesson.id,
        worldId: lesson.worldId,
        score: correctCount,
        totalQuestions: total,
        starsEarned: rewards.starsEarned,
        xpEarned: rewards.xpEarned,
        coinsEarned: rewards.coinsEarned,
        confusedPairs,
        misspelledWords,
        masteredLetters: lesson.focusItems.filter((item) => item.length === 1),
        masteredWords: lesson.focusItems.filter((item) => item.length > 1),
      });
    }
  };

  const handleMicPractice = () => {
    if (!exercise) return;
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setMicStatus('done');
      setSpokenResult(exercise.targetWord || exercise.expectedAnswer);
      setFeedback({
        checked: true,
        isCorrect: true,
        title: 'Great speaking!',
        message: 'You practiced saying "' + (exercise.targetWord || exercise.expectedAnswer) + '" out loud!',
      });
      setCorrectCount((c) => c + 1);
      playToneFeedback('success', soundEffectsEnabled);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = new (SpeechRec as any)();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      setMicStatus('listening');

      let settled = false;
      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          rec.stop();
        } catch {
          // ignore
        }
        setMicStatus('done');
        setFeedback({
          checked: true,
          isCorrect: true,
          title: 'Great speaking practice!',
          message: `Nice job practicing "${exercise.targetWord || exercise.expectedAnswer}" out loud with Lumo!`,
        });
        setCorrectCount((c) => c + 1);
        playToneFeedback('success', soundEffectsEnabled);
      }, 2500);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setMicStatus('done');
        setSpokenResult(transcript);
        setFeedback({
          checked: true,
          isCorrect: true,
          title: 'Wonderful speaking!',
          message: `Lumo heard "${transcript}". Keep practicing with a smile!`,
        });
        setCorrectCount((c) => c + 1);
        playToneFeedback('success', soundEffectsEnabled);
      };
      rec.onerror = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        setMicStatus('done');
        setFeedback({
          checked: true,
          isCorrect: true,
          title: 'Nice effort!',
          message: 'Microphone was busy, so Lumo gave you credit for practicing out loud!',
        });
        setCorrectCount((c) => c + 1);
      };
      rec.start();
    } catch {
      setMicStatus('done');
      setFeedback({
        checked: true,
        isCorrect: true,
        title: 'Great effort!',
        message: 'You practiced this sound out loud!',
      });
      setCorrectCount((c) => c + 1);
    }
  };

  const rewardsSummary = calculateLessonRewards(
    correctCount,
    Math.max(1, lesson.exercises.length),
    currentStreak
  );

  return (
    <div className="max-w-3xl mx-auto animate-pop-in">
      {/* Top Progress Bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onExit}
          aria-label="Back to World"
          className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-[#302B45]/12 text-[#302B45] hover:bg-[#FFF9EF] shrink-0"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#302B45]/70 mb-1.5">
            <span>{worldTitle} · {lesson.title}</span>
            <span className="tabular-nums">{progressPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-[#302B45]/10 overflow-hidden">
            <div
              className="h-full bg-[#56C88A] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Phase 1: Lesson Intro */}
      {phase === 'intro' && (
        <div className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-10 text-center shadow-sm">
          <div className="flex justify-center mb-4">
            <LumoMascot expression="excited" size={104} />
          </div>
          <p className="text-sm font-semibold text-[#7557D9] mb-1">
            {lesson.difficulty} · {lesson.estimatedMinutes} min · {lesson.exercises.length} activities
          </p>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#302B45] mb-3">
            {lesson.title}
          </h2>
          <p className="text-base text-[#302B45]/75 max-w-md mx-auto mb-6">
            {lesson.subtitle}. Let’s take one gentle step at a time!
          </p>

          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            {lesson.focusItems.map((item) => (
              <span
                key={item}
                className="px-4 py-2 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 font-display font-bold text-lg text-[#302B45]"
              >
                {item}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPhase('exercise')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 min-h-[52px] rounded-2xl bg-[#7557D9] text-white font-display font-bold text-lg hover:bg-[#6546ca] transition-colors"
          >
            <span>Start Lesson</span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Phase 2: Interactive Exercise Card */}
      {phase === 'exercise' && exercise && (
        <div className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold text-[#7557D9] mb-1">
                Activity {exIdx + 1} of {lesson.exercises.length} · {exercise.prompt}
              </p>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-[#302B45]">
                {exercise.question}
              </h3>
            </div>
            <LumoMascot expression={lumoExpression} size={64} className="shrink-0" />
          </div>

          {/* 1. Letter Exploration Card */}
          {exercise.exerciseType === 'letter_explore' && alphabetEntry && (
            <div className="bg-[#FFF9EF] rounded-2xl p-5 sm:p-6 border border-[#302B45]/8 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-28 h-28 rounded-3xl bg-white border-2 flex items-center justify-center font-display font-extrabold text-5xl shadow-sm"
                    style={{ borderColor: alphabetEntry.accentColor, color: alphabetEntry.accentColor }}
                  >
                    {alphabetEntry.letter}
                    <span className="text-4xl text-[#302B45] ml-1">{alphabetEntry.lowercase}</span>
                  </div>
                  <VisualIllustration visualKey={alphabetEntry.visualKey} size={80} />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <p className="font-display font-bold text-2xl text-[#302B45] mb-1">
                    {alphabetEntry.letter} is for {alphabetEntry.exampleWord}
                  </p>
                  <p className="text-sm text-[#302B45]/80 mb-2">
                    Letter Name: <span className="font-mono-phonetic font-semibold">{alphabetEntry.letterNameIPA}</span> · Sound:{' '}
                    <span className="font-mono-phonetic font-semibold text-[#7557D9]">{alphabetEntry.phoneticSound}</span>
                  </p>
                  <p className="text-sm text-[#302B45]/75 mb-4">{alphabetEntry.phoneticHint}</p>

                  <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                    <AudioControls text={`${alphabetEntry.letter}. ${alphabetEntry.exampleWord}`} label="Hear Letter & Word" />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#302B45]/10 text-xs text-[#302B45]/75">
                Good to know: {alphabetEntry.multipleSoundsNote}
              </div>
            </div>
          )}

          {/* 2. Audio prompt for listening/picture questions */}
          {exercise.audioText && exercise.exerciseType !== 'letter_explore' && (
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              {exercise.visualKey && (
                <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
                  <VisualIllustration visualKey={exercise.visualKey} size={76} />
                </div>
              )}
              <AudioControls text={exercise.audioText} label="Listen" />
            </div>
          )}

          {/* 3. Option-based exercises */}
          {exercise.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {exercise.options.map((opt) => {
                const isSelected = selectedAnswer === opt.label;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={feedback?.isCorrect}
                    onClick={() => {
                      setSelectedAnswer(opt.label);
                      setFeedback(null);
                    }}
                    className={`flex items-center gap-4 p-4 min-h-[60px] rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-[#7557D9] bg-[#EDE9FE]/50 shadow-sm'
                        : 'border-[#302B45]/12 bg-white hover:border-[#7557D9]/40 hover:bg-[#FFF9EF]/60'
                    }`}
                  >
                    {opt.visualKey && <VisualIllustration visualKey={opt.visualKey} size={48} />}
                    <div className="flex-1">
                      <span className="font-display font-bold text-lg text-[#302B45] block">
                        {opt.label}
                      </span>
                      {opt.subLabel && (
                        <span className="text-sm text-[#302B45]/65">Lowercase: {opt.subLabel}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 4. Word Builder / Sentence Order Tile Builder */}
          {(exercise.exerciseType === 'word_build' || exercise.exerciseType === 'sentence_order') &&
            exercise.tiles && (
              <div className="space-y-4 mb-6">
                <div className="min-h-[68px] p-4 rounded-2xl bg-[#FFF9EF] border-2 border-dashed border-[#7557D9]/35 flex items-center justify-center gap-2 flex-wrap">
                  {builtTiles.length === 0 ? (
                    <span className="text-sm text-[#302B45]/50 font-medium">
                      Tap the tiles below in order...
                    </span>
                  ) : (
                    builtTiles.map((t, idx) => (
                      <button
                        key={`${t}-${idx}`}
                        type="button"
                        onClick={() => {
                          setBuiltTiles((prev) => prev.filter((_, i) => i !== idx));
                          setFeedback(null);
                        }}
                        className="px-4 py-2 min-h-[44px] rounded-xl bg-[#7557D9] text-white font-display font-bold text-lg shadow-sm"
                      >
                        {t}
                      </button>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  {exercise.tiles.map((tile, idx) => {
                    const usedCount = builtTiles.filter((b) => b === tile).length;
                    const availableCount = exercise.tiles!.filter((x) => x === tile).length;
                    const isUsed = usedCount >= availableCount;
                    return (
                      <button
                        key={`${tile}-${idx}`}
                        type="button"
                        disabled={isUsed || Boolean(feedback?.isCorrect)}
                        onClick={() => {
                          setBuiltTiles((prev) => [...prev, tile]);
                          setFeedback(null);
                        }}
                        className="px-5 py-3 min-h-[48px] min-w-[48px] rounded-2xl bg-white border-2 border-[#302B45]/15 font-display font-bold text-lg text-[#302B45] hover:border-[#7557D9] disabled:opacity-30 transition-all"
                      >
                        {tile}
                      </button>
                    );
                  })}
                  {builtTiles.length > 0 && !feedback?.isCorrect && (
                    <button
                      type="button"
                      onClick={() => setBuiltTiles([])}
                      aria-label="Reset tiles"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold text-[#302B45]/70 hover:text-[#302B45]"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* 5. Letter Tracing Exercise */}
          {exercise.exerciseType === 'letter_trace' && exercise.targetLetter && (
            <div className="mb-6">
              <LetterTracingCanvas
                letter={exercise.targetLetter}
                onComplete={() => {
                  if (!feedback?.isCorrect) {
                    handleCheck(exercise.targetLetter);
                  }
                }}
              />
            </div>
          )}

          {/* 6. Pronunciation Speaking Exercise */}
          {exercise.exerciseType === 'pronunciation_speak' && (
            <div className="p-5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 text-center mb-6">
              <p className="font-display font-bold text-2xl text-[#302B45] mb-3">
                “{exercise.targetWord}”
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleMicPractice}
                  disabled={micStatus === 'listening'}
                  className={`inline-flex items-center gap-2.5 px-6 py-3.5 min-h-[48px] rounded-2xl font-bold text-base text-white transition-all ${
                    micStatus === 'listening'
                      ? 'bg-[#E05A5A] ring-4 ring-[#E05A5A]/25'
                      : 'bg-[#7557D9] hover:bg-[#6546ca]'
                  }`}
                >
                  <Mic className="w-5 h-5" aria-hidden="true" />
                  <span>
                    {micStatus === 'listening'
                      ? 'Listening to you...'
                      : micStatus === 'done'
                        ? 'Record Again'
                        : 'Tap to Speak'}
                  </span>
                </button>
                {!feedback?.isCorrect && (
                  <button
                    type="button"
                    onClick={() => {
                      setMicStatus('done');
                      setFeedback({
                        checked: true,
                        isCorrect: true,
                        title: 'Great speaking practice!',
                        message: `Awesome job saying "${exercise.targetWord || exercise.expectedAnswer}" out loud!`,
                      });
                      setCorrectCount((c) => c + 1);
                      playToneFeedback('success', soundEffectsEnabled);
                    }}
                    className="px-4 py-3 min-h-[48px] rounded-2xl bg-white border border-[#302B45]/15 text-sm font-semibold text-[#302B45] hover:bg-[#f4ebd8]"
                  >
                    I Practiced Out Loud
                  </button>
                )}
              </div>
              {spokenResult && (
                <p className="text-sm text-[#302B45]/75 mt-3">
                  Heard: <span className="font-semibold">“{spokenResult}”</span>
                </p>
              )}
            </div>
          )}

          {/* 7. Memory Match Mini-Game */}
          {exercise.exerciseType === 'memory_match' && exercise.memoryPairs && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-[#302B45]/60">Pictures</p>
                {exercise.memoryPairs.map((pair) => {
                  const isMatched = matchedPairIds.includes(pair.id);
                  const isPicked = pickedCard?.side === 'pic' && pickedCard.id === pair.id;
                  return (
                    <button
                      key={`pic-${pair.id}`}
                      type="button"
                      disabled={isMatched}
                      onClick={() => {
                        if (pickedCard?.side === 'word') {
                          if (pickedCard.id === pair.id) {
                            const next = [...matchedPairIds, pair.id];
                            setMatchedPairIds(next);
                            setPickedCard(null);
                            playToneFeedback('success', soundEffectsEnabled);
                            if (next.length === exercise.memoryPairs!.length) {
                              handleCheck('matched');
                            }
                          } else {
                            playToneFeedback('try_again', soundEffectsEnabled);
                            setPickedCard(null);
                          }
                        } else {
                          setPickedCard({ side: 'pic', id: pair.id });
                        }
                      }}
                      className={`w-full p-3 min-h-[64px] rounded-2xl border-2 flex items-center justify-center transition-all ${
                        isMatched
                          ? 'bg-[#56C88A]/15 border-[#56C88A] opacity-70'
                          : isPicked
                            ? 'border-[#7557D9] bg-[#EDE9FE]/60'
                            : 'bg-white border-[#302B45]/12 hover:border-[#7557D9]/40'
                      }`}
                    >
                      <VisualIllustration visualKey={pair.visualKey} size={46} />
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-[#302B45]/60">English Words</p>
                {[...exercise.memoryPairs].reverse().map((pair) => {
                  const isMatched = matchedPairIds.includes(pair.id);
                  const isPicked = pickedCard?.side === 'word' && pickedCard.id === pair.id;
                  return (
                    <button
                      key={`word-${pair.id}`}
                      type="button"
                      disabled={isMatched}
                      onClick={() => {
                        speakEnglish(pair.word, { rate: 0.9 });
                        if (pickedCard?.side === 'pic') {
                          if (pickedCard.id === pair.id) {
                            const next = [...matchedPairIds, pair.id];
                            setMatchedPairIds(next);
                            setPickedCard(null);
                            playToneFeedback('success', soundEffectsEnabled);
                            if (next.length === exercise.memoryPairs!.length) {
                              handleCheck('matched');
                            }
                          } else {
                            playToneFeedback('try_again', soundEffectsEnabled);
                            setPickedCard(null);
                          }
                        } else {
                          setPickedCard({ side: 'word', id: pair.id });
                        }
                      }}
                      className={`w-full p-3 min-h-[64px] rounded-2xl border-2 font-display font-bold text-lg transition-all ${
                        isMatched
                          ? 'bg-[#56C88A]/15 border-[#56C88A] text-[#2B8A57]'
                          : isPicked
                            ? 'border-[#7557D9] bg-[#EDE9FE]/60 text-[#302B45]'
                            : 'bg-white border-[#302B45]/12 text-[#302B45] hover:border-[#7557D9]/40'
                      }`}
                    >
                      {pair.word}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border mb-6 animate-pop-in ${
                feedback.isCorrect
                  ? 'bg-[#56C88A]/12 border-[#56C88A]/40 text-[#1F5E3B]'
                  : 'bg-[#FFD45A]/20 border-[#FFD45A] text-[#302B45]'
              }`}
            >
              <p className="font-display font-bold text-base flex items-center gap-2">
                {feedback.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-[#2B8A57]" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-5 h-5 text-[#7557D9]" aria-hidden="true" />
                )}
                <span>{feedback.title}</span>
              </p>
              <p className="text-sm mt-1 leading-relaxed">{feedback.message}</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3">
            {exercise.exerciseType === 'letter_explore' ? (
              <button
                type="button"
                onClick={() => {
                  setCorrectCount((c) => c + 1);
                  playToneFeedback('success', soundEffectsEnabled);
                  handleNext();
                }}
                className="inline-flex items-center gap-2 px-7 py-3.5 min-h-[48px] rounded-2xl bg-[#56C88A] text-white font-display font-bold text-base hover:bg-[#49b67b]"
              >
                <span>Got It! Next</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            ) : feedback?.isCorrect ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-7 py-3.5 min-h-[48px] rounded-2xl bg-[#56C88A] text-white font-display font-bold text-base hover:bg-[#49b67b]"
              >
                <span>{exIdx + 1 < lesson.exercises.length ? 'Continue' : 'Finish Lesson'}</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            ) : (
              exercise.exerciseType !== 'memory_match' &&
              exercise.exerciseType !== 'letter_trace' &&
              exercise.exerciseType !== 'pronunciation_speak' && (
                <button
                  type="button"
                  disabled={
                    exercise.exerciseType === 'word_build' || exercise.exerciseType === 'sentence_order'
                      ? builtTiles.length === 0
                      : !selectedAnswer
                  }
                  onClick={() => handleCheck()}
                  className="inline-flex items-center gap-2 px-7 py-3.5 min-h-[48px] rounded-2xl bg-[#7557D9] text-white font-display font-bold text-base hover:bg-[#6546ca] disabled:opacity-40"
                >
                  <span>Check Answer</span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Phase 3: Lesson Completion Celebration */}
      {phase === 'complete' && (
        <div className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-10 text-center shadow-sm animate-pop-in">
          <div className="flex justify-center mb-4">
            <LumoMascot expression="celebrating" size={120} />
          </div>
          <h2 className="font-display font-extrabold text-3xl text-[#302B45] mb-2">
            Lesson Complete!
          </h2>
          <p className="text-base text-[#302B45]/75 mb-6">
            You finished <span className="font-semibold text-[#302B45]">{lesson.title}</span> with{' '}
            <span className="tabular-nums font-bold">{rewardsSummary.accuracyPercent}%</span> accuracy!
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8">
            <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
              <Award className="w-6 h-6 text-[#7557D9] mx-auto mb-1" aria-hidden="true" />
              <p className="font-display font-extrabold text-2xl tabular-nums text-[#302B45]">
                +{rewardsSummary.xpEarned}
              </p>
              <p className="text-xs font-medium text-[#302B45]/65">XP Earned</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
              <Star className="w-6 h-6 text-[#F59E0B] mx-auto mb-1" aria-hidden="true" />
              <p className="font-display font-extrabold text-2xl tabular-nums text-[#302B45]">
                {rewardsSummary.starsEarned} / 3
              </p>
              <p className="text-xs font-medium text-[#302B45]/65">Stars</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
              <Coins className="w-6 h-6 text-[#56C88A] mx-auto mb-1" aria-hidden="true" />
              <p className="font-display font-extrabold text-2xl tabular-nums text-[#302B45]">
                +{rewardsSummary.coinsEarned}
              </p>
              <p className="text-xs font-medium text-[#302B45]/65">Coins</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 min-h-[52px] rounded-2xl bg-[#7557D9] text-white font-display font-bold text-lg hover:bg-[#6546ca]"
          >
            <span>Back to Adventure Map</span>
          </button>
        </div>
      )}
    </div>
  );
};
