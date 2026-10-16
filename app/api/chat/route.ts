import { NextResponse } from "next/server";
import { processStudioCommand } from "@/lib/ai/orchestrator";

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages, userId, userName } = body || {};
    
    const lastMessage = messages && Array.isArray(messages) && messages.length > 0 
      ? messages[messages.length - 1].content 
      : (body.prompt || '');

    if (!lastMessage) {
      return NextResponse.json({ success: true, reply: "Pronto." });
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
    return NextResponse.json(
      { success: false, error: error?.message || "Errore server" },
      { status: 500 }
    );
  }
}