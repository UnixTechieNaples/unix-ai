import { NextResponse } from "next/server";
import { chiamaGroq } from "@/lib/cliente-groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TAVILY_KEY = process.env.TAVILY_API_KEY || "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";

async function cercaSuTavilyOWeb(query: string): Promise<string> {
  // 1. Tentativo con Tavily API
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 5
      })
    });

    if (res.ok) {
      const data = await res.json();
      let testoTavily = "";
      if (data.answer) {
        testoTavily += `Sintesi Tavily: ${data.answer}\n`;
      }
      if (data.results && Array.isArray(data.results)) {
        testoTavily += data.results.map((r: any) => `- ${r.title}: ${r.content}`).join("\n");
      }
      if (testoTavily.trim().length > 20) {
        return testoTavily;
      }
    }
  } catch (err) {
    console.error("Errore Tavily:", err);
  }

  // 2. Fallback diretto HTML Web Scraping su DuckDuckGo se Tavily fallisce o è vuoto
  try {
    const htmlRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const regex = /<a class="result__snippet[^>]*>(.*?)<\/a>/g;
      const snippet = [];
      let match;
      while ((match = regex.exec(html)) !== null && snippet.length < 5) {
        const t = match[1].replace(/<[^>]+>/g, "").trim();
        if (t) snippet.push(t);
      }
      if (snippet.length > 0) {
        return "Risultati web estratti direttamente:\n- " + snippet.join("\n- ");
      }
    }
  } catch (err) {
    console.error("Errore Scraping Web:", err);
  }

  return "Nessun risultato specifico trovato online in questo momento.";
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

    // Ricerca live sulla rete
    const informazioniLive = await cercaSuTavilyOWeb(textToAnalyze);

    let promptCompletato = `[ISTRUZIONE TASSATIVA E INDEROGABILE]: Sei UNIX-AI, un super-agente connesso a Internet. Rispondi SEMPRE ed ESCLUSIVAMENTE in lingua ITALIANA.\n\n` +
      `Ti sono stati forniti dati aggiornati prelevati direttamente dalla rete in tempo reale:\n` +
      `----------------------------------------\n` +
      `${informazioniLive}\n` +
      `----------------------------------------\n\n` +
      `REGOLE ASSOLUTE:\n` +
      `1. Utilizza OBBLIGATORIAMENTE le informazioni sopra per rispondere alla domanda dell'utente.\n` +
      `2. È SEVERAMENTE VIETATO dire che non hai accesso a Internet o ai dati in tempo reale.\n` +
      `3. È SEVERAMENTE VIETATO invitare l'utente a consultare siti esterni o app.\n` +
      `4. Se i dati contengono notizie, calendari o informazioni, riassumili e formluali direttamente tu nella risposta.\n\n` +
      `[DOMANDA DELL'UTENTE]: ${textToAnalyze}`;

    const reply = await chiamaGroq(promptCompletato);

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
