import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { getNeuroniUtente, salvaNeuroneUtente } from "@/lib/db/memory";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body?.userId || "admin-super-unix";
    const neuroni = await getNeuroniUtente(userId);

    const prompt = `SEI IL MOTORE DEL CICLO ONIRICO. Analizza e sintetizza questi nodi di memoria in JSON valido: { "dreamSummary": "...", "optimizedNode": { "title": "...", "content": "..." } } \n ${JSON.stringify(neuroni)}`;
    const rawContent = await callGemini(prompt);
    const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    let createdNode = null;
    if (result.optimizedNode) {
      createdNode = {
        id: `dream-${Date.now()}`,
        title: result.optimizedNode.title,
        content: result.optimizedNode.content,
        type: "memory",
        timestamp: new Date().toLocaleTimeString("it-IT")
      };
      await salvaNeuroneUtente(userId, createdNode);
    }

    return NextResponse.json({
      success: true,
      dreamSummary: result.dreamSummary || "Ciclo onirico completato.",
      newMemoryNode: createdNode
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
