import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Mic, Volume2 } from 'lucide-react';
import type { StoryAdventure } from '../types/learning';
import { playToneFeedback, speakEnglish } from '../utils/audioSpeech';
import { LumoMascot } from './LumoMascot';
import { VisualIllustration } from './VisualIllustration';

interface StoryReaderProps {
  story: StoryAdventure;
  soundEffectsEnabled: boolean;
  onExit: () => void;
  onCompleteStory: (storyId: string) => void;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  story,
  soundEffectsEnabled,
  onExit,
  onCompleteStory,
}) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [phase, setPhase] = useState<'reading' | 'quiz' | 'done'>('reading');
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);
  const [repeatPracticed, setRepeatPracticed] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState('');
  const [quizFeedback, setQuizFeedback] = useState('');

  const currentPage = story.pages[pageIndex];
  const currentQuestion = story.comprehensionQuestions[quizIndex];
  const words = currentPage ? currentPage.text.split(/\s+/) : [];

  const handleReadAloud = () => {
    if (!currentPage) return;
    setActiveWordIdx(0);
    speakEnglish(currentPage.text, {
      rate: 0.88,
      onWordBoundary: (idx) => setActiveWordIdx(idx),
      onEnd: () => setActiveWordIdx(null),
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-pop-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl bg-white border border-[#302B45]/12 text-sm font-semibold text-[#302B45] hover:bg-[#FFF9EF]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Story Cove</span>
        </button>
        <span className="text-sm font-semibold text-[#7557D9]">
          {story.theme} · {story.readingMinutes} min
        </span>
      </div>

      {phase === 'reading' && currentPage && (
        <div className="bg-white rounded-3xl border border-[#302B45]/10 overflow-hidden shadow-sm">
          <div className="grid md:grid-cols-5 items-stretch">
            <div className="md:col-span-2 bg-[#FFF9EF] flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-[#302B45]/8">
              <img
                src={story.coverImage}
                alt={story.title}
                referrerPolicy="no-referrer"
                className="w-full h-44 object-cover rounded-2xl mb-4"
              />
              <VisualIllustration visualKey={currentPage.illustrationKey} size={72} />
            </div>

            <div className="md:col-span-3 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-semibold text-[#302B45]/60 mb-2">
                  {story.title} · Page {pageIndex + 1} of {story.pages.length}
                </p>

                {/* Word-by-word highlighted story text */}
                <p className="font-display font-semibold text-2xl leading-relaxed text-[#302B45] mb-6">
                  {words.map((w, idx) => {
                    const clean = w.toLowerCase().replace(/[.,!?"']/g, '');
                    const isNewVocab = currentPage.highlightWords.includes(clean);
                    const isSpokenNow = activeWordIdx === idx;
                    return (
                      <span
                        key={`${w}-${idx}`}
                        className={`inline-block mr-1.5 px-1 rounded-lg transition-colors ${
                          isSpokenNow
                            ? 'bg-[#FFD45A] text-[#302B45]'
                            : isNewVocab
                              ? 'bg-[#EDE9FE] text-[#7557D9]'
                              : ''
                        }`}
                      >
                        {w}
                      </span>
                    );
                  })}
                </p>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={handleReadAloud}
                    className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-2xl bg-[#48B8E8] text-white font-semibold text-sm hover:bg-[#3aa5d4]"
                  >
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                    <span>Read Aloud</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      speakEnglish(currentPage.repeatPrompt, { rate: 0.85 });
                      setRepeatPracticed(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl bg-[#FFF9EF] border border-[#302B45]/15 text-sm font-semibold text-[#302B45]"
                  >
                    <Mic className="w-4 h-4 text-[#7557D9]" aria-hidden="true" />
                    <span>Repeat: “{currentPage.repeatPrompt}”</span>
                  </button>
                </div>

                {repeatPracticed && (
                  <p className="text-xs font-semibold text-[#2B8A57]">
                    Nice read-along practice! Keep going to the next page.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#302B45]/10">
                <button
                  type="button"
                  disabled={pageIndex === 0}
                  onClick={() => {
                    setPageIndex((p) => p - 1);
                    setActiveWordIdx(null);
                    setRepeatPracticed(false);
                  }}
                  className="px-4 py-2.5 min-h-[44px] rounded-2xl border border-[#302B45]/15 text-sm font-semibold disabled:opacity-35"
                >
                  Previous Page
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveWordIdx(null);
                    setRepeatPracticed(false);
                    if (pageIndex + 1 < story.pages.length) {
                      setPageIndex((p) => p + 1);
                    } else {
                      setPhase('quiz');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-2xl bg-[#7557D9] text-white font-bold text-sm hover:bg-[#6546ca]"
                >
                  <span>
                    {pageIndex + 1 < story.pages.length ? 'Next Page' : 'Story Quiz'}
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'quiz' && currentQuestion && (
        <div className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <LumoMascot expression="thinking" size={64} />
            <div>
              <p className="text-xs font-semibold text-[#7557D9]">
                Story Check · Question {quizIndex + 1} of {story.comprehensionQuestions.length}
              </p>
              <h3 className="font-display font-bold text-xl text-[#302B45]">
                {currentQuestion.question}
              </h3>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setSelectedOpt(opt);
                  if (opt === currentQuestion.expectedAnswer) {
                    playToneFeedback('success', soundEffectsEnabled);
                    setQuizFeedback(currentQuestion.explanation);
                  } else {
                    playToneFeedback('try_again', soundEffectsEnabled);
                    setQuizFeedback('Good try! Think back to the story pictures and try another choice.');
                  }
                }}
                className={`w-full p-4 min-h-[52px] rounded-2xl border-2 text-left font-semibold text-base transition-all ${
                  selectedOpt === opt
                    ? opt === currentQuestion.expectedAnswer
                      ? 'border-[#56C88A] bg-[#56C88A]/12 text-[#1F5E3B]'
                      : 'border-[#FFD45A] bg-[#FFD45A]/20 text-[#302B45]'
                    : 'border-[#302B45]/12 bg-white hover:border-[#7557D9]/40'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {quizFeedback && (
            <p className="text-sm font-medium text-[#302B45]/85 p-4 rounded-2xl bg-[#FFF9EF] mb-6">
              {quizFeedback}
            </p>
          )}

          {selectedOpt === currentQuestion.expectedAnswer && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedOpt('');
                  setQuizFeedback('');
                  if (quizIndex + 1 < story.comprehensionQuestions.length) {
                    setQuizIndex((q) => q + 1);
                  } else {
                    playToneFeedback('celebrate', soundEffectsEnabled);
                    setPhase('done');
                    onCompleteStory(story.id);
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-2xl bg-[#56C88A] text-white font-bold text-sm"
              >
                <span>
                  {quizIndex + 1 < story.comprehensionQuestions.length
                    ? 'Next Question'
                    : 'Collect Story Reward'}
                </span>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-white rounded-3xl border border-[#302B45]/10 p-8 text-center shadow-sm">
          <div className="flex justify-center mb-4">
            <LumoMascot expression="celebrating" size={110} />
          </div>
          <BookOpen className="w-8 h-8 text-[#7557D9] mx-auto mb-2" aria-hidden="true" />
          <h3 className="font-display font-extrabold text-2xl text-[#302B45] mb-2">
            Story Finished!
          </h3>
          <p className="text-base text-[#302B45]/75 mb-6">
            You learned {story.newVocabulary.length} story words and earned +30 XP and +15 Coins!
          </p>
          <button
            type="button"
            onClick={onExit}
            className="px-7 py-3.5 min-h-[48px] rounded-2xl bg-[#7557D9] text-white font-display font-bold text-base"
          >
            Explore More Stories
          </button>
        </div>
      )}
    </div>
  );
};
