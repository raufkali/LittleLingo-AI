import React, { useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, CloudDownload, Play } from 'lucide-react';
import { LEARNING_WORLDS, STORY_ADVENTURES } from '../data/curriculum';
import type { AppPersistedState, Lesson, StoryAdventure } from '../types/learning';
import { AlphabetExplorer } from './AlphabetExplorer';
import { LessonEngine } from './LessonEngine';
import { StoryReader } from './StoryReader';
import { VocabularyFlashcards } from './VocabularyFlashcards';

interface LearnWorldMapProps {
  state: AppPersistedState;
  activeLessonId: string | null;
  onSelectLesson: (lessonId: string | null) => void;
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
  onPracticeLetter: (letter: string) => void;
  onMasterWord: (word: string) => void;
  onCompleteStory: (storyId: string) => void;
  onOpenTeacher: () => void;
}

const renderWorldSvgScene = (worldId: string) => {
  if (worldId === 'world-wordbuilder') {
    return (
      <div className="h-28 w-full bg-gradient-to-br from-[#7557D9] to-[#5B3CC4] flex items-center justify-center gap-2.5 px-4">
        {['C', 'A', 'T'].map((ch, idx) => (
          <div
            key={ch}
            className="w-11 h-12 rounded-xl bg-white text-[#302B45] font-display font-extrabold text-xl flex items-center justify-center shadow-sm border-b-4 border-[#FFD45A]"
            style={{ transform: idx === 1 ? 'translateY(-4px)' : 'none' }}
          >
            {ch}
          </div>
        ))}
      </div>
    );
  }
  if (worldId === 'world-sentence') {
    return (
      <div className="h-28 w-full bg-gradient-to-br from-[#48B8E8] to-[#2B8FC2] flex items-center justify-center gap-2 px-4">
        {['I', 'am', 'happy'].map((w) => (
          <span
            key={w}
            className="px-3 py-1.5 rounded-xl bg-white/95 text-[#302B45] font-display font-bold text-sm shadow-sm"
          >
            {w}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="h-28 w-full bg-gradient-to-br from-[#56C88A] to-[#34A86B] flex items-center justify-center gap-3 px-4">
      <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm bg-white text-[#302B45] font-display font-bold text-xs shadow-sm">
        Hello!
      </div>
      <div className="px-3.5 py-2 rounded-2xl rounded-br-sm bg-[#FFD45A] text-[#302B45] font-display font-bold text-xs shadow-sm translate-y-2">
        How are you?
      </div>
    </div>
  );
};

export const LearnWorldMap: React.FC<LearnWorldMapProps> = ({
  state,
  activeLessonId,
  onSelectLesson,
  onCompleteLesson,
  onPracticeLetter,
  onMasterWord,
  onCompleteStory,
  onOpenTeacher,
}) => {
  const [selectedWorldId, setSelectedWorldId] = useState<string>(
    state.learning.startingWorldId || 'world-alphabet'
  );
  const [activeStory, setActiveStory] = useState<StoryAdventure | null>(null);

  // If a lesson is currently active, render LessonEngine
  if (activeLessonId) {
    let foundLesson: Lesson | undefined;
    let foundWorldTitle = '';
    for (const w of LEARNING_WORLDS) {
      const l = w.lessons.find((item) => item.id === activeLessonId);
      if (l) {
        foundLesson = l;
        foundWorldTitle = w.title;
        break;
      }
    }
    if (foundLesson) {
      return (
        <LessonEngine
          lesson={foundLesson}
          worldTitle={foundWorldTitle}
          currentStreak={state.learning.currentStreak}
          soundEffectsEnabled={state.parentSettings.soundEffectsEnabled}
          onExit={() => onSelectLesson(null)}
          onCompleteLesson={onCompleteLesson}
        />
      );
    }
  }

  // If a story is currently active, render StoryReader
  if (activeStory) {
    return (
      <StoryReader
        story={activeStory}
        soundEffectsEnabled={state.parentSettings.soundEffectsEnabled}
        onExit={() => setActiveStory(null)}
        onCompleteStory={onCompleteStory}
      />
    );
  }

  const activeWorld =
    LEARNING_WORLDS.find((w) => w.id === selectedWorldId) || LEARNING_WORLDS[0];

  return (
    <div className="space-y-8 animate-pop-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#302B45]">
            Adventure Learning Map
          </h2>
          <p className="text-sm text-[#302B45]/75 mt-1">
            7 interactive English worlds from A–Z letters to full stories
          </p>
        </div>
      </div>

      {/* World Selector Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {LEARNING_WORLDS.map((world) => {
          const isSelected = world.id === activeWorld.id;
          const totalInWorld = world.lessons.length;
          const completedInWorld = world.lessons.filter(
            (l) => Boolean(state.completedLessons[l.id])
          ).length;
          const isDownloaded = state.downloadedWorldIds.includes(world.id);

          return (
            <button
              key={world.id}
              type="button"
              onClick={() => setSelectedWorldId(world.id)}
              className={`rounded-3xl border-2 text-left overflow-hidden transition-all bg-white flex flex-col justify-between ${
                isSelected
                  ? 'border-[#7557D9] ring-4 ring-[#7557D9]/15 shadow-sm'
                  : 'border-[#302B45]/10 hover:border-[#7557D9]/40'
              }`}
            >
              {world.bannerImage ? (
                <div className="h-28 w-full overflow-hidden bg-[#FFF9EF]">
                  <img
                    src={world.bannerImage}
                    alt={world.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                renderWorldSvgScene(world.id)
              )}

              <div className="p-4">
                <p className="text-xs font-semibold text-[#7557D9]">{world.subtitle}</p>
                <h3 className="font-display font-bold text-lg text-[#302B45] mt-0.5">
                  {world.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-[#302B45]/70 mt-2">
                  <span>
                    {world.id === 'world-story'
                      ? `${state.completedStoryIds.length}/${STORY_ADVENTURES.length} stories`
                      : `${completedInWorld}/${totalInWorld} lessons`}
                  </span>
                  {isDownloaded && (
                    <span className="inline-flex items-center gap-1 text-[#2B8A57] font-semibold">
                      <CloudDownload className="w-3.5 h-3.5" aria-hidden="true" />
                      Offline
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* 8th Symmetric Card: AI Teacher Lumo Speaking Club */}
        <button
          type="button"
          onClick={onOpenTeacher}
          className="rounded-3xl border-2 border-[#302B45]/10 hover:border-[#7557D9]/45 text-left overflow-hidden transition-all bg-white flex flex-col justify-between"
        >
          <div className="h-28 w-full bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] flex items-center justify-center px-4">
            <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl shadow-sm">
              <span className="font-display font-extrabold text-base text-[#7557D9]">Lumo AI</span>
              <span className="text-xs text-[#302B45]/70">“Let’s talk!”</span>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-[#7557D9]">Bonus · Live Tutor</p>
            <h3 className="font-display font-bold text-lg text-[#302B45] mt-0.5">
              Speak with Lumo
            </h3>
            <div className="flex items-center justify-between text-xs text-[#302B45]/70 mt-2">
              <span>6 safe conversation topics</span>
            </div>
          </div>
        </button>
      </div>

      {/* Selected World Overview & Lessons */}
      <section className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#302B45]/10 mb-6">
          <div>
            <p className="text-xs font-semibold text-[#7557D9] mb-1">{activeWorld.subtitle}</p>
            <h3 className="font-display font-extrabold text-2xl text-[#302B45]">
              {activeWorld.title}
            </h3>
            <p className="text-sm text-[#302B45]/75 mt-1 max-w-2xl leading-relaxed">
              {activeWorld.description}
            </p>
          </div>
          {activeWorld.lessons.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const next =
                  activeWorld.lessons.find((l) => !state.completedLessons[l.id]) ||
                  activeWorld.lessons[0];
                onSelectLesson(next.id);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-2xl bg-[#7557D9] text-white font-display font-bold text-sm hover:bg-[#6546ca] whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>Play Next Lesson</span>
            </button>
          )}
        </div>

        {/* Lessons List */}
        {activeWorld.lessons.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeWorld.lessons.map((lesson) => {
              const progress = state.completedLessons[lesson.id];
              return (
                <div
                  key={lesson.id}
                  className="p-5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#302B45]/65 mb-2">
                      <span>
                        Lesson {lesson.sequence} · {lesson.estimatedMinutes} min
                      </span>
                      {progress && (
                        <span className="inline-flex items-center gap-1 text-[#2B8A57]">
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          {progress.starsEarned}/3 Stars
                        </span>
                      )}
                    </div>
                    <h4 className="font-display font-bold text-lg text-[#302B45]">
                      {lesson.title}
                    </h4>
                    <p className="text-xs text-[#302B45]/75 mt-1">{lesson.subtitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectLesson(lesson.id)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white border border-[#302B45]/15 font-semibold text-sm text-[#302B45] hover:border-[#7557D9] hover:text-[#7557D9]"
                  >
                    <span>{progress ? 'Replay Lesson' : 'Start Lesson'}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* World 7: Story Cove List */}
        {activeWorld.id === 'world-story' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STORY_ADVENTURES.map((story) => {
              const isRead = state.completedStoryIds.includes(story.id);
              return (
                <div
                  key={story.id}
                  className="rounded-2xl border border-[#302B45]/12 bg-[#FFF9EF] overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <p className="text-xs font-semibold text-[#7557D9]">
                        {story.theme} · {story.readingMinutes} min
                      </p>
                      <h4 className="font-display font-bold text-lg text-[#302B45] mt-1">
                        {story.title}
                      </h4>
                      <p className="text-xs text-[#302B45]/75 mt-1">
                        New words: {story.newVocabulary.slice(0, 5).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => setActiveStory(story)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#7557D9] text-white font-semibold text-sm hover:bg-[#6546ca]"
                    >
                      <BookOpen className="w-4 h-4" aria-hidden="true" />
                      <span>{isRead ? 'Read Again' : 'Read Story'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* World 1 Bonus: Complete 26-Letter Interactive Alphabet Board */}
      {activeWorld.id === 'world-alphabet' && (
        <AlphabetExplorer
          masteredLetters={state.masteredLetters}
          onPracticeLetter={onPracticeLetter}
        />
      )}

      {/* World 3 Bonus: Complete 9-Category Vocabulary Flashcards */}
      {activeWorld.id === 'world-vocab' && (
        <VocabularyFlashcards
          preferredLanguage={state.user.preferredLanguage}
          masteredWords={state.masteredWords}
          onMasterWord={onMasterWord}
        />
      )}
    </div>
  );
};
