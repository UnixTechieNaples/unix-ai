import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ status: "API Studio attiva" }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const { prompt, memoryContext, userId, userName } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt mancante." }, { status: 400 });
    }

    // Import dinamico dell'orchestratore per evitare esecuzioni anticipate durante il build
    let responseText = "Elaborazione completata dal core.";
    let patches = null;
    let audioBase64 = null;

    try {
      const { processStudioCommand } = await import("@lib/ai/orchestrator").catch(() => import("@/lib/ai/orchestrator"));
      const result = await processStudioCommand({ userPrompt: prompt, memoryContext, userId, userName });
      responseText = result?.reply || responseText;
      patches = result?.patches || null;
    } catch (orchestratorErr) {
      console.error("Errore orchestrazione dinamica:", orchestratorErr);
    }

    // Salvataggio memoria protetto da try/catch per evitare crash
    if (userId) {
      try {
        const { salvaUtente } = await import("@lib/db/memory").catch(() => import("@/lib/db/memory"));
        const ip = req.headers.get("x-forwarded-for") || "IP sconosciuto";
        const userAgent = req.headers.get("user-agent") || "Dispositivo sconosciuto";
        await salvaUtente(userId, `Domanda: "${prompt}" -> Risposta: "${responseText.slice(0, 150)}..."`, userName || "Utente", ip, userAgent);
      } catch (dbErr) {
        console.error("Errore salvataggio memoria:", dbErr);
      }
    }

    // Generazione TTS sicura
    try {
      if (responseText) {
        const cleanText = responseText.replace(/```[\s\S]*?```/g, "Blocco di codice.").replace(/[`#_*~\\\/]/g, " ").slice(0, 500);
        const encodedText = encodeURIComponent(cleanText);
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
      console.error("Errore TTS:", ttsError);
    }

    return NextResponse.json({
      success: true,
      reply: responseText,
      patches: patches,
      audio: audioBase64,
    });

  } catch (error: any) {
    console.error("Errore critico API Studio:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Errore sconosciuto nel server." }, 
      { status: 500 }
    );
  }
}