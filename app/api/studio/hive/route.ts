import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ success: false, error: "Prompt mancante." }, { status: 400 });

    const unifiedReply = await callGemini(`MENTE ALVEARE: ${prompt}`);
    return NextResponse.json({
      success: true,
      hiveResponse: unifiedReply,
      activeAgents: ["ArchitectAgent", "SecurityAgent", "InnovationAgent"],
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
