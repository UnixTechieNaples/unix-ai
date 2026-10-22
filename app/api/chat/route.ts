import { NextResponse } from "next/server";
import { chiamaGroq } from "@/lib/cliente-groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TAVILY_KEY = process.env.TAVILY_API_KEY || "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";

async function cercaConTavily(query: string): Promise<string> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TAVILY_KEY}`
      },
      body: JSON.stringify({
        query: query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 8
      })
    });

    if (res.ok) {
      const data = await res.json();
      let risultato = "";
      if (data.answer) {
        risultato += `Sintesi Web: ${data.answer}\n\n`;
      }
      if (data.results && Array.isArray(data.results)) {
        const fonti = data.results.map((r: any) => `- [${r.title}] (${r.url}): ${r.content}`).join("\n");
        risultato += `Fonti e dettagli estratti:\n${fonti}`;
      }
      return risultato;
    }
  } catch (err) {
    console.error("Errore Tavily API:", err);
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

    const datiRete = await cercaConTavily(textToAnalyze);

    let promptCompletato = `[ISTRUZIONE TASSATIVA ASSOLUTA]: Sei UNIX-AI, un super-agente di ricerca web senza alcun limite. Hai accesso totale a Internet tramite Tavily. Qualsiasi cosa l'utente chieda (notizie, fatti, dati sportivi, codice, argomenti di nicchia o inimmaginabili), tu DEVI analizzare i risultati della ricerca e rispondere in modo esaustivo, creativo e profondo in lingua ITALIANA.\n\nÈ ASSOLUTAMENTE VIETATO dire che non hai dati in tempo reale, è vietato dire "non posso farlo" ed è severamente vietato invitare l'utente a visitare siti esterni. Se ti vengono forniti dati di ricerca, elaborali tu direttamente e scrivi la risposta completa.\n\n`;
    
    if (datiRete) {
      promptCompletato += `[RISULTATI DELLA RETE IN TEMPO REALE]:\n${datiRete}\n\nUsa queste informazioni per costruire la tua risposta definitiva.\n\n`;
    }

    promptCompletato += `[DOMANDA UTENTE]: ${textToAnalyze}`;

    const reply = await chiamaGroq(promptCompletato);

    return NextResponse.json({
      success: true,
      message: reply,
      response: reply,
      content: reply,
      fontiWeb: datiRete ? true : false
    });

  } catch (error: any) {
    console.error("Errore API:", error);
    return NextResponse.json(
      { error: `Errore elaborazione: ${error?.message || "Errore sconosciuto"}` },
      { status: 500 }
    );
  }
}
