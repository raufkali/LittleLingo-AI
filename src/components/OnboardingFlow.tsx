import React, { useState } from 'react';
import { ArrowRight, Check, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
import {
  AVATAR_OPTIONS,
  GENERATED_ASSETS,
} from '../data/curriculum';
import type {
  AgeRange,
  AppPersistedState,
  LearningGoal,
  OnboardingStep,
  SupportLanguage,
} from '../types/learning';
import { determineStartingPath } from '../utils/learningEngine';
import { speakEnglish } from '../utils/audioSpeech';
import { LumoMascot } from './LumoMascot';
import { VisualIllustration } from './VisualIllustration';

interface OnboardingFlowProps {
  initialState: AppPersistedState;
  onComplete: (nextState: AppPersistedState) => void;
}

const LANGUAGE_LABELS: Array<{ code: SupportLanguage; label: string }> = [
  { code: 'en', label: 'English (Only)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'zh', label: 'Chinese (中文)' },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialState,
  onComplete,
}) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [consentChecked, setConsentChecked] = useState(true);
  const [parentPin, setParentPin] = useState(initialState.user.parentPin || '1234');

  const [nickname, setNickname] = useState(initialState.user.nickname === 'Ali' ? '' : initialState.user.nickname);
  const [ageRange, setAgeRange] = useState<AgeRange>(initialState.user.ageRange);
  const [avatarId, setAvatarId] = useState(initialState.user.avatarId);
  const [preferredLanguage, setPreferredLanguage] = useState<SupportLanguage>(
    initialState.user.preferredLanguage
  );
  const [learningGoal, setLearningGoal] = useState<LearningGoal>(initialState.user.learningGoal);
  const [childError, setChildError] = useState('');

  // Initial Assessment state
  const [knowsAlphabet, setKnowsAlphabet] = useState<'none' | 'some' | 'all'>('none');
  const [pictureWordAnswer, setPictureWordAnswer] = useState('');
  const [listeningAnswer, setListeningAnswer] = useState('');

  const pathResult = determineStartingPath({
    knowsAlphabet,
    pictureWordAnswer,
    listeningAnswer,
  });

  const handleGuestDemo = () => {
    onComplete({
      ...initialState,
      onboardingComplete: true,
      user: {
        ...initialState.user,
        nickname: 'Ali',
        isGuestDemo: true,
        parentConsentGiven: true,
      },
    });
  };

  const handleFinishOnboarding = () => {
    const cleanName = nickname.trim() || 'Explorer';
    onComplete({
      ...initialState,
      onboardingComplete: true,
      user: {
        ...initialState.user,
        id: `learner-${Date.now()}`,
        nickname: cleanName,
        ageRange,
        avatarId,
        preferredLanguage,
        learningGoal,
        isGuestDemo: false,
        parentConsentGiven: consentChecked,
        parentPin: parentPin.length === 4 ? parentPin : '1234',
        createdAt: new Date().toISOString(),
      },
      learning: {
        ...initialState.learning,
        startingWorldId: pathResult.startingWorldId,
      },
    });
  };

  const stepIndex = ['welcome', 'parent', 'child', 'assessment', 'path'].indexOf(step);

  return (
    <div className="min-h-screen bg-[#FFF9EF] text-[#302B45] flex flex-col justify-center py-8 px-4 sm:px-6">
      <div className="max-w-5xl w-full mx-auto">
        {step !== 'welcome' && (
          <div className="flex items-center justify-between mb-6 max-w-2xl mx-auto">
            <span className="font-display font-bold text-lg text-[#7557D9]">LittleLingo AI</span>
            <div className="flex items-center gap-2" aria-label={`Step ${stepIndex + 1} of 5`}>
              {[0, 1, 2, 3, 4].map((idx) => (
                <span
                  key={idx}
                  className={`h-2.5 rounded-full transition-all ${
                    idx <= stepIndex ? 'w-8 bg-[#7557D9]' : 'w-2.5 bg-[#302B45]/15'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'welcome' && (
          <div className="grid lg:grid-cols-2 gap-8 items-stretch bg-white rounded-3xl border border-[#302B45]/10 overflow-hidden shadow-sm">
            <div className="p-8 sm:p-10 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <LumoMascot expression="excited" size={76} />
                  <div>
                    <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#302B45] tracking-tight">
                      LittleLingo AI
                    </h1>
                    <p className="text-sm font-medium text-[#302B45]/70">
                      English Adventure for Ages 4–12 · Guided by Lumo
                    </p>
                  </div>
                </div>

                <h2 className="font-display font-bold text-2xl sm:text-3xl leading-snug text-[#302B45] mb-3">
                  Learn English from A to Z like a cozy adventure game.
                </h2>
                <p className="text-base text-[#302B45]/75 leading-relaxed mb-6">
                  Start from absolute zero with letter sounds, interactive phonics, illustrated
                  words, gentle pronunciation practice, and safe AI conversations with Lumo.
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm text-[#302B45]/80 mb-6">
                  <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8">
                    <p className="font-bold text-[#302B45]">26 Letters & Phonics</p>
                    <p className="text-xs text-[#302B45]/70 mt-0.5">Letter names vs sounds & tracing</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8">
                    <p className="font-bold text-[#302B45]">Child-Safe AI Tutor</p>
                    <p className="text-xs text-[#302B45]/70 mt-0.5">Parent-managed & ad-free</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep('parent')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-2xl bg-[#7557D9] text-white font-display font-bold text-base hover:bg-[#6546ca] transition-colors whitespace-nowrap"
                >
                  <span>Start Learning</span>
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleGuestDemo}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-2xl bg-[#FFF9EF] border border-[#302B45]/15 text-[#302B45] font-semibold text-base hover:bg-[#f6eddd] transition-colors whitespace-nowrap"
                >
                  <span>Try Guest Demo</span>
                </button>
              </div>
            </div>

            <div className="relative min-h-[260px] lg:min-h-full bg-[#EDE9FE]">
              <img
                src={GENERATED_ASSETS.heroWelcome}
                alt="LittleLingo AI learning village treehouse"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {step === 'parent' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-10 shadow-sm animate-pop-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#56C88A]/15 flex items-center justify-center text-[#2B8A57]">
                <ShieldCheck className="w-7 h-7" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display font-bold text-2xl text-[#302B45]">
                  Parent Setup & Child Safety
                </h2>
                <p className="text-sm text-[#302B45]/70">
                  COPPA & GDPR-K mindful · No ads · No public child profiles
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-[#302B45]/85 mb-6">
              <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/8">
                <p className="font-semibold text-[#302B45] mb-1">How LittleLingo AI protects your child</p>
                <p className="leading-relaxed text-[#302B45]/75">
                  Lessons work offline once downloaded. Voice clips for pronunciation coaching are
                  processed safely and never stored unless you opt in from the Parent Dashboard.
                </p>
              </div>

              <label className="block">
                <span className="font-semibold text-[#302B45] block mb-1.5">
                  Parent Gate PIN (4 digits to open Parent Dashboard)
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={parentPin}
                  onChange={(e) => setParentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-40 px-4 py-3 rounded-2xl border border-[#302B45]/20 bg-white font-mono-phonetic text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#7557D9]"
                  placeholder="1234"
                />
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-[#302B45]/15 cursor-pointer hover:bg-[#FFF9EF]/60">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[#7557D9]"
                />
                <span className="leading-relaxed">
                  I am a parent or guardian and consent to creating a private local learning profile
                  for my child.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="px-5 py-3 min-h-[44px] rounded-2xl border border-[#302B45]/15 font-semibold text-sm hover:bg-[#FFF9EF]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!consentChecked || parentPin.length < 4}
                onClick={() => setStep('child')}
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-2xl bg-[#7557D9] text-white font-bold text-sm hover:bg-[#6546ca] disabled:opacity-45"
              >
                <span>Continue to Child Profile</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {step === 'child' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-10 shadow-sm animate-pop-in">
            <div className="flex items-center gap-4 mb-6">
              <LumoMascot expression="happy" size={68} />
              <div>
                <h2 className="font-display font-bold text-2xl text-[#302B45]">
                  Who is learning today?
                </h2>
                <p className="text-sm text-[#302B45]/70">
                  We adapt lessons to your child’s age and home language.
                </p>
              </div>
            </div>

            <div className="space-y-5 mb-6">
              <div>
                <label htmlFor="child-nickname" className="block font-semibold text-sm mb-1.5">
                  Child Nickname (no last name needed)
                </label>
                <input
                  id="child-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setChildError('');
                  }}
                  placeholder="e.g. Maya or Ali"
                  maxLength={24}
                  className="w-full px-4 py-3 rounded-2xl border border-[#302B45]/20 bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#7557D9]"
                />
                {childError && <p className="text-sm text-[#DC2626] mt-1 font-medium">{childError}</p>}
              </div>

              <div>
                <span className="block font-semibold text-sm mb-2">Age Range</span>
                <div className="grid grid-cols-3 gap-3">
                  {(['4-6', '7-9', '10-12'] as AgeRange[]).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setAgeRange(range)}
                      className={`py-3 px-4 min-h-[44px] rounded-2xl border font-semibold text-sm transition-colors ${
                        ageRange === range
                          ? 'bg-[#7557D9] text-white border-[#7557D9]'
                          : 'bg-[#FFF9EF] text-[#302B45] border-[#302B45]/15 hover:border-[#7557D9]/40'
                      }`}
                    >
                      Ages {range}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block font-semibold text-sm mb-2">Pick an Adventure Buddy</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarId(av.id)}
                      className={`p-3 rounded-2xl border text-center transition-all min-h-[44px] ${
                        avatarId === av.id
                          ? 'border-[#7557D9] ring-2 ring-[#7557D9]/25 bg-[#EDE9FE]/40'
                          : 'border-[#302B45]/12 bg-white hover:bg-[#FFF9EF]'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-1.5 flex items-center justify-center font-display font-bold text-base"
                        style={{ backgroundColor: av.bg, color: av.accent }}
                      >
                        {av.label.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold">{av.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block font-semibold text-sm mb-1.5">
                    Home Language for Word Translations
                  </span>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as SupportLanguage)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#302B45]/20 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7557D9]"
                  >
                    {LANGUAGE_LABELS.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block font-semibold text-sm mb-1.5">Main Learning Goal</span>
                  <select
                    value={learningGoal}
                    onChange={(e) => setLearningGoal(e.target.value as LearningGoal)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#302B45]/20 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7557D9]"
                  >
                    <option value="alphabet_basics">Start from Alphabet Basics</option>
                    <option value="phonics_reading">Phonics & Early Reading</option>
                    <option value="everyday_speaking">Speaking & Conversation</option>
                    <option value="school_readiness">Vocabulary & School Readiness</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('parent')}
                className="px-5 py-3 min-h-[44px] rounded-2xl border border-[#302B45]/15 font-semibold text-sm hover:bg-[#FFF9EF]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!nickname.trim()) {
                    setChildError('Please enter a friendly nickname for your child.');
                    return;
                  }
                  setStep('assessment');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-2xl bg-[#7557D9] text-white font-bold text-sm hover:bg-[#6546ca]"
              >
                <span>Quick Check-In</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {step === 'assessment' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-10 shadow-sm animate-pop-in">
            <div className="flex items-center gap-4 mb-6">
              <LumoMascot expression="thinking" size={68} />
              <div>
                <h2 className="font-display font-bold text-2xl text-[#302B45]">
                  3-Question Adventure Check
                </h2>
                <p className="text-sm text-[#302B45]/70">
                  No stress! This just helps Lumo pick a comfortable starting point.
                </p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <p className="font-semibold text-sm mb-2">
                  1. Does {nickname || 'your child'} know the English alphabet yet?
                </p>
                <div className="grid sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'none', label: 'Brand new to A–Z' },
                    { id: 'some', label: 'Knows some letters' },
                    { id: 'all', label: 'Knows all 26 letters' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setKnowsAlphabet(item.id as 'none' | 'some' | 'all')}
                      className={`py-3 px-3 min-h-[44px] rounded-2xl border text-sm font-semibold transition-colors ${
                        knowsAlphabet === item.id
                          ? 'bg-[#7557D9] text-white border-[#7557D9]'
                          : 'bg-[#FFF9EF] text-[#302B45] border-[#302B45]/15'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">
                  2. Which word matches this picture?
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="p-3 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
                    <VisualIllustration visualKey="apple" size={58} />
                  </div>
                  <div className="flex gap-2.5 flex-wrap">
                    {['Apple', 'Ball', 'Fish', 'Not sure yet'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPictureWordAnswer(opt)}
                        className={`px-4 py-2.5 min-h-[44px] rounded-2xl border text-sm font-semibold ${
                          pictureWordAnswer === opt
                            ? 'bg-[#48B8E8] text-white border-[#48B8E8]'
                            : 'bg-white border-[#302B45]/15 text-[#302B45]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">
                  3. Tap Listen and pick the animal you hear:
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => speakEnglish('Cat', { rate: 0.85 })}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl bg-[#48B8E8] text-white font-semibold text-sm"
                  >
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                    <span>Listen</span>
                  </button>
                  {['Cat', 'Dog', 'Sun', 'Skip'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setListeningAnswer(opt)}
                      className={`px-4 py-2.5 min-h-[44px] rounded-2xl border text-sm font-semibold ${
                        listeningAnswer === opt
                          ? 'bg-[#56C88A] text-white border-[#56C88A]'
                          : 'bg-white border-[#302B45]/15 text-[#302B45]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('child')}
                className="px-5 py-3 min-h-[44px] rounded-2xl border border-[#302B45]/15 font-semibold text-sm hover:bg-[#FFF9EF]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('path')}
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-2xl bg-[#7557D9] text-white font-bold text-sm hover:bg-[#6546ca]"
              >
                <span>Build My Learning Path</span>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {step === 'path' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#302B45]/10 p-6 sm:p-10 shadow-sm text-center animate-pop-in">
            <div className="flex justify-center mb-4">
              <LumoMascot expression="celebrating" size={108} />
            </div>
            <p className="text-sm font-semibold text-[#7557D9] mb-1">
              {pathResult.levelLabel}
            </p>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#302B45] mb-3">
              Welcome aboard, {nickname || 'Explorer'}!
            </h2>
            <p className="text-base text-[#302B45]/75 max-w-lg mx-auto mb-6 leading-relaxed">
              {pathResult.summary}
            </p>

            <div className="grid sm:grid-cols-3 gap-3 text-left mb-8">
              {[
                { title: '1. Alphabet Forest', desc: 'A–Z names, sounds & tracing' },
                { title: '2. Phonics & Words', desc: 'Blending & picture vocabulary' },
                { title: '3. Stories & AI Lumo', desc: 'Read-alongs & speaking' },
              ].map((card) => (
                <div key={card.title} className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#302B45]">
                    <Check className="w-4 h-4 text-[#56C88A]" aria-hidden="true" />
                    <span>{card.title}</span>
                  </div>
                  <p className="text-xs text-[#302B45]/70 mt-1">{card.desc}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 min-h-[52px] rounded-2xl bg-[#56C88A] text-white font-display font-bold text-lg hover:bg-[#49b67b] transition-colors shadow-sm"
            >
              <span>Enter Learning Adventure</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
