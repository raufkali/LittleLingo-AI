import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { LEARNING_WORLDS, AI_SCENARIOS } from './src/data/curriculum';
import {
  calculateLessonRewards,
  generatePersonalizedRecommendations,
} from './src/utils/learningEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const app = express();

app.use(express.json({ limit: '8mb' }));

// Simple per-IP in-memory rate limiter for API protection
const rateWindowMs = 60_000;
const maxRequestsPerWindow = 90;
const requestLog = new Map<string, number[]>();

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || 'local';
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < rateWindowMs);
  if (timestamps.length >= maxRequestsPerWindow) {
    res.status(429).json({ error: 'Too many requests. Please take a short breather and try again.' });
    return;
  }
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  next();
}

app.use('/api', rateLimit);

// Child-safety keyword screening before AI calls
const UNSAFE_PATTERNS = /\b(kill|murder|weapon|gun|knife|blood|sex|porn|nude|naked|drug|alcohol|beer|wine|suicide|die|dead|horror|demon|curse|hate|stupid|idiot)\b/i;

function isChildSafeText(text: string): boolean {
  return !UNSAFE_PATTERNS.test(text);
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Lightweight parent-managed server progress store (mirrors client offline-first sync)
const serverProgressStore = new Map<
  string,
  {
    nickname: string;
    totalXP: number;
    completedLessonIds: string[];
    confusedLetters: Record<string, number>;
    misspelledWords: Record<string, number>;
    updatedAt: string;
  }
>();

app.get('/api/health', (_req, res) => {
  const aiConfigured = Boolean(getGeminiClient());
  res.json({ ok: true, aiConfigured, timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', (req, res) => {
  const { nickname, ageRange, parentConsentGiven } = req.body || {};
  if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 1) {
    res.status(400).json({ error: 'Nickname is required.' });
    return;
  }
  if (!parentConsentGiven) {
    res.status(400).json({ error: 'Parental consent is required to create a child profile.' });
    return;
  }
  const userId = `learner-${Date.now()}`;
  serverProgressStore.set(userId, {
    nickname: nickname.trim().slice(0, 24),
    totalXP: 0,
    completedLessonIds: [],
    confusedLetters: {},
    misspelledWords: {},
    updatedAt: new Date().toISOString(),
  });
  res.json({ userId, nickname: nickname.trim().slice(0, 24), ageRange: ageRange || '7-9' });
});

app.post('/api/auth/login', (req, res) => {
  const { userId, nickname } = req.body || {};
  const id = typeof userId === 'string' && userId ? userId : 'learner-demo-1';
  const existing = serverProgressStore.get(id);
  if (!existing) {
    serverProgressStore.set(id, {
      nickname: typeof nickname === 'string' && nickname ? nickname : 'Ali',
      totalXP: 45,
      completedLessonIds: [],
      confusedLetters: {},
      misspelledWords: {},
      updatedAt: new Date().toISOString(),
    });
  }
  res.json({ userId: id, profile: serverProgressStore.get(id) });
});

app.get('/api/curriculum/worlds', (_req, res) => {
  res.json({ worlds: LEARNING_WORLDS });
});

app.get('/api/curriculum/lessons/:id', (req, res) => {
  const { id } = req.params;
  for (const world of LEARNING_WORLDS) {
    const lesson = world.lessons.find((l) => l.id === id);
    if (lesson) {
      res.json({ worldId: world.id, worldTitle: world.title, lesson });
      return;
    }
  }
  res.status(404).json({ error: 'Lesson not found.' });
});

app.post('/api/progress/complete', (req, res) => {
  const { userId, lessonId, correctCount, totalCount, currentStreak } = req.body || {};
  if (!lessonId || typeof lessonId !== 'string') {
    res.status(400).json({ error: 'lessonId is required.' });
    return;
  }
  const rewards = calculateLessonRewards(
    Number(correctCount || 0),
    Number(totalCount || 1),
    Number(currentStreak || 0)
  );
  const uid = typeof userId === 'string' && userId ? userId : 'learner-demo-1';
  const current = serverProgressStore.get(uid) || {
    nickname: 'Learner',
    totalXP: 0,
    completedLessonIds: [],
    confusedLetters: {},
    misspelledWords: {},
    updatedAt: new Date().toISOString(),
  };
  current.totalXP += rewards.xpEarned;
  if (!current.completedLessonIds.includes(lessonId)) {
    current.completedLessonIds.push(lessonId);
  }
  current.updatedAt = new Date().toISOString();
  serverProgressStore.set(uid, current);
  res.json({ rewards, profile: current });
});

app.get('/api/progress/dashboard', (req, res) => {
  const uid = String(req.query.userId || 'learner-demo-1');
  const profile = serverProgressStore.get(uid) || null;
  res.json({ userId: uid, profile });
});

app.get('/api/learning/recommendations', (req, res) => {
  const confusedBD = Number(req.query.confusedBD || 0);
  const recs = generatePersonalizedRecommendations(
    {
      completedLessons: {},
      confusedLetters: confusedBD > 0 ? { 'B-D': confusedBD } : {},
      misspelledWords: {},
      pronunciationHistory: [],
    },
    LEARNING_WORLDS
  );
  res.json({ recommendations: recs });
});

// Speech Recognition using Gemini 3.5 Transcribe
app.post('/api/speech/recognize', async (req, res) => {
  const { audioBase64, mimeType } = req.body || {};
  if (!audioBase64 || typeof audioBase64 !== 'string') {
    res.status(400).json({ error: 'audioBase64 is required.' });
    return;
  }
  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error: 'AI speech recognition service is unavailable right now.',
      code: 'AI_UNAVAILABLE',
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: typeof mimeType === 'string' ? mimeType : 'audio/webm',
              data: audioBase64,
            },
          },
          { text: 'Transcribe the child speaking English clearly. Return only the spoken English word or short sentence.' },
        ],
      },
    });
    const transcript = (response.text || '').trim();
    if (!isChildSafeText(transcript)) {
      res.json({ transcript: '', blocked: true });
      return;
    }
    res.json({ transcript });
  } catch (err) {
    console.error('Speech recognize error:', err);
    res.status(502).json({
      error: 'Speech recognition could not process the recording.',
      code: 'AI_ERROR',
    });
  }
});

