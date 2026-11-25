import React, { useMemo, useState } from 'react';
import { Check, Volume2 } from 'lucide-react';
import { VOCABULARY_DATA } from '../data/curriculum';
import type { SupportLanguage, VocabCategory } from '../types/learning';
import { speakEnglish } from '../utils/audioSpeech';
import { AudioControls } from './AudioControls';
import { VisualIllustration } from './VisualIllustration';

interface VocabularyFlashcardsProps {
  preferredLanguage: SupportLanguage;
  masteredWords: string[];
  onMasterWord: (word: string) => void;
}

const CATEGORIES: VocabCategory[] = [
  'Animals',
  'Fruits',
  'Colors',
  'Numbers',
  'Body Parts',
  'Family',
  'Food',
  'Objects',
  'Nature',
];

export const VocabularyFlashcards: React.FC<VocabularyFlashcardsProps> = ({
  preferredLanguage,
  masteredWords,
  onMasterWord,
}) => {
  const [category, setCategory] = useState<VocabCategory>('Animals');
  const [selectedNumber, setSelectedNumber] = useState(1);

  const items = useMemo(
    () => VOCABULARY_DATA.filter((item) => item.category === category),
    [category]
  );

  return (
    <div className="bg-white rounded-3xl border border-[#302B45]/10 p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="font-display font-bold text-xl text-[#302B45]">
            Vocabulary Kingdom Flashcards
          </h3>
          <p className="text-sm text-[#302B45]/70">
            Explore all 9 everyday categories with pictures, audio, and example sentences
          </p>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 min-h-[44px] rounded-2xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
              category === cat
                ? 'bg-[#7557D9] text-white'
                : 'bg-[#FFF9EF] text-[#302B45] border border-[#302B45]/12 hover:border-[#7557D9]/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Interactive 1-100 Explorer when Numbers category is active */}
      {category === 'Numbers' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9EF] border border-[#302B45]/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <label htmlFor="number-slider" className="block text-sm font-bold text-[#302B45] mb-1">
              Numbers Explorer (1–100): <span className="text-[#7557D9] text-lg tabular-nums">{selectedNumber}</span>
            </label>
            <input
              id="number-slider"
              type="range"
              min={1}
              max={100}
              value={selectedNumber}
              onChange={(e) => setSelectedNumber(Number(e.target.value))}
              className="w-full accent-[#7557D9]"
            />
          </div>
          <button
            type="button"
            onClick={() => speakEnglish(String(selectedNumber), { rate: 0.9 })}
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-2xl bg-[#48B8E8] text-white font-semibold text-sm whitespace-nowrap shrink-0"
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            <span>Say {selectedNumber}</span>
          </button>
        </div>
      )}

      {/* Flashcard Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const isLearned = masteredWords.includes(item.word);
          const translation =
            preferredLanguage !== 'en' ? item.translations[preferredLanguage] : null;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-[#302B45]/12 bg-[#FFF9EF]/55 p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2.5 rounded-2xl bg-white border border-[#302B45]/8">
                    <VisualIllustration
                      visualKey={item.visualKey}
                      colorHex={item.colorHex}
                      size={56}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      speakEnglish(`${item.word}. ${item.exampleSentence}`, { rate: 0.9 });
                      onMasterWord(item.word);
                    }}
                    aria-label={`Practice ${item.word}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-colors ${
                      isLearned
                        ? 'bg-[#56C88A]/18 text-[#1F5E3B]'
                        : 'bg-white border border-[#302B45]/12 text-[#302B45] hover:border-[#7557D9]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isLearned ? 'Learned' : 'Mark Learned'}</span>
                  </button>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <h4 className="font-display font-extrabold text-xl text-[#302B45]">
                    {item.word}
                  </h4>
                  <span className="font-mono-phonetic text-xs text-[#7557D9]">{item.phonetic}</span>
                </div>

                {translation && (
                  <p className="text-xs font-semibold text-[#48B8E8] mb-1">
                    Translation: {translation}
                  </p>
                )}

                <p className="text-sm text-[#302B45]/80 mb-2">{item.definition}</p>
                <p className="text-xs text-[#302B45]/65 italic">“{item.exampleSentence}”</p>
              </div>

              <AudioControls text={item.word} label="Hear Word" compact />
            </div>
          );
        })}
      </div>
    </div>
  );
};
