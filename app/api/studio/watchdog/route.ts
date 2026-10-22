import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawContent = await callGemini("Analizza lo stato del codice ed esponi in JSON valido: { "hasBug": false, "title": "...", "description": "...", "details": "...", "affectedFile": "..." }");
    const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    if (result.hasBug) {
      return NextResponse.json({
        success: true,
        pendingAction: {
          id: `bugfix-${Date.now()}`,
          type: "bugfix",
          title: result.title || "Ottimizzazione",
          description: result.description || "Inefficienza trovata.",
          details: result.details,
          timestamp: new Date().toLocaleTimeString("it-IT")
        }
      });
    }

    return NextResponse.json({ success: true, message: "Nessun bug rilevato." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
