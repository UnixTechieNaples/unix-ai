import { NextResponse } from "next/server";
import { processStudioCommand } from "@/lib/ai/orchestrator";

// Forza Next.js a considerare questa rotta sempre dinamica (risolve l'errore di build)
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages, userId, userName } = await req.json();

    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';

    if (!lastMessage) {
      return NextResponse.json({ success: false, error: "Messaggio mancante." }, { status: 400 });
    }

    const result = await processStudioCommand({
      userPrompt: lastMessage,
      userId,
      userName,
    });

    return NextResponse.json({
      success: true,
      reply: result.reply,
    });

  } catch (error: any) {
    console.error("Errore critico in /api/chat:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Errore sconosciuto nel server." },
      { status: 500 }
    );
  }
}