// Pronunciation Evaluation using Gemini 4 Hydrogen (supports audio + text or transcript)
app.post('/api/pronunciation/evaluate', async (req, res) => {
  const { targetText, recognizedText, audioBase64, mimeType, ageRange } = req.body || {};
  if (!targetText || typeof targetText !== 'string') {
    res.status(400).json({ error: 'targetText is required.' });
    return;
  }
  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error: 'Online AI pronunciation coach is unavailable right now.',
      code: 'AI_UNAVAILABLE',
    });
    return;
  }

  try {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (audioBase64 && typeof audioBase64 === 'string') {
      parts.push({
        inlineData: {
          mimeType: typeof mimeType === 'string' ? mimeType : 'audio/webm',
          data: audioBase64,
        },
      });
    }
    parts.push({
      text: `Target English word/phrase: "${targetText}".
Child age range: ${ageRange || '4-12'}.
${recognizedText ? `Device transcript heard: "${recognizedText}".` : ''}
Evaluate the child's pronunciation warmly and honestly.
Rules:
- Never shame, rank, or penalize accent.
- Do not invent precise phoneme percentages.
- Distinguish clearly: (1) whether the intended word was recognized, (2) whether it is intelligible, (3) which sound or letter group may need gentle practice, (4) whether recording audio was clear.
- Keep feedback to 1-2 short, encouraging sentences a child understands.`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction:
          'You are Lumo, a warm, encouraging children’s English pronunciation coach. Always respond in simple, positive, child-safe English.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recognizedText: { type: Type.STRING },
            wordRecognized: { type: Type.BOOLEAN },
            isIntelligible: { type: Type.BOOLEAN },
            recordingClear: { type: Type.BOOLEAN },
            status: { type: Type.STRING, description: 'One of: great, good, try_again, unclear' },
            focusSound: { type: Type.STRING },
            feedback: { type: Type.STRING },
          },
          required: ['recognizedText', 'wordRecognized', 'isIntelligible', 'recordingClear', 'status', 'feedback'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim());
    res.json(parsed);
  } catch (err) {
    console.error('Pronunciation evaluate error:', err);
    res.status(502).json({
      error: 'Pronunciation service encountered an error.',
      code: 'AI_ERROR',
    });
  }
});

