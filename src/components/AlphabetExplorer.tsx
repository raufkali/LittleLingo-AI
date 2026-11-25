import React, { useState } from 'react';
import { Check, Volume2 } from 'lucide-react';
import { ALPHABET_DATA } from '../data/curriculum';
import { speakEnglish } from '../utils/audioSpeech';
import { AudioControls } from './AudioControls';
import { LetterTracingCanvas } from './LetterTracingCanvas';
import { VisualIllustration } from './VisualIllustration';

interface AlphabetExplorerProps {
  masteredLetters: string[];
  onPracticeLetter: (letter: string) => void;
}

export const AlphabetExplorer: React.FC<AlphabetExplorerProps> = ({
  masteredLetters,
  onPracticeLetter,
}) => {
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [showTracer, setShowTracer] = useState(false);

  const entry = ALPHABET_DATA.find((a) => a.letter === selectedLetter) || ALPHABET_DATA[0];

  return (
    <div className="bg-white rounded-3xl border border-[#302B45]/10 p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display font-bold text-xl text-[#302B45]">
            Interactive A–Z Alphabet Board
          </h3>
          <p className="text-sm text-[#302B45]/70">
            Tap any letter to compare its letter name and phonetic sound · {masteredLetters.length}/26 practiced
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTracer((s) => !s)}
          className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-[#FFF9EF] border border-[#302B45]/15 text-sm font-semibold text-[#302B45] hover:bg-[#f4ebd8] whitespace-nowrap shrink-0"
        >
          {showTracer ? 'Show Letter Card' : 'Trace This Letter'}
        </button>
      </div>

      {/* 26 Letter Grid */}
      <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-[repeat(13,minmax(0,1fr))] gap-2 mb-6">
        {ALPHABET_DATA.map((item) => {
          const isSelected = item.letter === selectedLetter;
          const isMastered = masteredLetters.includes(item.letter);
          return (
            <button
              key={item.letter}
              type="button"
              onClick={() => {
                setSelectedLetter(item.letter);
                speakEnglish(`${item.letter}. ${item.exampleWord}`, { rate: 0.9 });
                onPracticeLetter(item.letter);
              }}
              aria-label={`Letter ${item.letter} ${item.lowercase}, for ${item.exampleWord}`}
              className={`relative h-12 rounded-xl font-display font-bold text-base flex items-center justify-center border transition-all ${
                isSelected
                  ? 'bg-[#7557D9] text-white border-[#7557D9] shadow-sm scale-[1.04]'
                  : isMastered
                    ? 'bg-[#56C88A]/12 text-[#1F5E3B] border-[#56C88A]/40 hover:bg-[#56C88A]/20'
                    : 'bg-[#FFF9EF] text-[#302B45] border-[#302B45]/12 hover:border-[#7557D9]/40'
              }`}
            >
              <span>{item.letter}</span>
              {isMastered && !isSelected && (
                <Check className="w-3 h-3 absolute top-1 right-1 text-[#2B8A57]" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Letter Spotlight */}
      {showTracer ? (
        <div className="bg-[#FFF9EF] rounded-2xl p-5 border border-[#302B45]/8 flex flex-col items-center">
          <p className="font-display font-bold text-lg text-[#302B45] mb-3">
            Trace Uppercase {entry.letter} ({entry.letter} is for {entry.exampleWord})
          </p>
          <LetterTracingCanvas letter={entry.letter} onComplete={() => onPracticeLetter(entry.letter)} />
        </div>
      ) : (
        <div className="bg-[#FFF9EF] rounded-2xl p-5 sm:p-6 border border-[#302B45]/8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <div
              className="w-28 h-28 rounded-3xl bg-white border-2 flex items-center justify-center font-display font-extrabold text-5xl"
              style={{ borderColor: entry.accentColor, color: entry.accentColor }}
            >
              <span>{entry.letter}</span>
              <span className="text-4xl text-[#302B45] ml-1">{entry.lowercase}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-[#302B45]/8">
              <VisualIllustration visualKey={entry.visualKey} size={76} />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-[#302B45]/75 mb-2">
              <span>
                Letter Name: <strong className="font-mono-phonetic text-[#302B45]">{entry.letterNameIPA}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Common Sound: <strong className="font-mono-phonetic text-[#7557D9]">{entry.phoneticSound}</strong>
              </span>
            </div>

            <h4 className="font-display font-extrabold text-2xl text-[#302B45] mb-1">
              {entry.letter} is for {entry.exampleWord}
            </h4>
            <p className="text-sm text-[#302B45]/80 mb-2">{entry.phoneticHint}</p>
            <p className="text-xs text-[#302B45]/65 mb-4">{entry.multipleSoundsNote}</p>

            <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
              <AudioControls text={`${entry.letter}. ${entry.exampleWord}. ${entry.exampleSentence}`} label="Hear Letter & Sentence" />
              <button
                type="button"
                onClick={() => speakEnglish(entry.exampleWord, { rate: 0.75 })}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-2xl bg-white border border-[#302B45]/15 text-sm font-semibold text-[#302B45] hover:bg-[#f4ebd8]"
              >
                <Volume2 className="w-4 h-4 text-[#56C88A]" aria-hidden="true" />
                <span>Word Only</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
