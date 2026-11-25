import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Ear,
  Mic,
  PenTool,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react';
import { ALPHABET_DATA, VOCABULARY_DATA } from '../data/curriculum';
import type { AppPersistedState, PronunciationAttempt } from '../types/learning';
import {
  evaluatePronunciationHeuristic,
  splitWordIntoSoundGroups,
} from '../utils/learningEngine';
import { playToneFeedback, speakEnglish } from '../utils/audioSpeech';
import { AudioControls } from './AudioControls';
import { LetterTracingCanvas } from './LetterTracingCanvas';
import { LumoMascot } from './LumoMascot';
import { VisualIllustration } from './VisualIllustration';

export type PracticeSubTab = 'pronunciation' | 'tracing' | 'listening' | 'review';

interface PracticeHubProps {
  state: AppPersistedState;
  initialSubTab?: PracticeSubTab;
  initialFocus?: string;
  onRecordPronunciation: (attempt: PronunciationAttempt) => void;
  onPracticeLetter: (letter: string) => void;
}

const COACH_WORDS = [
  { word: 'Apple', phonetic: '/ˈæpəl/', visualKey: 'apple' },
  { word: 'Ball', phonetic: '/bɔːl/', visualKey: 'ball' },
  { word: 'Cat', phonetic: '/kæt/', visualKey: 'cat' },
  { word: 'Elephant', phonetic: '/ˈɛlɪfənt/', visualKey: 'elephant' },
  { word: 'Water', phonetic: '/ˈwɔːtər/', visualKey: 'water' },
  { word: 'Sun', phonetic: '/sʌn/', visualKey: 'sun' },
];

