# LittleLingo AI

An interactive, child-safe AI-powered English learning adventure for children ages 4–12 guided by **Lumo**.

## Core Features
- **5-Step Child-Safe Onboarding**: Welcome screen, Parent Setup with COPPA/GDPR-K consent & 4-digit PIN, Child Profile customization, 3-question Initial Assessment, and Personalized Learning Path (plus Guest Demo mode and `?autostart=1` shortcut).
- **7 Learning Worlds**:
  1. **Alphabet Forest**: All 26 English letters (`A–Z`), letter names vs phonetic sounds (`/biː/` vs `/b/`), multiple sound notes, audio playback, and interactive pointer/touch letter tracing.
  2. **Phonics Mountain**: Beginning/ending sounds, short/long vowels, consonant digraphs (`sh`, `ch`, `th`), and CVC blending (`CAT`, `DOG`, `SUN`, `PEN`, `MAP`, `FISH`, `SHIP`).
  3. **Vocabulary Kingdom**: 9 categories (*Animals, Fruits, Colors, Numbers 1–100, Body Parts, Family, Food, Objects, Nature*) with vector illustrations, phonetics, multilingual support translations, and example sentences.
  4. **Word Builder**: Letter-tile spelling and spelling detective drills.
  5. **Sentence City**: `I am`, `This is`, pronouns, articles (`a`/`an`), plurals, and word-ordering puzzles.
  6. **Everyday Island**: Practical polite greetings, introductions, and daily requests.
  7. **Story Cove**: Illustrated read-along stories with word-by-word highlighting, repeat-after-me practice, and comprehension quizzes.
- **AI Pronunciation Coach**: Normal and slow reference audio, microphone recording / transcript check, Gemini evaluation via `/api/pronunciation/evaluate`, and offline heuristic fallback that never shames accents.
- **AI Teacher Lumo**: Predefined child-safe English conversation topics via `/api/ai/conversation` (`gemini-4-hydrogen`) with server-side content moderation and gentle grammar tips.
- **PIN-Protected Parent Dashboard**: Learning time, mastered letters & words, weekly activity chart, daily screen-time limit, offline lesson pack manager, JSON data export, and profile deletion.

## Environment Variables
Configure in `.env` or AI Studio Secrets:
- `GEMINI_API_KEY`: Server-side Gemini API key used by `server.ts` (never exposed to browser code).
- `PORT`: Server port (defaults to `3000`).

## Scripts & Verification
- `npm run dev`: Starts Express + Vite dev server on port `3000`.
- `npm run build`: Builds the production frontend bundle into `dist/`.
- `npm run lint`: Runs `tsc --noEmit` TypeScript check.
- `npx --yes tsx --test src/utils/learningEngine.test.ts`: Runs deterministic unit tests for placement, grading, XP/rewards, spaced repetition, and pronunciation fallback logic.
