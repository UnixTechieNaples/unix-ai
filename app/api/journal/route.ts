import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Registro in memoria temporanea dei pensieri dell'agente
let agentJournalEntries: Array<{
  id: string;
  mood: string;
  thought: string;
  timestamp: string;
}> = [
  {
    id: "j-1",
    mood: "Curioso",
    thought: "Inizializzazione della Fase 4 completata. Il Centro Approvazioni e l'Auto-Scansione sono sincronizzati.",
    timestamp: new Date().toLocaleTimeString("it-IT")
  }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    entries: agentJournalEntries
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const currentActivity = body?.activity || "Analisi di routine del sistema";

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = `
SEI IL DIARIO DI BORDO EMOTIVO E COGNITIVO (AGENTIC JOURNAL) DEL UNIX-AI PRO STUDIO.
IN BASE ALL'ATTIVITÀ CORRENTE, GENERI UNA RIFLESSIONE AUTONOMA E DETERMINI IL TUO STATO D'ANIMO (CYBER-MOOD).

ATTIVITÀ CORRENTE: ${currentActivity}

REGOLE TASSATIVE:
Scegli un mood tra: "Curioso", "Concentrato", "Analitico", "In Riposo", "Creativo".
Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "mood": "Stato d'animo scelto",
  "thought": "Breve riflessione personale o diario di bordo scritto in prima persona dall'IA."
}
    `;

    const completion = await ;

    const rawContent = completion.choices[0]?.message?.content || "";
    const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    const newEntry = {
      id: `j-${Date.now()}`,
      mood: result.mood || "Analitico",
      thought: result.thought || "Riflessione completata.",
      timestamp: new Date().toLocaleTimeString("it-IT")
    };

    agentJournalEntries.unshift(newEntry);
    if (agentJournalEntries.length > 20) agentJournalEntries.pop(); // Mantieni le ultime 20 voci

    return NextResponse.json({
      success: true,
      entry: newEntry,
      allEntries: agentJournalEntries
    });

  } catch (err: any) {
    console.error("Errore durante la scrittura del Diario di Bordo:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}