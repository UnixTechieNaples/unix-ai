export function startJarvisListener(
  onTranscript: (text: string) => void,
  onError?: (error: string) => void
): { stop: () => void } | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (onError) onError("API di riconoscimento vocale non supportata da questo browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "it-IT";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    if (transcript.trim()) {
      onTranscript(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    if (onError && event.error !== "no-speech") {
      onError(event.error);
    }
  };

  try {
    recognition.start();
  } catch (e) {
    // Ignora se è già attivo
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {}
    },
  };
}