import { NextResponse } from "next/server";
import { processStudioCommand } from "@/lib/ai/orchestrator";

export async function POST(req: Request) {
  try {
    const { messages, userId, userName } = await req.json();

    // Estraiamo l'ultimo messaggio dell'utente dalla cronologia inviata dal frontend
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';

    if (!lastMessage) {
      return NextResponse.json({ success: false, error: "Messaggio mancante." }, { status: 400 });
    }

    // Eseguiamo il comando tramite l'orchestratore unificato
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