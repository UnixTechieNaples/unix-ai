export function speakJarvis(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const cleanText = text.replace(/```[\s\S]*?```/g, "Codice mostrato a schermo.").replace(/[*_#]/g, "");
  const utterance = new SpeechSynthesisUtterance(cleanText);

  utterance.lang = "it-IT";
  utterance.pitch = 0.85;
  utterance.rate = 1.05;

  const voices = window.speechSynthesis.getVoices();
  const italianVoice = voices.find((v) => v.lang.includes("it"));
  if (italianVoice) {
    utterance.voice = italianVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopJarvisVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}