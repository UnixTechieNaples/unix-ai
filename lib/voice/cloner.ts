// lib/voice/cloner.ts

export async function generateVoiceSpeech(text: string, voiceId?: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "tua_chiave_elevenlabs_qui") {
    console.warn("ELEVENLABS_API_KEY mancante o non valida.");
    return null;
  }

  // Voice ID predefinito: priorità a voiceId passato -> DEFAULT_VOICE_ID da .env -> Voce di sistema Alice (Italiana)
  const targetVoiceId = voiceId || process.env.DEFAULT_VOICE_ID || "Xb7hH8MSLrq25POB3837";

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_flash_v2_5", // Modello Flash velocissimo e interamente compatibile con i piani gratuiti
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Errore ElevenLabs API:", errorText);

      // Fallback automatico: se la voce specificata fallisce (es. blocco su voce personalizzata),
      // ritenta immediatamente con la voce di sistema globale di default ("21m00Tcm4TlvDq8ikWAM")
      if (targetVoiceId !== "21m00Tcm4TlvDq8ikWAM") {
        console.log("Tentativo di ripiego con la voce di sistema predefinita...");
        return generateVoiceSpeech(text, "21m00Tcm4TlvDq8ikWAM");
      }

      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (err) {
    console.error("Errore generazione vocale:", err);
    return null;
  }
}