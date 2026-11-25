import React, { useState } from 'react';
import { Volume2, Turtle } from 'lucide-react';
import { speakEnglish } from '../utils/audioSpeech';

interface AudioControlsProps {
  text: string;
  label?: string;
  preferServerTTS?: boolean;
  compact?: boolean;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  text,
  label = 'Listen',
  preferServerTTS = false,
  compact = false,
}) => {
  const [speakingMode, setSpeakingMode] = useState<'normal' | 'slow' | null>(null);

  const handlePlay = async (slow: boolean) => {
    setSpeakingMode(slow ? 'slow' : 'normal');
    await speakEnglish(text, {
      rate: slow ? 0.65 : 0.95,
      preferServerTTS,
      onEnd: () => setSpeakingMode(null),
    });
  };

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => handlePlay(false)}
        aria-label={`${label}: ${text}`}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#48B8E8] text-white font-semibold shadow-sm hover:bg-[#3aa5d4] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[44px] ${
          compact ? 'px-3.5 py-2 text-sm' : 'px-5 py-2.5 text-base'
        } ${speakingMode === 'normal' ? 'ring-4 ring-[#48B8E8]/30' : ''}`}
      >
        <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span>{speakingMode === 'normal' ? 'Playing...' : label}</span>
      </button>

      <button
        type="button"
        onClick={() => handlePlay(true)}
        aria-label={`Listen slowly: ${text}`}
        className={`inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white border border-[#302B45]/15 text-[#302B45] font-semibold hover:bg-[#FFF9EF] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[44px] ${
          compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'
        } ${speakingMode === 'slow' ? 'ring-4 ring-[#FFD45A]/50' : ''}`}
      >
        <Turtle className="w-4 h-4 text-[#7557D9] shrink-0" aria-hidden="true" />
        <span>Slow</span>
      </button>
    </div>
  );
};
