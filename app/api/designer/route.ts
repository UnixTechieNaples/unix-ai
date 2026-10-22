import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userMood = body?.mood || "curioso";

    const prompt = `SEI IL UI/UX SELF-DESIGNER. Stato d'animo: ${userMood}. Rispondi ESCLUSIVAMENTE in JSON valido con: title, description, details, accentColor.`;
    const rawContent = await callGemini(prompt);
    const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    return NextResponse.json({
      success: true,
      pendingAction: {
        id: `ui-${Date.now()}`,
        type: "ui_design",
        title: result.title || "Evoluzione UI",
        description: result.description || "Restyling visivo.",
        details: result.details || "Aggiornamento componenti.",
        timestamp: new Date().toLocaleTimeString("it-IT")
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
