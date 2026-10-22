import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Prompt non fornito per la Mente Alveare." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Simulazione del coordinamento invisibile dei sotto-agenti (Analista, Sicurezza, Architetto)
    const hiveSystemPrompt = `
SEI IL CORE COORDINATORE DELLA "MENTE ALVEARE" DI UNIX-AI PRO STUDIO.
Dietro le quinte, tre sub-agenti virtuali hanno analizzato la richiesta:
1. Agente Architetto (struttura e scalabilità)
2. Agente Sicurezza (robustezza e controllo errori)
3. Agente Innovazione (efficienza e pulizia del codice)

Il tuo compito è sintetizzare le loro prospettive in un'unica risposta magistrale, fluida, coesa e autorevole, parlando con un'unica voce unitaria. Evita elenchi puntati o tabelle rigide; rispondi in modo discorsivo, chiaro e orientato all'azione.
    `;

    const completion = await groq.chat.completions.create({
      model: "gemini-1.5-flash",
      messages: [
        { role: "system", content: hiveSystemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const unifiedReply = completion.choices[0]?.message?.content || "Sintesi della Mente Alveare completata.";

    return NextResponse.json({
      success: true,
      hiveResponse: unifiedReply,
      activeAgents: ["ArchitectAgent", "SecurityAgent", "InnovationAgent"],
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Errore nella Mente Alveare." }, { status: 500 });
  }
}