import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const prompt = "SEI IL TECH RADAR AGENT. Analizza le tendenze e proponi un aggiornamento in JSON valido: { \"title\": \"...\", \"description\": \"...\", \"details\": \"...\" }";
    const rawContent = await callGemini(prompt);
    const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    return NextResponse.json({
      success: true,
      pendingAction: {
        id: `radar-${Date.now()}`,
        type: "self_code",
        title: result.title || "Upgrade Proposto",
        description: result.description || "Ottimizzazione rilevata.",
        details: result.details || "Integrazione consigliata.",
        timestamp: new Date().toLocaleTimeString("it-IT")
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
