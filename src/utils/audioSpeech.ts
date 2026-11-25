// Child-friendly speech & sound synthesis helper with offline Web Speech fallback

let activeAudioEl: HTMLAudioElement | null = null;

export function playToneFeedback(type: 'success' | 'try_again' | 'celebrate', enabled = true): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes =
      type === 'celebrate'
        ? [523.25, 659.25, 783.99, 1046.5]
        : type === 'success'
          ? [523.25, 659.25]
          : [392.0, 349.23];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type === 'try_again' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.001, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.11, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.24);
    });
  } catch {
    // AudioContext blocked or unavailable in headless mode
  }
}

export function stopSpeaking(): void {
  if (activeAudioEl) {
    activeAudioEl.pause();
    activeAudioEl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export async function speakEnglish(
  text: string,
  options?: {
    rate?: number;
    preferServerTTS?: boolean;
    onWordBoundary?: (wordIndex: number) => void;
    onEnd?: () => void;
  }
): Promise<{ mode: 'server_tts' | 'device_tts' | 'silent' }> {
  const rate = options?.rate ?? 0.95;
  stopSpeaking();

  // Optional online Gemini TTS for crisp story/tutor lines when enabled & online
  if (options?.preferServerTTS && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const res = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, slow: rate < 0.8 }),
      });
      if (res.ok) {
        const data = (await res.json()) as { audioBase64?: string };
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          activeAudioEl = audio;
          audio.playbackRate = rate < 0.8 ? 0.85 : 1.0;
          audio.onended = () => options?.onEnd?.();
          await audio.play();
          return { mode: 'server_tts' };
        }
      }
    } catch {
      // Fall back to offline device speechSynthesis below
    }
  }

  // Offline-first Web Speech API fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.08;

    const words = text.split(/\s+/);
    let currentIdx = 0;
    utterance.onboundary = (event) => {
      if (event.name === 'word' && options?.onWordBoundary) {
        options.onWordBoundary(Math.min(words.length - 1, currentIdx));
        currentIdx += 1;
      }
    };
    utterance.onend = () => {
      options?.onEnd?.();
    };
    utterance.onerror = () => {
      options?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return { mode: 'device_tts' };
  }

  options?.onEnd?.();
  return { mode: 'silent' };
}
