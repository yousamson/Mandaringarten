import type { Language } from './garden-data';

export type Script = 'trad' | 'simp';
export const scriptFor = (language: Language): Script => (language === 'zh-Hans' ? 'simp' : 'trad');

/** Speak Mandarin, always cancelling anything already being narrated first. */
export function speakMandarin(text: string, script: Script, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = script === 'simp' ? 'zh-CN' : 'zh-TW';
  utterance.rate = 0.8;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
