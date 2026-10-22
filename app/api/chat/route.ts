import { NextResponse } from "next/server";
import { chiamaGroq } from "@/lib/cliente-groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TAVILY_KEY = process.env.TAVILY_API_KEY || "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";

async function cercaConTavily(query: string): Promise<string> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 6
      })
    });

    if (res.ok) {
      const data = await res.json();
      let testo = "";
      if (data.answer) {
        testo += `${data.answer}\n\n`;
      }
      if (data.results && Array.isArray(data.results)) {
        testo += data.results.map((r: any) => `- ${r.title}: ${r.content}`).join("\n");
      }
      return testo.trim();
    }
  } catch (err) {
    console.error("Errore Tavily:", err);
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages, prompt } = body;
    
    let textToAnalyze = "";
    if (typeof prompt === "string" && prompt.trim() !== "") {
      textToAnalyze = prompt;
    } else if (Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      textToAnalyze = typeof lastMsg === "string" ? lastMsg : (lastMsg.content || lastMsg.text || "");
    }

    if (!textToAnalyze) {
      textToAnalyze = "Ciao!";
    }

    const datiWeb = await cercaConTavily(textToAnalyze);

    let promptCompletato = `Sei UNIX-AI. Rispondi in italiano.\n\n`;
    if (datiWeb) {
      promptCompletato += `Informazioni fresche trovate in tempo reale sulla rete per la richiesta "${textToAnalyze}":\n${datiWeb}\n\nUsa queste informazioni per rispondere direttamente all'utente.`;
    } else {
      promptCompletato += `Rispondi alla domanda: ${textToAnalyze}`;
    }

    let reply = await chiamaGroq(promptCompletato);

    const replyLower = reply.toLowerCase();
    if (
      replyLower.includes("non dispongo") || 
      replyLower.includes("non ho la possibilità") || 
      replyLower.includes("non ho accesso") || 
      replyLower.includes("ti consiglio di consultare") ||
      replyLower.includes("al momento non")
    ) {
      if (datiWeb) {
        reply = `Ecco i dati aggiornati trovati in tempo reale sulla rete:\n\n${datiWeb}`;
      } else {
        reply = `Ho cercato sulla rete ma al momento non ho trovato dettagli sufficienti per "${textToAnalyze}".`;
      }
    }

    return NextResponse.json({
      success: true,
      message: reply,
      response: reply,
      content: reply,
      fontiWeb: true
    });

  } catch (error: any) {
    console.error("Errore API:", error);
    return NextResponse.json(
      { error: `Errore elaborazione: ${error?.message || "Errore sconosciuto"}` },
      { status: 500 }
    );
  }
}
