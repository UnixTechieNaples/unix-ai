import { NextResponse } from "next/server";
import { chiamaGroq } from "@/lib/cliente-groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function cercaSuInternetUniversale(query: string): Promise<string> {
  try {
    // 1. Controllo meteo rapido per Napoli
    const queryLower = query.toLowerCase();
    if (queryLower.includes("meteo") || queryLower.includes("tempo")) {
      const meteoRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=40.8522&longitude=14.2681&current_weather=true&timezone=Europe%2FRome");
      if (meteoRes.ok) {
        const data = await meteoRes.json();
        if (data && data.current_weather) {
          return `Meteo live a Napoli: Temperatura ${data.current_weather.temperature}°C, Vento ${data.current_weather.windspeed} km/h.`;
        }
      }
    }

    // 2. Ricerca web generale per qualsiasi argomento tramite DuckDuckGo Instant Answer API
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    if (res.ok) {
      const data = await res.json();
      let risultatiTrovati = "";

      if (data.AbstractText) {
        risultatiTrovati += `Informazione principale: ${data.AbstractText}\n`;
      }

      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        const argomenti = data.RelatedTopics
          .filter((t: any) => t && t.Text)
          .slice(0, 3)
          .map((t: any) => t.Text)
          .join("\n- ");
        if (argomenti) {
          risultatiTrovati += `Dettagli correlati dal web:\n- ${argomenti}\n`;
        }
      }

      if (risultatiTrovati) {
        return risultatiTrovati;
      }
    }

    // 3. Fallback di ricerca HTML se l'API istantanea non restituisce dati
    const htmlRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const regex = /<a class="result__snippet[^>]*>(.*?)<\/a>/g;
      const snippet = [];
      let match;
      while ((match = regex.exec(html)) !== null && snippet.length < 3) {
        const testoPulito = match[1].replace(/<[^>]+>/g, "").trim();
        if (testoPulito) snippet.push(testoPulito);
      }
      if (snippet.length > 0) {
        return "Risultati web estratti:\n- " + snippet.join("\n- ");
      }
    }

  } catch (err) {
    console.error("Errore durante la ricerca web universale:", err);
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messaggioUtente = body?.message || body?.messages?.[body?.messages?.length - 1]?.content || "Ciao";

    // Esegue la ricerca universale su internet per qualsiasi domanda
    const infoLive = await cercaSuInternetUniversale(messaggioUtente);

    let promptConContesto = `[ISTRUZIONE TASSATIVA]: Rispondi OBBLIGATORIAMENTE ed ESCLUSIVAMENTE in lingua ITALIANA.

`;
    
    if (infoLive) {
      promptConContesto += `[DATI AGGIORNATI DA INTERNET]:
${infoLive}

Usa queste informazioni reali per formulare una risposta dettagliata ed esauriente.

`;
    }

    promptConContesto += `[DOMANDA UTENTE]: ${messaggioUtente}`;

    const rispostaIstruita = await chiamaGroq(promptConContesto);

    return NextResponse.json({
      success: true,
      response: rispostaIstruita,
      message: rispostaIstruita,
      fontiWeb: infoLive ? true : false
    });
  } catch (errore: any) {
    return NextResponse.json(
      { success: false, error: errore?.message || "Errore durante l'elaborazione della risposta." },
      { status: 500 }
    );
  }
}
