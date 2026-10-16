import { NextResponse } from "next/server";
import { processStudioCommand } from "@/lib/ai/orchestrator";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ status: "API Chat attiva e pronta." }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    const { messages, userId, userName } = body;
    const lastMessage = messages && Array.isArray(messages) && messages.length > 0 
      ? messages[messages.length - 1].content 
      : '';

    if (!lastMessage) {
      return NextResponse.json({ 
        success: true, 
        reply: "Sistema operativo pronto. Inserisci un comando o una domanda." 
      });
    }

    const result = await processStudioCommand({
      userPrompt: lastMessage,
      userId,
      userName,
    });

    return NextResponse.json({
      success: true,
      reply: result?.reply || "Elaborazione completata.",
    });

  } catch (error: any) {
    console.error("Errore critico in /api/chat:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Errore sconosciuto nel server." },
      { status: 500 }
    );
  }
}