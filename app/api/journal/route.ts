import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let agentJournalEntries: Array<{ id: string; mood: string; thought: string; timestamp: string; }> = [];

export async function GET() {
  return NextResponse.json({ success: true, entries: agentJournalEntries });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const currentActivity = body?.activity || "Analisi di routine";
    const prompt = `SEI IL DIARIO DI BORDO. Attività: ${currentActivity}. Scegli un mood (Curioso, Concentrato, Analitico, Creativo) e scrivi una riflessione in JSON valido: { "mood": "...", "thought": "..." }`;
    
    const rawContent = await callGemini(prompt);
    const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    const newEntry = {
      id: `j-${Date.now()}`,
      mood: result.mood || "Analitico",
      thought: result.thought || "Riflessione completata.",
      timestamp: new Date().toLocaleTimeString("it-IT")
    };

    agentJournalEntries.unshift(newEntry);
    return NextResponse.json({ success: true, entry: newEntry, allEntries: agentJournalEntries });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
