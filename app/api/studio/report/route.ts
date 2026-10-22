import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { topic, format } = await req.json();
    if (!topic) return NextResponse.json({ success: false, error: "Argomento mancante." }, { status: 400 });

    const generatedContent = await callGemini(`Genera ${format === "ebook" ? "un Ebook" : "un Report"} dettagliato sull'argomento: ${topic}`);
    return NextResponse.json({
      success: true,
      documentType: format || "report",
      topic,
      content: generatedContent,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
