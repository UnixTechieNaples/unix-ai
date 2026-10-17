// lib/voice/cloner.ts

export async function generateVoiceSpeech(text: string, voiceId?: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "tua_chiave_elevenlabs_qui") {
    return null;
  }

  // Voice ID predefinito (es. Rachel) o personalizzato
  const targetVoiceId = voiceId || process.env.DEFAULT_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

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
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      console.error("Errore ElevenLabs API:", await response.text());
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