export const PracticeHub: React.FC<PracticeHubProps> = ({
  state,
  initialSubTab = 'pronunciation',
  initialFocus,
  onRecordPronunciation,
  onPracticeLetter,
}) => {
  const [subTab, setSubTab] = useState<PracticeSubTab>(initialSubTab);

  // Pronunciation Coach state
  const [targetWord, setTargetWord] = useState(
    initialFocus && !initialFocus.includes('-') ? initialFocus : 'Apple'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [typedFallback, setTypedFallback] = useState('');
  const [latestResult, setLatestResult] = useState<PronunciationAttempt | null>(
    state.pronunciationHistory[0] || null
  );
  const [coachNotice, setCoachNotice] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Tracing state
  const [traceLetter, setTraceLetter] = useState('A');

  // Listening lab state
  const [listenIdx, setListenIdx] = useState(0);
  const [listenFeedback, setListenFeedback] = useState('');
  const listenPool = useMemo(() => VOCABULARY_DATA.slice(0, 8), []);
  const currentListenTarget = listenPool[listenIdx % listenPool.length];
  const listenChoices = useMemo(() => {
    const others = listenPool.filter((i) => i.id !== currentListenTarget.id).slice(0, 3);
    return [currentListenTarget, ...others].sort((a, b) => a.word.localeCompare(b.word));
  }, [currentListenTarget, listenPool]);

  const activeCoachItem =
    COACH_WORDS.find((w) => w.word.toLowerCase() === targetWord.toLowerCase()) || {
      word: targetWord,
      phonetic: '',
      visualKey: 'star',
    };

  const submitEvaluation = async (opts: {
    recognizedText?: string;
    audioBase64?: string;
    mimeType?: string;
  }) => {
    setIsEvaluating(true);
    setCoachNotice('');
    try {
      const res = await fetch('/api/pronunciation/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetText: targetWord,
          recognizedText: opts.recognizedText,
          audioBase64: opts.audioBase64,
          mimeType: opts.mimeType,
          ageRange: state.user.ageRange,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          recognizedText: string;
          status: PronunciationAttempt['status'];
          feedback: string;
          focusSound?: string;
        };
        const attempt: PronunciationAttempt = {
          id: `pa-${Date.now()}`,
          targetText: targetWord,
          recognizedText: data.recognizedText || opts.recognizedText || targetWord,
          status: data.status || 'good',
          feedback: data.feedback,
          focusSound: data.focusSound,
          source: 'ai',
          attemptTimestamp: new Date().toISOString(),
        };
        setLatestResult(attempt);
        onRecordPronunciation(attempt);
        playToneFeedback('success', state.parentSettings.soundEffectsEnabled);
        setIsEvaluating(false);
        return;
      }
      setCoachNotice('Online AI coach is unavailable right now — using offline pronunciation guide.');
    } catch {
      setCoachNotice('You appear offline — using built-in pronunciation guide.');
    }

    // Explicit offline fallback
    const heuristic = evaluatePronunciationHeuristic(
      targetWord,
      opts.recognizedText || '',
      0.8
    );
    const attempt: PronunciationAttempt = {
      id: `pa-${Date.now()}`,
      targetText: targetWord,
      recognizedText: opts.recognizedText || '(voice clip)',
      status: heuristic.status,
      feedback: heuristic.feedback,
      focusSound: heuristic.focusSound,
      source: 'offline_fallback',
      attemptTimestamp: new Date().toISOString(),
    };
    setLatestResult(attempt);
    onRecordPronunciation(attempt);
    playToneFeedback(
      heuristic.status === 'great' || heuristic.status === 'good' ? 'success' : 'try_again',
      state.parentSettings.soundEffectsEnabled
    );
    setIsEvaluating(false);
  };

  const handleToggleRecord = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    // Try Web Speech API + MediaRecorder if available
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = String(reader.result || '').split(',')[1] || '';
            await submitEvaluation({
              audioBase64: base64,
              mimeType: recorder.mimeType || 'audio/webm',
              recognizedText: typedFallback || targetWord,
            });
          };
          reader.readAsDataURL(blob);
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
        return;
      } catch {
        // Microphone denied or unavailable in headless browser; try SpeechRecognition or guide user
      }
    }

    if (SpeechRec) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rec = new (SpeechRec as any)();
        rec.lang = 'en-US';
        setIsRecording(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (event: any) => {
          setIsRecording(false);
          const transcript = event.results?.[0]?.[0]?.transcript || '';
          submitEvaluation({ recognizedText: transcript });
        };
        rec.onerror = () => {
          setIsRecording(false);
          setCoachNotice('Microphone could not start here. You can type what you said below to test feedback!');
        };
        rec.start();
        return;
      } catch {
        setIsRecording(false);
      }
    }

    setCoachNotice('No microphone detected on this device. You can still listen or practice using the check box below!');
  };

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#302B45]">
            Practice Studio
          </h2>
          <p className="text-sm text-[#302B45]/75">
            Speak, trace letters, train your ears, and review tricky sounds
          </p>
        </div>

        {/* Segmented Sub-Tab Controls */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white border border-[#302B45]/10 rounded-2xl overflow-x-auto">
          {[
            { id: 'pronunciation', label: 'Pronunciation', icon: Mic },
            { id: 'tracing', label: 'Tracing', icon: PenTool },
            { id: 'listening', label: 'Listening', icon: Ear },
            { id: 'review', label: 'Smart Review', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as PracticeSubTab)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#7557D9] text-white'
                    : 'text-[#302B45]/75 hover:bg-[#FFF9EF]'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. AI PRONUNCIATION COACH */}
      {subTab === 'pronunciation' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-display font-bold text-xl text-[#302B45]">
                  AI Pronunciation Coach
                </h3>
                <p className="text-xs text-[#302B45]/70">
                  Listen first, then speak clearly. Every accent is welcome!
                </p>
              </div>
              <LumoMascot
                expression={isRecording ? 'surprised' : latestResult?.status === 'great' ? 'excited' : 'happy'}
                size={68}
              />
            </div>

            {/* Word chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
              {COACH_WORDS.map((item) => (
                <button
                  key={item.word}
                  type="button"
                  onClick={() => {
                    setTargetWord(item.word);
                    setLatestResult(null);
                  }}
                  className={`px-4 py-2 min-h-[40px] rounded-xl text-sm font-bold whitespace-nowrap shrink-0 transition-colors ${
                    targetWord.toLowerCase() === item.word.toLowerCase()
                      ? 'bg-[#7557D9] text-white'
                      : 'bg-[#FFF9EF] text-[#302B45] border border-[#302B45]/12'
                  }`}
                >
                  {item.word}
                </button>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 flex flex-col sm:flex-row items-center gap-6 mb-6">
              <div className="p-3 rounded-2xl bg-white border border-[#302B45]/8">
                <VisualIllustration visualKey={activeCoachItem.visualKey} size={84} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="font-display font-extrabold text-3xl text-[#302B45]">
                  {activeCoachItem.word}
                </h4>
                {activeCoachItem.phonetic && (
                  <p className="font-mono-phonetic text-sm text-[#7557D9] mt-0.5 mb-3">
                    {activeCoachItem.phonetic}
                  </p>
                )}
                <AudioControls text={activeCoachItem.word} label="Reference Voice" preferServerTTS />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
              <button
                type="button"
                onClick={handleToggleRecord}
                disabled={isEvaluating}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 min-h-[50px] rounded-2xl font-display font-bold text-base text-white transition-all ${
                  isRecording
                    ? 'bg-[#E05A5A] ring-4 ring-[#E05A5A]/25'
                    : 'bg-[#7557D9] hover:bg-[#6546ca]'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 fill-current" aria-hidden="true" />
                    <span>Stop & Evaluate</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" aria-hidden="true" />
                    <span>{isEvaluating ? 'Listening closely...' : 'Record Your Voice'}</span>
                  </>
                )}
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitEvaluation({ recognizedText: typedFallback });
                }}
                className="flex-1 w-full flex items-center gap-2"
              >
                <label htmlFor="spoken-practice-input" className="sr-only">
                  Practice word check
                </label>
                <input
                  id="spoken-practice-input"
                  type="text"
                  value={typedFallback}
                  onChange={(e) => setTypedFallback(e.target.value)}
                  placeholder="Or type what you said (e.g. Apple)"
                  className="flex-1 px-4 py-3 min-h-[46px] rounded-2xl border border-[#302B45]/15 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7557D9]"
                />
                <button
                  type="submit"
                  disabled={isEvaluating}
                  className="px-4 py-3 min-h-[46px] rounded-2xl bg-[#56C88A] text-white font-semibold text-sm hover:bg-[#49b67b] whitespace-nowrap shrink-0"
                >
                  Check
                </button>
              </form>
            </div>

            {coachNotice && (
              <p className="text-xs font-medium text-[#92400E] bg-[#FFD45A]/25 px-3.5 py-2 rounded-xl mb-4">
                {coachNotice}
              </p>
            )}

            {latestResult && (
              <div className="p-4 rounded-2xl bg-[#56C88A]/12 border border-[#56C88A]/35 animate-pop-in">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-display font-bold text-base text-[#1F5E3B] flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    {latestResult.status === 'great'
                      ? 'Wonderful Speech!'
                      : latestResult.status === 'good'
                        ? 'Great Effort!'
                        : 'Let’s Try Again Together'}
                  </span>
                  <span className="text-xs font-medium text-[#302B45]/65">
                    {latestResult.source === 'ai' ? 'AI Coach' : 'Offline Guide'}
                  </span>
                </div>
                <p className="text-sm text-[#302B45] leading-relaxed">{latestResult.feedback}</p>
                {latestResult.focusSound && (
                  <p className="text-xs font-semibold text-[#7557D9] mt-2">
                    Sound Spotlight: Practice the “{latestResult.focusSound}” sound slowly.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Attempt History */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#302B45]/10 p-6 shadow-sm">
            <h3 className="font-display font-bold text-lg text-[#302B45] mb-1">
              Recent Speaking Attempts
            </h3>
            <p className="text-xs text-[#302B45]/65 mb-4">
              Tracks your speaking confidence over time
            </p>
            {state.pronunciationHistory.length === 0 ? (
              <p className="text-sm text-[#302B45]/65 py-8 text-center">
                No recordings yet. Tap Record Your Voice to begin!
              </p>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {state.pronunciationHistory.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-[#302B45] text-sm font-display font-bold">
                        {item.targetText}
                      </span>
                      <span className="text-[#7557D9] capitalize">
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#302B45]/75">{item.feedback}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. LETTER TRACING STUDIO */}
      {subTab === 'tracing' && (
        <div className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display font-bold text-xl text-[#302B45]">
                Letter Tracing Studio
              </h3>
              <p className="text-sm text-[#302B45]/70">
                Choose any letter A–Z and trace along the dotted guide
              </p>
            </div>
            <AudioControls text={traceLetter} label={`Hear ${traceLetter}`} compact />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap mb-6">
            {ALPHABET_DATA.map((a) => (
              <button
                key={a.letter}
                type="button"
                onClick={() => setTraceLetter(a.letter)}
                className={`w-10 h-10 rounded-xl font-display font-bold text-sm border transition-colors ${
                  traceLetter === a.letter
                    ? 'bg-[#7557D9] text-white border-[#7557D9]'
                    : 'bg-[#FFF9EF] text-[#302B45] border-[#302B45]/12 hover:border-[#7557D9]/40'
                }`}
              >
                {a.letter}
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            <LetterTracingCanvas
              letter={traceLetter}
              onComplete={() => {
                playToneFeedback('success', state.parentSettings.soundEffectsEnabled);
                onPracticeLetter(traceLetter);
              }}
            />
          </div>
        </div>
      )}

      {/* 3. LISTENING LAB */}
      {subTab === 'listening' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display font-bold text-xl text-[#302B45]">
                Listening Comprehension Lab
              </h3>
              <p className="text-sm text-[#302B45]/70">
                Listen carefully and tap the matching picture!
              </p>
            </div>
            <AudioControls text={currentListenTarget.word} label="Play Word" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {listenChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => {
                  if (choice.id === currentListenTarget.id) {
                    playToneFeedback('success', state.parentSettings.soundEffectsEnabled);
                    setListenFeedback(`Yes! That is ${choice.word}.`);
                  } else {
                    playToneFeedback('try_again', state.parentSettings.soundEffectsEnabled);
                    setListenFeedback(`That is ${choice.word}. Listen again and find ${currentListenTarget.word}!`);
                  }
                }}
                className="p-5 rounded-2xl bg-[#FFF9EF] border-2 border-[#302B45]/10 hover:border-[#48B8E8] flex flex-col items-center gap-2 transition-all"
              >
                <VisualIllustration visualKey={choice.visualKey} size={64} />
                <span className="font-display font-bold text-base text-[#302B45]">
                  {choice.word}
                </span>
              </button>
            ))}
          </div>

          {listenFeedback && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#EDE9FE]/55">
              <p className="text-sm font-semibold text-[#302B45]">{listenFeedback}</p>
              <button
                type="button"
                onClick={() => {
                  setListenIdx((i) => i + 1);
                  setListenFeedback('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-[#7557D9] text-white font-semibold text-xs whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Next Sound</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. SMART REVIEW (B vs D + Word Breakdown) */}
      {subTab === 'review' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-[#302B45]/10 p-6 shadow-sm">
            <h3 className="font-display font-bold text-xl text-[#302B45] mb-1">
              B vs D Sound & Shape Helper
            </h3>
            <p className="text-sm text-[#302B45]/70 mb-5">
              Compare B and D side by side so they never feel confusing!
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-5 rounded-2xl bg-[#FFF9EF] border border-[#48B8E8]/35 text-center">
                <p className="font-display font-extrabold text-5xl text-[#48B8E8] mb-2">B b</p>
                <p className="text-sm font-bold text-[#302B45]">B is for Ball</p>
                <p className="text-xs text-[#302B45]/75 mt-1 mb-3">
                  Belly points right! Sound: /b/
                </p>
                <button
                  type="button"
                  onClick={() => speakEnglish('B. Ball. Buh.', { rate: 0.85 })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#48B8E8] text-white text-xs font-bold"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Hear B</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFF9EF] border border-[#56C88A]/35 text-center">
                <p className="font-display font-extrabold text-5xl text-[#56C88A] mb-2">D d</p>
                <p className="text-sm font-bold text-[#302B45]">D is for Dog</p>
                <p className="text-xs text-[#302B45]/75 mt-1 mb-3">
                  Back faces right! Sound: /d/
                </p>
                <button
                  type="button"
                  onClick={() => speakEnglish('D. Dog. Duh.', { rate: 0.85 })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#56C88A] text-white text-xs font-bold"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Hear D</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#302B45]/10 p-6 shadow-sm">
            <h3 className="font-display font-bold text-xl text-[#302B45] mb-1">
              Big Word Sound Chunks
            </h3>
            <p className="text-sm text-[#302B45]/70 mb-5">
              Tap each sound chunk to read longer words easily!
            </p>

            {['ELEPHANT', 'WATERMELON', 'BANANA'].map((word) => {
              const groups = splitWordIntoSoundGroups(word);
              return (
                <div
                  key={word}
                  className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8 mb-3 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {groups.map((g, i) => (
                      <button
                        key={`${word}-${g}-${i}`}
                        type="button"
                        onClick={() => speakEnglish(g.toLowerCase(), { rate: 0.75 })}
                        className="px-3.5 py-2 min-h-[40px] rounded-xl bg-white border border-[#7557D9]/25 font-display font-bold text-base text-[#7557D9] hover:bg-[#EDE9FE]"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <AudioControls text={word} label={word} compact />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
