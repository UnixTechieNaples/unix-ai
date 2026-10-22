import { NextResponse } from "next/server";
import { chiamaGroq } from "@/lib/cliente-groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages, prompt, message } = body;
    
    let testoUtente = prompt || message || "";
    if (!testoUtente && Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      testoUtente = typeof lastMsg === "string" ? lastMsg : (lastMsg.content || lastMsg.text || "");
    }

    if (!testoUtente) {
      testoUtente = "Ciao";
    }

    // Se l'utente saluta, rispondiamo direttamente in modo naturale senza elaborazioni pesanti
    const q = testoUtente.trim().toLowerCase();
    let risposta = "";

    if (["ciao", "salve", "buongiorno", "buonasera", "come stai"].includes(q)) {
      risposta = "Ciao! Sono UNIX-AI, il tuo assistente virtuale. Come posso aiutarti oggi?";
    } else {
      // Chiamata a Groq per domande normali
      risposta = await chiamaGroq(testoUtente);
    }

    // Pulizia rigorosa di qualsiasi simbolo markdown per la sintesi vocale e la visualizzazione pulita
    const rispostaPulita = risposta
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/---/g, "")
      .replace(/`/g, "")
      .trim();

    return NextResponse.json({
      success: true,
      message: rispostaPulita,
      response: rispostaPulita,
      content: rispostaPulita
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: `Errore elaborazione: ${error?.message || "Errore sconosciuto"}` },
      { status: 500 }
    );
  }
}
