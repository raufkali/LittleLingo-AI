import React, { useState } from 'react';
import { Mic, RotateCcw, Send, ShieldCheck, Volume2 } from 'lucide-react';
import { AI_SCENARIOS } from '../data/curriculum';
import type { AppPersistedState, LumoExpression } from '../types/learning';
import { speakEnglish } from '../utils/audioSpeech';
import { LumoMascot } from './LumoMascot';

interface ChatTurn {
  id: string;
  role: 'lumo' | 'child';
  text: string;
  gentleCorrection?: string;
}

interface AITeacherChatProps {
  state: AppPersistedState;
  onTeacherTurn: () => void;
}

export const AITeacherChat: React.FC<AITeacherChatProps> = ({ state, onTeacherTurn }) => {
  const [scenarioId, setScenarioId] = useState(AI_SCENARIOS[0].id);
  const activeScenario = AI_SCENARIOS.find((s) => s.id === scenarioId) || AI_SCENARIOS[0];

  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'init-1',
      role: 'lumo',
      text: activeScenario.starterPrompt,
    },
  ]);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>(
    activeScenario.suggestedReplies
  );
  const [lumoExpr, setLumoExpr] = useState<LumoExpression>('happy');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [statusError, setStatusError] = useState('');

  const handleChangeScenario = (nextId: string) => {
    const next = AI_SCENARIOS.find((s) => s.id === nextId) || AI_SCENARIOS[0];
    setScenarioId(next.id);
    setMessages([{ id: `init-${next.id}`, role: 'lumo', text: next.starterPrompt }]);
    setSuggestedReplies(next.suggestedReplies);
    setLumoExpr('happy');
    setStatusError('');
    if (state.parentSettings.autoPlayAudio) {
      speakEnglish(next.starterPrompt, { rate: 0.92 });
    }
  };

  const sendMessage = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || isSending) return;

    const childTurn: ChatTurn = {
      id: `child-${Date.now()}`,
      role: 'child',
      text: clean,
    };
    const nextHistory = [...messages, childTurn];
    setMessages(nextHistory);
    setInputText('');
    setIsSending(true);
    setLumoExpr('thinking');
    setStatusError('');

    try {
      const res = await fetch('/api/ai/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: activeScenario.id,
          childMessage: clean,
          childName: state.user.nickname,
          ageRange: state.user.ageRange,
          level: state.learning.currentLevel,
          history: nextHistory.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: string };
        setStatusError(
          errData.error ||
            'Lumo AI Teacher requires an active internet connection and configured AI service.'
        );
        setLumoExpr('encouraging');
        setIsSending(false);
        return;
      }

      const data = (await res.json()) as {
        reply: string;
        expression?: LumoExpression;
        gentleCorrection?: string;
        suggestedReplies?: string[];
      };

      const lumoTurn: ChatTurn = {
        id: `lumo-${Date.now()}`,
        role: 'lumo',
        text: data.reply,
        gentleCorrection: data.gentleCorrection || undefined,
      };
      setMessages((prev) => [...prev.slice(-9), lumoTurn]);
      setLumoExpr(data.expression || 'happy');
      if (Array.isArray(data.suggestedReplies) && data.suggestedReplies.length > 0) {
        setSuggestedReplies(data.suggestedReplies.slice(0, 3));
      }
      onTeacherTurn();
      if (state.parentSettings.autoPlayAudio) {
        speakEnglish(data.reply, {
          rate: state.parentSettings.speechSpeed === 'slow' ? 0.72 : 0.94,
        });
      }
    } catch {
      setStatusError(
        'Cannot reach Lumo AI Teacher right now. Check your internet connection or try an offline lesson in Learn!'
      );
      setLumoExpr('encouraging');
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setStatusError('Voice input is not supported in this browser. Tap a reply chip or type below!');
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = new (SpeechRec as any)();
      rec.lang = 'en-US';
      setIsListeningVoice(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        setIsListeningVoice(false);
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          sendMessage(transcript);
        }
      };
      rec.onerror = () => {
        setIsListeningVoice(false);
      };
      rec.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  const lastLumoMessage = [...messages].reverse().find((m) => m.role === 'lumo');

  return (
    <div className="grid lg:grid-cols-12 gap-6 animate-pop-in">
      {/* Left Column: Safe Guided Topics */}
      <aside className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-3xl border border-[#302B45]/10 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <LumoMascot expression={lumoExpr} size={64} />
            <div>
              <h2 className="font-display font-bold text-xl text-[#302B45]">
                AI Teacher Lumo
              </h2>
              <p className="text-xs text-[#302B45]/70">
                Guided English topics · Child-safe moderation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#1F5E3B] bg-[#56C88A]/12 px-3 py-2 rounded-xl mb-4">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Safe predefined topics only · Requires internet</span>
          </div>

          <p className="text-xs font-semibold text-[#302B45]/65 mb-2">Pick a Topic</p>
          <div className="space-y-2">
            {AI_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleChangeScenario(sc.id)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                  scenarioId === sc.id
                    ? 'border-[#7557D9] bg-[#EDE9FE]/55'
                    : 'border-[#302B45]/10 bg-[#FFF9EF]/60 hover:border-[#7557D9]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-sm text-[#302B45]">
                    {sc.title}
                  </span>
                  <span className="text-[11px] font-semibold text-[#7557D9]">{sc.levelHint}</span>
                </div>
                <p className="text-xs text-[#302B45]/70 mt-0.5">{sc.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right Column: Interactive Tutor Chat */}
      <section className="lg:col-span-8 bg-white rounded-3xl border border-[#302B45]/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[540px]">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#302B45]/10">
          <div>
            <p className="text-xs font-semibold text-[#7557D9]">{activeScenario.title}</p>
            <h3 className="font-display font-bold text-lg text-[#302B45]">
              Speaking Practice with Lumo
            </h3>
          </div>
          {lastLumoMessage && (
            <button
              type="button"
              onClick={() =>
                speakEnglish(lastLumoMessage.text, {
                  rate: state.parentSettings.speechSpeed === 'slow' ? 0.7 : 0.9,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#FFF9EF] border border-[#302B45]/12 text-xs font-semibold text-[#302B45] hover:bg-[#f4ebd8] whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#7557D9]" aria-hidden="true" />
              <span>Repeat Question</span>
            </button>
          )}
        </div>

        {/* Message List */}
        <div className="flex-1 py-5 space-y-4 overflow-y-auto max-h-[360px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'child' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed ${
                  msg.role === 'child'
                    ? 'bg-[#7557D9] text-white rounded-br-sm'
                    : 'bg-[#FFF9EF] border border-[#302B45]/10 text-[#302B45] rounded-bl-sm'
                }`}
              >
                <p>{msg.text}</p>
                {msg.role === 'lumo' && (
                  <button
                    type="button"
                    onClick={() => speakEnglish(msg.text, { rate: 0.9 })}
                    aria-label={`Play Lumo message: ${msg.text}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#48B8E8] hover:underline"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Listen</span>
                  </button>
                )}
              </div>

              {msg.gentleCorrection && (
                <p className="mt-1.5 text-xs font-medium text-[#1F5E3B] bg-[#56C88A]/15 px-3 py-1.5 rounded-xl max-w-[85%]">
                  {msg.gentleCorrection}
                </p>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#7557D9]">
              <span>Lumo is thinking of a friendly reply...</span>
            </div>
          )}
        </div>

        {statusError && (
          <div
            role="alert"
            className="mb-3 p-3.5 rounded-2xl bg-[#FFD45A]/25 border border-[#FFD45A] text-xs font-medium text-[#302B45]"
          >
            {statusError}
          </div>
        )}

        {/* Suggested Tap Replies + Input Bar */}
        <div className="pt-4 border-t border-[#302B45]/10 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {suggestedReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                disabled={isSending}
                onClick={() => sendMessage(reply)}
                className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#EDE9FE]/70 text-[#4C2FA8] font-semibold text-xs hover:bg-[#EDE9FE] whitespace-nowrap shrink-0"
              >
                “{reply}”
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputText);
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handleVoiceInput}
              aria-label="Speak your reply"
              className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 transition-colors ${
                isListeningVoice
                  ? 'bg-[#E05A5A] text-white'
                  : 'bg-[#FFF9EF] border border-[#302B45]/15 text-[#7557D9] hover:bg-[#EDE9FE]'
              }`}
            >
              <Mic className="w-5 h-5" aria-hidden="true" />
            </button>

            <label htmlFor="ai-teacher-input" className="sr-only">
              Type a short English message to Lumo
            </label>
            <input
              id="ai-teacher-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or tap a reply above..."
              maxLength={200}
              className="flex-1 px-4 py-3 min-h-[48px] rounded-2xl border border-[#302B45]/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7557D9]"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              aria-label="Send message to Lumo"
              className="inline-flex items-center justify-center gap-1.5 px-5 h-12 rounded-2xl bg-[#7557D9] text-white font-semibold text-sm hover:bg-[#6546ca] disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
