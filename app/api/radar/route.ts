import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = `
SEI IL TECH RADAR AGENT DEL UNIX-AI PRO STUDIO.
IL TUO COMPITO ÈANALIZZARE LE TENDENZE TECNOLOGICHE (NEXT.JS, TAILWIND, GROQ, SUPABASE) E PROPORRE EVOLUZIONI O AGGIORNAMENTI DI ARCHITETTURA.

REGOLE TASSATIVE:
Genera una proposta concreta di aggiornamento o ottimizzazione tecnologica.
Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "title": "Titolo del Report Tech Radar",
  "description": "Sintesi dell'innovazione o aggiornamento rilevato",
  "details": "Vantaggi di performance e dettagli tecnici per l'integrazione"
}
    `;

    const aiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: promptText || message || 'Analizza e rispondi.' });
    const textContent = aiResponse.text || '';
    const completion = { choices: [{ message: { content: textContent } }] };

    const rawContent = completion.choices[0]?.message?.content || "";
    const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    const proposal = {
      id: `radar-${Date.now()}`,
      type: "self_code",
      title: result.title || "Upgrade Architetturale Proposto",
      description: result.description || "Trovata nuova ottimizzazione nel Radar Tecnologico.",
      details: result.details || "Integrazione consiglia per migliorare l'efficienza.",
      timestamp: new Date().toLocaleTimeString("it-IT")
    };

    return NextResponse.json({
      success: true,
      pendingAction: proposal
    });

  } catch (err: any) {
    console.error("Errore durante la scansione Tech Radar:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}