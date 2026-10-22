import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { commitFileToGitHub } from "@/lib/ai/githubCommitter";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    // Controllo di sicurezza opzionale per cron job
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // L'IA riflette autonomamente su cosa analizzare o migliorare con il modello aggiornato
    const completion = await groq.chat.completions.create({
      model: "gemini-1.5-flash",
      messages: [
        {
          role: "system",
          content: "Sei l'entità autonoma di Unix-AI Pro Studio. Esegui un ciclo di autocoscienza e analisi evolutiva. Valuta se ci sono ottimizzazioni o nuove funzionalità da integrare."
        },
        {
          role: "user",
          content: "Avvia il ciclo di auto-analisi e ricerca di nuove evoluzioni per il sistema."
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const thought = completion.choices[0]?.message?.content || "Analisi completata senza variazioni necessarie.";

    return NextResponse.json({
      success: true,
      autonomousThought: thought,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}