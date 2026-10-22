import { NextResponse } from "next/server";
import { chiamaGroq } from "@/lib/cliente-groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 1. Ricerca Generica via Tavily / Serper (se la chiave è presente nelle variabili d'ambiente)
async function cercaConApi(query: string): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: tavilyKey, query: query, search_depth: "advanced" })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map((r: any) => `- ${r.title}: ${r.content}`).join("\n");
        }
      }
    } catch (e) {
      console.error("Errore Tavily API:", e);
    }
  }
  return "";
}

// 2. Ricerca Open / DuckDuckGo Fallback
async function cercaOpenWeb(query: string): Promise<string> {
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
    if (res.ok) {
      const data = await res.json();
      let testo = "";
      if (data.AbstractText) testo += `Sintesi: ${data.AbstractText}\n`;
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        const argomenti = data.RelatedTopics.filter((t: any) => t.Text).slice(0, 4).map((t: any) => t.Text).join("\n- ");
        if (argomenti) testo += `Dettagli estesi:\n- ${argomenti}\n`;
      }
      return testo;
    }
  } catch (e) {
    console.error("Errore Open Web:", e);
  }
  return "";
}

// 3. Parser HTML per estrazione di emergenza su qualsiasi query
async function cercaHtmlGrezzo(query: string): Promise<string> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    if (res.ok) {
      const html = await res.text();
      const regex = /<a class="result__snippet[^>]*>(.*?)<\/a>/g;
      const snippet = [];
      let match;
      while ((match = regex.exec(html)) !== null && snippet.length < 5) {
        const t = match[1].replace(/<[^>]+>/g, "").trim();
        if (t) snippet.push(t);
      }
      if (snippet.length > 0) return "Risultati estratti dalla rete:\n- " + snippet.join("\n- ");
    }
  } catch (e) {
    console.error("Errore HTML Scraper:", e);
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messaggioUtente = body?.message || body?.messages?.[body?.messages?.length - 1]?.content || "Ciao";

    // Esegui la ricerca multilivello
    let datiRete = await cercaConApi(messaggioUtente);
    if (!datiRete) datiRete = await cercaOpenWeb(messaggioUtente);
    if (!datiRete) datiRete = await cercaHtmlGrezzo(messaggioUtente);

    let promptCompletato = `[ISTRUZIONE TASSATIVA]: Sei UNIX-AI. Hai accesso completo alla rete Internet. Rispondi OBBLIGATORIAMENTE ed ESCLUSIVAMENTE in ITALIANO.

`;

    if (datiRete) {
      promptCompletato += `[FONTI E DATI RILEVATI IN TEMPO REALE DALLA RETE]:
${datiRete}

Usa tutte queste informazioni per fornire una risposta dettagliata, precisa e completa.

`;
    }

    promptCompletato += `[DOMANDA UTENTE]: ${messaggioUtente}`;

    const risposta = await chiamaGroq(promptCompletato);

    return NextResponse.json({
      success: true,
      response: risposta,
      message: risposta,
      fontiWeb: datiRete ? true : false
    });
  } catch (errore: any) {
    return NextResponse.json(
      { success: false, error: errore?.message || "Errore elaborazione." },
      { status: 500 }
    );
  }
}
