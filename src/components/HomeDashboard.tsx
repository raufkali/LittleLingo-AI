import React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Coins,
  Flame,
  MessageCircle,
  Mic,
  Sparkles,
  Star,
} from 'lucide-react';
import { LEARNING_WORLDS } from '../data/curriculum';
import type {
  AppPersistedState,
  DailyMission,
  NavTab,
  PersonalizedRecommendation,
} from '../types/learning';
import {
  computeLevelFromXP,
  generatePersonalizedRecommendations,
} from '../utils/learningEngine';
import { LumoMascot } from './LumoMascot';

interface HomeDashboardProps {
  state: AppPersistedState;
  onNavigate: (tab: NavTab) => void;
  onStartLesson: (worldId: string, lessonId: string) => void;
  onOpenPracticeFocus: (subTab: 'pronunciation' | 'tracing' | 'listening' | 'review', focus?: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  state,
  onNavigate,
  onStartLesson,
  onOpenPracticeFocus,
}) => {
  const levelInfo = computeLevelFromXP(state.learning.totalXP);
  const completedCount = Object.keys(state.completedLessons).length;
  const recommendations: PersonalizedRecommendation[] = generatePersonalizedRecommendations(
    state,
    LEARNING_WORLDS
  );

  // Pick primary next lesson
  let primaryWorld = LEARNING_WORLDS[0];
  let primaryLesson = LEARNING_WORLDS[0].lessons[0];
  for (const w of LEARNING_WORLDS) {
    const next = w.lessons.find((l) => !state.completedLessons[l.id]);
    if (next) {
      primaryWorld = w;
      primaryLesson = next;
      break;
    }
  }

  const missions: DailyMission[] = [
    {
      id: 'm-lesson',
      title: 'Complete 1 adventure lesson',
      target: 1,
      current: Math.min(1, completedCount),
      rewardXP: 25,
      rewardCoins: 10,
      type: 'lessons',
    },
    {
      id: 'm-letters',
      title: 'Practice 5 letters in Alphabet Forest',
      target: 5,
      current: Math.min(5, state.masteredLetters.length),
      rewardXP: 20,
      rewardCoins: 10,
      type: 'letters',
    },
    {
      id: 'm-speak',
      title: 'Try 3 words in Pronunciation Coach',
      target: 3,
      current: Math.min(3, state.pronunciationHistory.length),
      rewardXP: 30,
      rewardCoins: 15,
      type: 'pronunciation',
    },
    {
      id: 'm-chat',
      title: 'Chat with Lumo AI Teacher (2 turns)',
      target: 2,
      current: Math.min(2, state.teacherTurnsCompleted),
      rewardXP: 25,
      rewardCoins: 10,
      type: 'teacher',
    },
  ];

  const handleRecommendationClick = (rec: PersonalizedRecommendation) => {
    if (rec.kind === 'confused_letters' || rec.kind === 'word_breakdown') {
      onOpenPracticeFocus('review', rec.focusTarget);
      return;
    }
    if (rec.targetTab === 'learn' && rec.focusTarget) {
      for (const w of LEARNING_WORLDS) {
        const found = w.lessons.find((l) => l.id === rec.focusTarget);
        if (found) {
          onStartLesson(w.id, found.id);
          return;
        }
      }
    }
    onNavigate(rec.targetTab);
  };

  return (
    <div className="space-y-8 animate-pop-in">
      {/* Hero Continue Learning Split */}
      <section className="grid lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-[#7557D9] mb-1">
                Level {levelInfo.level} · {state.user.ageRange} yrs · {state.learning.currentStreak}-day streak
              </p>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#302B45] leading-snug">
                Hello, {state.user.nickname}! Ready for today’s adventure?
              </h2>
            </div>
            <LumoMascot
              expression="happy"
              size={84}
              reducedMotion={state.parentSettings.reducedAnimations}
              className="shrink-0"
            />
          </div>

          <div className="p-5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#302B45]/65 mb-1">
                Recommended Next · {primaryWorld.title}
              </p>
              <h3 className="font-display font-bold text-xl text-[#302B45]">
                {primaryLesson.title}
              </h3>
              <p className="text-sm text-[#302B45]/75 mt-0.5">
                {primaryLesson.subtitle} · {primaryLesson.estimatedMinutes} min
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStartLesson(primaryWorld.id, primaryLesson.id)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-2xl bg-[#7557D9] text-white font-display font-bold text-base hover:bg-[#6546ca] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Reward & Progress Summary */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#302B45]/10 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-lg text-[#302B45]">Your Progress</h3>
              <span className="text-xs font-semibold text-[#7557D9] tabular-nums">
                {levelInfo.currentLevelXP} / {levelInfo.nextLevelXP} XP
              </span>
            </div>
            <div className="h-3 rounded-full bg-[#302B45]/10 overflow-hidden mb-5">
              <div
                className="h-full bg-[#7557D9] rounded-full transition-all duration-300"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#302B45]/70">
                  <Flame className="w-4 h-4 text-[#E05A5A]" aria-hidden="true" />
                  <span>Streak</span>
                </div>
                <p className="font-display font-extrabold text-2xl tabular-nums text-[#302B45] mt-1">
                  {state.learning.currentStreak}d
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#302B45]/70">
                  <Star className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
                  <span>Stars</span>
                </div>
                <p className="font-display font-extrabold text-2xl tabular-nums text-[#302B45] mt-1">
                  {state.learning.stars}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#302B45]/70">
                  <Coins className="w-4 h-4 text-[#56C88A]" aria-hidden="true" />
                  <span>Coins</span>
                </div>
                <p className="font-display font-extrabold text-2xl tabular-nums text-[#302B45] mt-1">
                  {state.learning.coins}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#302B45]/70">
                  <Award className="w-4 h-4 text-[#7557D9]" aria-hidden="true" />
                  <span>Letters</span>
                </div>
                <p className="font-display font-extrabold text-2xl tabular-nums text-[#302B45] mt-1">
                  {state.masteredLetters.length}/26
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Activity Shortcuts */}
      <section aria-label="Quick Activities" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('learn')}
          className="p-5 rounded-3xl bg-white border border-[#302B45]/10 text-left hover:border-[#56C88A] transition-all shadow-sm"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#56C88A]/18 text-[#1F5E3B] flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="font-display font-bold text-base text-[#302B45]">Alphabet & Worlds</h3>
          <p className="text-xs text-[#302B45]/70 mt-1">7 adventure worlds & stories</p>
        </button>

        <button
          type="button"
          onClick={() => onOpenPracticeFocus('pronunciation')}
          className="p-5 rounded-3xl bg-white border border-[#302B45]/10 text-left hover:border-[#48B8E8] transition-all shadow-sm"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#48B8E8]/18 text-[#0284C7] flex items-center justify-center mb-3">
            <Mic className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="font-display font-bold text-base text-[#302B45]">Pronunciation Coach</h3>
          <p className="text-xs text-[#302B45]/70 mt-1">Speak words & get kind feedback</p>
        </button>

        <button
          type="button"
          onClick={() => onOpenPracticeFocus('tracing')}
          className="p-5 rounded-3xl bg-white border border-[#302B45]/10 text-left hover:border-[#FFD45A] transition-all shadow-sm"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FFD45A]/30 text-[#92400E] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="font-display font-bold text-base text-[#302B45]">Letter Tracing</h3>
          <p className="text-xs text-[#302B45]/70 mt-1">Draw A–Z with guided strokes</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('teacher')}
          className="p-5 rounded-3xl bg-white border border-[#302B45]/10 text-left hover:border-[#7557D9] transition-all shadow-sm"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#7557D9]/15 text-[#7557D9] flex items-center justify-center mb-3">
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="font-display font-bold text-base text-[#302B45]">AI Teacher Lumo</h3>
          <p className="text-xs text-[#302B45]/70 mt-1">Safe English mini-chats</p>
        </button>
      </section>

      {/* Personalized AI Recommendations + Daily Missions */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-[#302B45]/10 p-6 shadow-sm">
          <h3 className="font-display font-bold text-xl text-[#302B45] mb-1">
            Picked Just for {state.user.nickname}
          </h3>
          <p className="text-sm text-[#302B45]/70 mb-5">
            Adaptive spaced repetition & sound helpers from Lumo
          </p>

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-display font-bold text-base text-[#302B45]">{rec.title}</h4>
                  <p className="text-xs text-[#302B45]/75 mt-0.5 leading-relaxed">{rec.reason}</p>
                  {rec.breakdownGroups && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {rec.breakdownGroups.map((grp, i) => (
                        <span
                          key={`${grp}-${i}`}
                          className="px-2.5 py-0.5 rounded-lg bg-white border border-[#7557D9]/25 font-display font-bold text-xs text-[#7557D9]"
                        >
                          {grp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRecommendationClick(rec)}
                  className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-[#7557D9] text-white font-semibold text-xs hover:bg-[#6546ca] whitespace-nowrap shrink-0"
                >
                  {rec.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#302B45]/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-xl text-[#302B45]">Daily Missions</h3>
              <p className="text-sm text-[#302B45]/70">Gentle daily goals without pressure</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="text-sm font-semibold text-[#7557D9] hover:underline whitespace-nowrap"
            >
              View Badges
            </button>
          </div>

          <div className="space-y-3">
            {missions.map((m) => {
              const pct = Math.round((m.current / m.target) * 100);
              const done = m.current >= m.target;
              return (
                <div key={m.id} className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8">
                  <div className="flex items-center justify-between gap-2 text-sm mb-2">
                    <span className="font-semibold text-[#302B45]">{m.title}</span>
                    <span className="text-xs font-bold tabular-nums text-[#7557D9]">
                      {done ? 'Done!' : `${m.current}/${m.target}`} · +{m.rewardXP} XP
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#302B45]/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        done ? 'bg-[#56C88A]' : 'bg-[#48B8E8]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
