import React, { useState } from 'react';
import {
  Award,
  Check,
  CloudDownload,
  Download,
  HelpCircle,
  Lock,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  Unlock,
} from 'lucide-react';
import { ACHIEVEMENTS, LEARNING_WORLDS } from '../data/curriculum';
import type { AppPersistedState, ParentSettings, SupportLanguage } from '../types/learning';
import { computeLevelFromXP } from '../utils/learningEngine';
import { LumoMascot } from './LumoMascot';

interface ProfileAndParentProps {
  state: AppPersistedState;
  onUpdateSettings: (next: Partial<ParentSettings>) => void;
  onUpdateLanguage: (lang: SupportLanguage) => void;
  onToggleDownloadWorld: (worldId: string) => void;
  onDeleteAccount: () => void;
}

type ProfileSection = 'badges' | 'downloads' | 'settings' | 'parent' | 'help';

export const ProfileAndParent: React.FC<ProfileAndParentProps> = ({
  state,
  onUpdateSettings,
  onUpdateLanguage,
  onToggleDownloadWorld,
  onDeleteAccount,
}) => {
  const [section, setSection] = useState<ProfileSection>('badges');
  const [pinAttempt, setPinAttempt] = useState('');
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const levelInfo = computeLevelFromXP(state.learning.totalXP);
  const completedLessonsCount = Object.keys(state.completedLessons).length;
  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleUnlockParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinAttempt === state.user.parentPin || pinAttempt === '1234') {
      setParentUnlocked(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Try your 4-digit parent PIN (demo default: 1234).');
    }
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `littlelingo-${state.user.nickname.toLowerCase()}-progress.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-pop-in">
      {/* Child Profile Header Card */}
      <section className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <LumoMascot expression="happy" size={76} />
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#302B45]">
              {state.user.nickname}
            </h2>
            <p className="text-sm text-[#302B45]/75 mt-0.5">
              Level {levelInfo.level} · Ages {state.user.ageRange} · {state.learning.totalXP} XP ·{' '}
              {state.unlockedAchievements.length}/{ACHIEVEMENTS.length} Badges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'badges', label: 'Achievements', icon: Award },
            { id: 'downloads', label: 'Offline Packs', icon: CloudDownload },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
            { id: 'parent', label: 'Parent Dashboard', icon: Shield },
            { id: 'help', label: 'Help', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id as ProfileSection)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#7557D9] text-white'
                    : 'bg-[#FFF9EF] text-[#302B45] border border-[#302B45]/12 hover:border-[#7557D9]/40'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 1. ACHIEVEMENTS */}
      {section === 'badges' && (
        <section className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm">
          <h3 className="font-display font-bold text-xl text-[#302B45] mb-1">
            Achievement Collection
          </h3>
          <p className="text-sm text-[#302B45]/70 mb-6">
            Earn badges and coins as you explore letters, words, stories, and speaking!
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = state.unlockedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    unlocked
                      ? 'bg-[#FFF9EF] border-[#FFD45A] shadow-sm'
                      : 'bg-white border-[#302B45]/10 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-display font-bold text-lg text-[#302B45]">
                      {ach.title}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        unlocked ? 'text-[#2B8A57]' : 'text-[#302B45]/55'
                      }`}
                    >
                      {unlocked ? 'Unlocked' : `+${ach.rewardCoins} Coins`}
                    </span>
                  </div>
                  <p className="text-xs text-[#302B45]/75 leading-relaxed">{ach.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. OFFLINE DOWNLOADS */}
      {section === 'downloads' && (
        <section className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm">
          <h3 className="font-display font-bold text-xl text-[#302B45] mb-1">
            Offline Lesson Packages
          </h3>
          <p className="text-sm text-[#302B45]/70 mb-6">
            Save worlds locally on this device so lessons and voice fallback work without internet.
          </p>

          <div className="space-y-3">
            {LEARNING_WORLDS.map((w) => {
              const downloaded = state.downloadedWorldIds.includes(w.id);
              return (
                <div
                  key={w.id}
                  className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-display font-bold text-base text-[#302B45]">
                      {w.title}
                    </h4>
                    <p className="text-xs text-[#302B45]/70">
                      {w.subtitle} · ~2.4 MB cached illustrations & audio prompts
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleDownloadWorld(w.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold whitespace-nowrap shrink-0 ${
                      downloaded
                        ? 'bg-[#56C88A]/18 text-[#1F5E3B]'
                        : 'bg-[#7557D9] text-white hover:bg-[#6546ca]'
                    }`}
                  >
                    {downloaded ? (
                      <>
                        <Check className="w-4 h-4" aria-hidden="true" />
                        <span>Saved Offline (Remove)</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" aria-hidden="true" />
                        <span>Download Pack</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. CHILD & AUDIO SETTINGS */}
      {section === 'settings' && (
        <section className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h3 className="font-display font-bold text-xl text-[#302B45]">
              Sound, Speed & Language Settings
            </h3>
            <p className="text-sm text-[#302B45]/70">
              Customize LittleLingo AI for comfortable reading and listening
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 cursor-pointer">
              <span className="font-semibold text-sm">Sound Effects & Chimes</span>
              <input
                type="checkbox"
                checked={state.parentSettings.soundEffectsEnabled}
                onChange={(e) => onUpdateSettings({ soundEffectsEnabled: e.target.checked })}
                className="w-5 h-5 accent-[#7557D9]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 cursor-pointer">
              <span className="font-semibold text-sm">Auto-Play Lumo Voice</span>
              <input
                type="checkbox"
                checked={state.parentSettings.autoPlayAudio}
                onChange={(e) => onUpdateSettings({ autoPlayAudio: e.target.checked })}
                className="w-5 h-5 accent-[#7557D9]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 cursor-pointer">
              <span className="font-semibold text-sm">Reduced Motion</span>
              <input
                type="checkbox"
                checked={state.parentSettings.reducedAnimations}
                onChange={(e) => onUpdateSettings({ reducedAnimations: e.target.checked })}
                className="w-5 h-5 accent-[#7557D9]"
              />
            </label>

            <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 flex items-center justify-between gap-3">
              <span className="font-semibold text-sm">Speech Speed</span>
              <div className="flex gap-1.5">
                {(['normal', 'slow'] as const).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => onUpdateSettings({ speechSpeed: sp })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${
                      state.parentSettings.speechSpeed === sp
                        ? 'bg-[#7557D9] text-white'
                        : 'bg-white border border-[#302B45]/15'
                    }`}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="block max-w-sm">
            <span className="block font-semibold text-sm mb-1.5">
              Translation Support Language
            </span>
            <select
              value={state.user.preferredLanguage}
              onChange={(e) => onUpdateLanguage(e.target.value as SupportLanguage)}
              className="w-full px-4 py-3 rounded-2xl border border-[#302B45]/20 bg-white text-sm font-medium"
            >
              <option value="en">English Only</option>
              <option value="es">Spanish (Español)</option>
              <option value="ar">Arabic (العربية)</option>
              <option value="bn">Bengali (বাংলা)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="fr">French (Français)</option>
              <option value="zh">Chinese (中文)</option>
            </select>
          </label>
        </section>
      )}

      {/* 4. PIN-PROTECTED PARENT DASHBOARD & PRIVACY */}
      {section === 'parent' && (
        <section className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm">
          {!parentUnlocked ? (
            <form onSubmit={handleUnlockParent} className="max-w-md mx-auto text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-[#7557D9]/15 text-[#7557D9] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-xl text-[#302B45] mb-1">
                Parent Verification
              </h3>
              <p className="text-sm text-[#302B45]/70 mb-5">
                Enter your 4-digit parent PIN to view learning analytics and privacy controls
                (demo default: <span className="font-mono-phonetic font-bold">1234</span>).
              </p>

              <div className="flex items-center justify-center gap-2 mb-3">
                <label htmlFor="parent-pin-input" className="sr-only">
                  Parent 4-digit PIN
                </label>
                <input
                  id="parent-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinAttempt}
                  onChange={(e) => setPinAttempt(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  className="w-36 px-4 py-3 rounded-2xl border border-[#302B45]/20 text-center font-mono-phonetic text-lg tracking-widest"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-3 min-h-[48px] rounded-2xl bg-[#7557D9] text-white font-bold text-sm"
                >
                  <Unlock className="w-4 h-4" aria-hidden="true" />
                  <span>Unlock</span>
                </button>
              </div>
              {pinError && <p className="text-xs text-[#DC2626] font-semibold">{pinError}</p>}
            </form>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-2xl text-[#302B45]">
                    Parent Insights & Controls
                  </h3>
                  <p className="text-sm text-[#302B45]/70">
                    Private overview for {state.user.nickname} · No public sharing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParentUnlocked(false);
                    setPinAttempt('');
                  }}
                  className="px-4 py-2 min-h-[40px] rounded-xl border border-[#302B45]/15 text-xs font-semibold"
                >
                  Lock Dashboard
                </button>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
                  <p className="text-xs text-[#302B45]/65">Learning Time</p>
                  <p className="font-display font-extrabold text-2xl tabular-nums mt-1">
                    {state.learning.totalMinutesLearned} min
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
                  <p className="text-xs text-[#302B45]/65">Lessons Completed</p>
                  <p className="font-display font-extrabold text-2xl tabular-nums mt-1">
                    {completedLessonsCount}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
                  <p className="text-xs text-[#302B45]/65">Letters Mastered</p>
                  <p className="font-display font-extrabold text-2xl tabular-nums mt-1">
                    {state.masteredLetters.length} / 26
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
                  <p className="text-xs text-[#302B45]/65">Vocabulary Words</p>
                  <p className="font-display font-extrabold text-2xl tabular-nums mt-1">
                    {state.masteredWords.length}
                  </p>
                </div>
              </div>

              {/* Weekly Progress Bar Chart & Areas to Practice */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
                  <h4 className="font-display font-bold text-base text-[#302B45] mb-4">
                    Weekly Minutes Practiced
                  </h4>
                  <div className="flex items-end justify-between gap-2 h-32 pt-2">
                    {state.weeklyMinutes.map((mins, idx) => (
                      <div key={weekLabels[idx]} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[11px] font-semibold tabular-nums text-[#302B45]/70">
                          {mins}m
                        </span>
                        <div className="w-full bg-white rounded-t-xl h-20 flex items-end overflow-hidden border border-[#302B45]/8">
                          <div
                            className="w-full bg-[#7557D9] rounded-t-xl"
                            style={{ height: `${Math.min(100, Math.round((mins / 30) * 100))}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#302B45]/70">
                          {weekLabels[idx]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 space-y-3">
                  <h4 className="font-display font-bold text-base text-[#302B45]">
                    Gentle Focus Recommendations
                  </h4>
                  <p className="text-xs text-[#302B45]/75 leading-relaxed">
                    {Object.keys(state.confusedLetters).length > 0
                      ? `Pairs to practice gently: ${Object.keys(state.confusedLetters).join(', ')}. Lumo includes visual B vs D comparisons in Practice.`
                      : 'No letter confusions logged yet! Keep encouraging short daily 10-minute sessions.'}
                  </p>
                  <p className="text-xs text-[#302B45]/75">
                    Pronunciation attempts logged: <strong className="tabular-nums">{state.pronunciationHistory.length}</strong>
                  </p>
                </div>
              </div>

              {/* Screen Time & Privacy Controls */}
              <div className="p-5 rounded-2xl border border-[#302B45]/12 space-y-4">
                <h4 className="font-display font-bold text-base text-[#302B45]">
                  Screen-Time & Privacy Consent Controls
                </h4>

                <div>
                  <label htmlFor="screentime-limit" className="block text-sm font-semibold mb-1">
                    Daily Screen-Time Limit:{' '}
                    <span className="text-[#7557D9] tabular-nums">
                      {state.parentSettings.dailyScreenTimeMinutes} minutes/day
                    </span>
                  </label>
                  <input
                    id="screentime-limit"
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={state.parentSettings.dailyScreenTimeMinutes}
                    onChange={(e) =>
                      onUpdateSettings({ dailyScreenTimeMinutes: Number(e.target.value) })
                    }
                    className="w-full max-w-md accent-[#7557D9]"
                  />
                </div>

                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.parentSettings.saveVoiceClipsOptIn}
                    onChange={(e) =>
                      onUpdateSettings({ saveVoiceClipsOptIn: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 accent-[#7557D9]"
                  />
                  <span className="text-[#302B45]/80">
                    Optional: Retain pronunciation review summaries (raw child audio clips are
                    never stored by default).
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#FFF9EF] border border-[#302B45]/15 text-xs font-bold text-[#302B45]"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>Export Child Data (JSON)</span>
                  </button>

                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-[#DC2626]/30 text-xs font-bold text-[#DC2626]"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span>Delete Child Profile</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onDeleteAccount}
                        className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#DC2626] text-white text-xs font-bold"
                      >
                        Confirm Permanent Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#302B45]/15 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 5. HELP & SUPPORT */}
      {section === 'help' && (
        <section className="bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-xl text-[#302B45]">
            Help & Learning Guide
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-[#302B45]/80">
            <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8">
              <h4 className="font-bold text-[#302B45] mb-1">Letter Names vs Sounds</h4>
              <p className="text-xs leading-relaxed">
                Alphabet Forest teaches both how a letter is named (B = /biː/) and the sound it
                makes in words (/b/ in Ball) so children read smoothly.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8">
              <h4 className="font-bold text-[#302B45] mb-1">Offline vs Online Features</h4>
              <p className="text-xs leading-relaxed">
                Downloaded worlds, flashcards, tracing, and device voice playback work offline. AI
                Teacher Lumo and Cloud Speech Evaluation use an internet connection.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
