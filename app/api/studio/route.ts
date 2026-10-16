import { NextResponse } from "next/server";
import { processStudioCommand } from "@/lib/ai/orchestrator";
import { salvaUtente } from "@/lib/db/memory";

// Forza Next.js a considerare questa rotta sempre dinamica durante il build
export const dynamic = 'force-dynamic';

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
    const { prompt, memoryContext, userId, userName } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt mancante." }, { status: 400 });
    }

    const result = await processStudioCommand({ userPrompt: prompt, memoryContext, userId, userName });
    const responseText = result?.reply || "Elaborazione completata dal core.";

    const ip = req.headers.get("x-forwarded-for") || "IP sconosciuto";
    const userAgent = req.headers.get("user-agent") || "Dispositivo sconosciuto";

    if (userId) {
      try {
        await salvaUtente(userId, `Domanda: "${prompt}" -> Risposta: "${responseText.slice(0, 150)}..."`, userName || "Utente", ip, userAgent);
      } catch (dbErr) {
        console.error("Errore salvataggio memoria automatica:", dbErr);
      }
    }

    let audioBase64: string | null = null;
    try {
      const speechText = cleanTextForTTS(responseText);

      if (speechText.length > 0) {
        const encodedText = encodeURIComponent(speechText.slice(0, 500));
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