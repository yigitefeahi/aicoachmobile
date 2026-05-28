import { API_BASE, buildAuthHeaders } from "@/lib/api";
import { applyEnglishSpeechVoice } from "@/lib/browser-tts-en";
import { speakableText } from "@/lib/safe-text";

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function fetchOpenAiTtsArrayBuffer(text: string): Promise<ArrayBuffer> {
  const plain = speakableText(text);
  const res = await fetch(`${API_BASE}/tts?text=${encodeURIComponent(plain.slice(0, 4000))}`, {
    method: "POST",
    credentials: "include",
    headers: buildAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(`TTS request failed (${res.status})`);
  }

  const data = (await res.json()) as { audio_base64?: string };
  if (!data?.audio_base64) {
    throw new Error("TTS response missing audio");
  }

  return base64ToArrayBuffer(data.audio_base64);
}

/** Browser fallback when OpenAI TTS is unavailable — returns estimated duration in ms. */
export function speakWithBrowserTts(text: string): Promise<number> {
  const plain = speakableText(text);
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      reject(new Error("Speech synthesis unavailable"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(plain);
    applyEnglishSpeechVoice(utterance);
    utterance.onend = () => resolve(Math.max(1200, plain.split(/\s+/).length * 320));
    utterance.onerror = () => reject(new Error("Speech synthesis failed"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}