// Gemini TTS endpoint for Lumo & Story narration
app.post('/api/tts/speak', async (req, res) => {
  const { text, slow } = req.body || {};
  if (!text || typeof text !== 'string' || text.length > 400) {
    res.status(400).json({ error: 'Valid short text is required.' });
    return;
  }
  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({ error: 'TTS service unavailable.', code: 'AI_UNAVAILABLE' });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: slow
                  ? 'Warm, very clear, slow and gentle children English teacher'
                  : 'Warm, cheerful, crystal-clear children English teacher',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      res.status(502).json({ error: 'No audio returned.' });
      return;
    }
    res.json({ audioBase64, mimeType: 'audio/wav' });
  } catch (err) {
    console.error('TTS error:', err);
    res.status(502).json({ error: 'TTS synthesis failed.', code: 'AI_ERROR' });
  }
});

// AI English Teacher (Lumo) with strict child-safety guardrails
app.post('/api/ai/conversation', async (req, res) => {
  const { scenarioId, childMessage, childName, ageRange, level, history } = req.body || {};
  if (!childMessage || typeof childMessage !== 'string' || childMessage.trim().length === 0) {
    res.status(400).json({ error: 'childMessage is required.' });
    return;
  }
  if (childMessage.length > 300) {
    res.status(400).json({ error: 'Please keep messages short and simple.' });
    return;
  }

  // Validate scenario is from predefined safe list
  const scenario = AI_SCENARIOS.find((s) => s.id === scenarioId) || AI_SCENARIOS[0];

  // Server-side child-safety moderation check
  if (!isChildSafeText(childMessage)) {
    res.json({
      reply: `Let us keep our chat friendly and fun! Back to "${scenario.title}": ${scenario.starterPrompt}`,
      expression: 'encouraging',
      gentleCorrection: '',
      suggestedReplies: scenario.suggestedReplies,
      moderated: true,
    });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error: 'Lumo AI chat needs an online AI connection right now.',
      code: 'AI_UNAVAILABLE',
    });
    return;
  }

  try {
    const safeHistory = Array.isArray(history)
      ? history.slice(-6).map((m: { role: string; text: string }) => `${m.role === 'lumo' ? 'Lumo' : 'Child'}: ${String(m.text).slice(0, 200)}`).join('\n')
      : '';

    const systemInstruction = `You are Lumo, a friendly, patient cartoon English teacher for children ages 4-12.
STRICT CHILD SAFETY RULES:
- Never generate inappropriate, frightening, romantic, sexual, violent, scary, political, or adult content.
- Stay strictly inside the educational topic "${scenario.title}" (${scenario.subtitle}).
- If the child tries to change the subject to something unsafe or unrelated, gently guide them back to "${scenario.title}".
- Use simple, cheerful English vocabulary suited for age ${ageRange || '7-9'} and level ${level || 1}.
- Reply in 1-2 short sentences and ask one friendly follow-up question.
- If the child makes a small grammar mistake, put a very gentle, kind tip in gentleCorrection (e.g., 'Tip: We can say "I am happy!"'). Leave gentleCorrection empty if their English is already good!
- Provide 2-3 short suggestedReplies the child can tap next.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Child name: ${childName || 'Friend'}\nRecent chat:\n${safeHistory}\nChild just said: "${childMessage.trim()}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            expression: {
              type: Type.STRING,
              description: 'One of: happy, thinking, excited, encouraging, surprised, celebrating',
            },
            gentleCorrection: { type: Type.STRING },
            suggestedReplies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['reply', 'expression', 'gentleCorrection', 'suggestedReplies'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim());
    if (!isChildSafeText(parsed.reply || '')) {
      res.json({
        reply: `Great talking with you! ${scenario.starterPrompt}`,
        expression: 'happy',
        gentleCorrection: '',
        suggestedReplies: scenario.suggestedReplies,
      });
      return;
    }

    res.json(parsed);
  } catch (err) {
    console.error('AI conversation error:', err);
    res.status(502).json({
      error: 'Lumo could not reach the AI tutor right now.',
      code: 'AI_ERROR',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LittleLingo AI server running at http://localhost:${PORT}`);
  });
}

startServer();
