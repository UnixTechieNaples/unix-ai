import { NextResponse } from "next/server";
import { processStudioCommand } from "@/lib/ai/orchestrator";

// Pulizia sicura che rimuove i simboli fastidiosi senza rompere l'URL audio di Google
function cleanTextForTTS(text: string): string {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, "Blocco di codice elaborato.")
    .replace(/[`#_*~\\\/]/g, " ")
    .replace(/[-–—]/g, " ")
    .replace(/[\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const { prompt, memoryContext } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt mancante." }, { status: 400 });
    }

    // 1. Esegue il comando tramite l'orchestratore Groq
    const result = await processStudioCommand({ userPrompt: prompt, memoryContext });
    const responseText = result?.reply || "Elaborazione completata dal core.";

    // 2. Generazione Audio TTS stabile
    let audioBase64: string | null = null;
    try {
      const speechText = cleanTextForTTS(responseText);

      if (speechText.length > 0) {
        // Limite aumentato a 600 caratteri per leggere discorsi lunghi senza tagli
        const encodedText = encodeURIComponent(speechText.slice(0, 600));
        const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=it&client=tw-ob`;

        const ttsResponse = await fetch(googleTtsUrl, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://translate.google.com/"
          },
        });

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          audioBase64 = `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString("base64")}`;
        }
      }
    } catch (ttsError) {
      console.error("Errore generazione TTS:", ttsError);
    }

    return NextResponse.json({
      success: true,
      reply: responseText,
      patches: result.patches || null,
      audio: audioBase64,
    });

  } catch (error: any) {
    console.error("Errore API Studio:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Errore sconosciuto nel server." }, 
      { status: 500 }
    );
  }
}