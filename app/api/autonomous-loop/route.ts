import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const textContent = await callGemini("Analizza e proponi un miglioramento autonomo per il sistema.");
    return NextResponse.json({
      success: true,
      autonomousThought: textContent,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
