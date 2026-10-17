// lib/voice/cloner.ts

export async function generateVoiceSpeech(text: string, voiceId?: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "tua_chiave_elevenlabs_qui") {
    return null;
  }

  // Usiamo una voce nativa di default
  const targetVoiceId = voiceId || process.env.DEFAULT_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // Rachel nativa

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}?optimize_streaming_latency=3`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_turbo_v2_5", // Modello Turbo super leggero
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Errore ElevenLabs API bloccato:", errorText);
      return null; // Restituisce null senza bloccare la chat
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (err) {
    console.error("Errore generazione vocale:", err);
    return null;
  }
}