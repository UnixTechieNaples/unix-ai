import { NextResponse } from "next/server";
import { chiamaGroq } from "@/lib/cliente-groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messaggioUtente = body?.message || body?.messages?.[body?.messages?.length - 1]?.content || "Ciao";

    const rispostaIstruita = await chiamaGroq(messaggioUtente);

    return NextResponse.json({
      success: true,
      response: rispostaIstruita,
      message: rispostaIstruita
    });
  } catch (errore: any) {
    return NextResponse.json(
      { success: false, error: errore?.message || "Errore durante l'elaborazione della risposta." },
      { status: 500 }
    );
  }
}
