import React, { useEffect, useState } from 'react';
import {
  Compass,
  Flame,
  Home,
  MessageCircle,
  Mic,
  Star,
  User,
} from 'lucide-react';
import type {
  AppPersistedState,
  NavTab,
  ParentSettings,
  PronunciationAttempt,
  SupportLanguage,
} from './types/learning';
import {
  computeLevelFromXP,
  computeUnlockedAchievements,
} from './utils/learningEngine';
import { clearAppState, loadAppState, saveAppState } from './utils/storage';
import { AITeacherChat } from './components/AITeacherChat';
import { HomeDashboard } from './components/HomeDashboard';
import { LearnWorldMap } from './components/LearnWorldMap';
import { OnboardingFlow } from './components/OnboardingFlow';
import { PracticeHub, type PracticeSubTab } from './components/PracticeHub';
import { ProfileAndParent } from './components/ProfileAndParent';

export default function App() {
  const [state, setState] = useState<AppPersistedState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [practiceSubTab, setPracticeSubTab] = useState<PracticeSubTab>('pronunciation');
  const [practiceFocus, setPracticeFocus] = useState<string | undefined>(undefined);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  if (!state.onboardingComplete) {
    return (
      <OnboardingFlow
        initialState={state}
        onComplete={(nextState) => {
          setState(nextState);
          setActiveTab('home');
        }}
      />
    );
  }

  const levelInfo = computeLevelFromXP(state.learning.totalXP);

  const handleStartLesson = (_worldId: string, lessonId: string) => {
    setActiveTab('learn');
    setActiveLessonId(lessonId);
  };

  const handleCompleteLesson = (payload: {
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
  }) => {
    setState((prev) => {
      const nextConfused = { ...prev.confusedLetters };
      payload.confusedPairs.forEach((p) => {
        nextConfused[p] = (nextConfused[p] || 0) + 1;
      });
      const nextMisspelled = { ...prev.misspelledWords };
      payload.misspelledWords.forEach((w) => {
        nextMisspelled[w] = (nextMisspelled[w] || 0) + 1;
      });

      const nextLetters = Array.from(
        new Set([...prev.masteredLetters, ...payload.masteredLetters])
      );
      const nextWords = Array.from(
        new Set([...prev.masteredWords, ...payload.masteredWords])
      );
      const nextTotalXP = prev.learning.totalXP + payload.xpEarned;
      const nextLevel = computeLevelFromXP(nextTotalXP).level;

      const updated: AppPersistedState = {
        ...prev,
        learning: {
          ...prev.learning,
          totalXP: nextTotalXP,
          currentLevel: nextLevel,
          stars: prev.learning.stars + payload.starsEarned,
          coins: prev.learning.coins + payload.coinsEarned,
          totalMinutesLearned: prev.learning.totalMinutesLearned + 4,
        },
        completedLessons: {
          ...prev.completedLessons,
          [payload.lessonId]: {
            lessonId: payload.lessonId,
            worldId: payload.worldId,
            completionStatus: 'completed',
            score: payload.score,
            totalQuestions: payload.totalQuestions,
            starsEarned: payload.starsEarned,
            completedAt: new Date().toISOString(),
          },
        },
        masteredLetters: nextLetters,
        masteredWords: nextWords,
        confusedLetters: nextConfused,
        misspelledWords: nextMisspelled,
      };
      updated.unlockedAchievements = computeUnlockedAchievements(updated);
      return updated;
    });

    // Fire-and-forget sync to backend when online
    fetch('/api/progress/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: state.user.id,
        lessonId: payload.lessonId,
        correctCount: payload.score,
        totalCount: payload.totalQuestions,
        currentStreak: state.learning.currentStreak,
      }),
    }).catch(() => {
      // Offline-first: local progress is already saved
    });
  };

  const handlePracticeLetter = (letter: string) => {
    setState((prev) => {
      if (prev.masteredLetters.includes(letter)) return prev;
      const updated: AppPersistedState = {
        ...prev,
        masteredLetters: [...prev.masteredLetters, letter],
        learning: {
          ...prev.learning,
          totalXP: prev.learning.totalXP + 5,
        },
      };
      updated.unlockedAchievements = computeUnlockedAchievements(updated);
      return updated;
    });
  };

  const handleMasterWord = (word: string) => {
    setState((prev) => {
      if (prev.masteredWords.includes(word)) return prev;
      const updated: AppPersistedState = {
        ...prev,
        masteredWords: [...prev.masteredWords, word],
        learning: {
          ...prev.learning,
          totalXP: prev.learning.totalXP + 5,
        },
      };
      updated.unlockedAchievements = computeUnlockedAchievements(updated);
      return updated;
    });
  };

  const handleRecordPronunciation = (attempt: PronunciationAttempt) => {
    setState((prev) => {
      const updated: AppPersistedState = {
        ...prev,
        pronunciationHistory: [attempt, ...prev.pronunciationHistory].slice(0, 30),
        learning: {
          ...prev.learning,
          totalXP: prev.learning.totalXP + 10,
          coins: prev.learning.coins + 5,
        },
      };
      updated.unlockedAchievements = computeUnlockedAchievements(updated);
      return updated;
    });
  };

  const handleCompleteStory = (storyId: string) => {
    setState((prev) => {
      const stories = Array.from(new Set([...prev.completedStoryIds, storyId]));
      const updated: AppPersistedState = {
        ...prev,
        completedStoryIds: stories,
        learning: {
          ...prev.learning,
          totalXP: prev.learning.totalXP + 30,
          coins: prev.learning.coins + 15,
          stars: prev.learning.stars + 2,
        },
      };
      updated.unlockedAchievements = computeUnlockedAchievements(updated);
      return updated;
    });
  };

  const handleTeacherTurn = () => {
    setState((prev) => {
      const updated: AppPersistedState = {
        ...prev,
        teacherTurnsCompleted: prev.teacherTurnsCompleted + 1,
        learning: {
          ...prev.learning,
          totalXP: prev.learning.totalXP + 8,
        },
      };
      updated.unlockedAchievements = computeUnlockedAchievements(updated);
      return updated;
    });
  };

  const handleUpdateSettings = (next: Partial<ParentSettings>) => {
    setState((prev) => ({
      ...prev,
      parentSettings: { ...prev.parentSettings, ...next },
    }));
  };

  const handleUpdateLanguage = (preferredLanguage: SupportLanguage) => {
    setState((prev) => ({
      ...prev,
      user: { ...prev.user, preferredLanguage },
    }));
  };

  const handleToggleDownloadWorld = (worldId: string) => {
    setState((prev) => {
      const exists = prev.downloadedWorldIds.includes(worldId);
      return {
        ...prev,
        downloadedWorldIds: exists
          ? prev.downloadedWorldIds.filter((id) => id !== worldId)
          : [...prev.downloadedWorldIds, worldId],
      };
    });
  };

  const handleDeleteAccount = () => {
    clearAppState();
    setState(loadAppState());
    setActiveTab('home');
    setActiveLessonId(null);
  };

  const navItems: Array<{ id: NavTab; label: string; icon: typeof Home }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: Compass },
    { id: 'practice', label: 'Practice', icon: Mic },
    { id: 'teacher', label: 'AI Teacher', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#302B45] pb-20 md:pb-10">
      {/* Desktop & Mobile Top Navigation Header (3-zone contract on desktop, compact 52px on mobile) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#302B45]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              setActiveLessonId(null);
            }}
            className="font-display font-extrabold text-xl tracking-tight text-[#7557D9] whitespace-nowrap shrink-0"
          >
            LittleLingo AI
          </button>

          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'learn') setActiveLessonId(null);
                  }}
                  className={`text-sm font-semibold py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-[#7557D9] border-[#7557D9]'
                      : 'text-[#302B45]/70 border-transparent hover:text-[#302B45]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#302B45]/80 tabular-nums whitespace-nowrap">
              <Flame className="w-4 h-4 text-[#E05A5A]" aria-hidden="true" />
              {state.learning.currentStreak}d
              <span aria-hidden="true">·</span>
              <Star className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
              {state.learning.totalXP} XP
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('learn');
                setActiveLessonId(null);
              }}
              className="px-4 py-2 min-h-[40px] rounded-xl bg-[#7557D9] text-white font-semibold text-xs hover:bg-[#6546ca] whitespace-nowrap shrink-0"
            >
              Lvl {levelInfo.level} · Play
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'home' && (
          <HomeDashboard
            state={state}
            onNavigate={(tab) => {
              setActiveTab(tab);
              setActiveLessonId(null);
            }}
            onStartLesson={handleStartLesson}
            onOpenPracticeFocus={(subTab, focus) => {
              setPracticeSubTab(subTab);
              setPracticeFocus(focus);
              setActiveTab('practice');
            }}
          />
        )}

        {activeTab === 'learn' && (
          <LearnWorldMap
            state={state}
            activeLessonId={activeLessonId}
            onSelectLesson={setActiveLessonId}
            onCompleteLesson={handleCompleteLesson}
            onPracticeLetter={handlePracticeLetter}
            onMasterWord={handleMasterWord}
            onCompleteStory={handleCompleteStory}
            onOpenTeacher={() => setActiveTab('teacher')}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeHub
            state={state}
            initialSubTab={practiceSubTab}
            initialFocus={practiceFocus}
            onRecordPronunciation={handleRecordPronunciation}
            onPracticeLetter={handlePracticeLetter}
          />
        )}

        {activeTab === 'teacher' && (
          <AITeacherChat state={state} onTeacherTurn={handleTeacherTurn} />
        )}

        {activeTab === 'profile' && (
          <ProfileAndParent
            state={state}
            onUpdateSettings={handleUpdateSettings}
            onUpdateLanguage={handleUpdateLanguage}
            onToggleDownloadWorld={handleToggleDownloadWorld}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Thumb Tab Bar (< 15% viewport height) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-[#302B45]/10 grid grid-cols-5 items-center"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                if (item.id !== 'learn') setActiveLessonId(null);
              }}
              className={`flex flex-col items-center justify-center h-full gap-0.5 text-[11px] font-semibold transition-colors ${
                active ? 'text-[#7557D9]' : 'text-[#302B45]/65'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
