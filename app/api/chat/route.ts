import { NextResponse } from "next/server";
import { chiamaGroq } from "@/lib/cliente-groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Funzione avanzata per cercare su Internet
async function cercaSuInternetAvanzata(query: string): Promise<string> {
  try {
    // 1. Prova prima la ricerca meteo/notizie diretta tramite wttr.in se la domanda riguarda il meteo
    if (query.toLowerCase().includes("meteo") || query.toLowerCase().includes("tempo")) {
      try {
        const meteoRes = await fetch(`https://wttr.in/Napoli?format=3`, { headers: { "User-Agent": "curl/7.68.0" } });
        if (meteoRes.ok) {
          const testoMeteo = await meteoRes.text();
          if (testoMeteo && testoMeteo.trim().length > 0) {
            return `Meteo live rilevato: ${testoMeteo.trim()}`;
          }
        }
      } catch (e) {
        console.error("Errore meteo direct:", e);
      }
    }

    // 2. Ricerca generica web tramite DuckDuckGo Lite HTML
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) return "";
    const html = await res.text();
    
    // Estrazione dei snippet dai risultati della ricerca
    const regex = /<a class="result__snippet[^>]*>(.*?)<\/a>/g;
    const corrispondenze = [];
    let match;
    while ((match = regex.exec(html)) !== null && corrispondenze.length < 4) {
      const testoPulito = match[1].replace(/<[^>]+>/g, '').trim();
      if (testoPulito) corrispondenze.push(testoPulito);
    }

    if (corrispondenze.length > 0) {
      return "Risultati live dal web:\n- " + corrispondenze.join("\n- ");
    }

    return "";
  } catch (err) {
    console.error("Errore durante la ricerca web:", err);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messaggioUtente = body?.message || body?.messages?.[body?.messages?.length - 1]?.content || "Ciao";

    // Esegui la ricerca su Internet
    const informazioniLive = await cercaSuInternetAvanzata(messaggioUtente);

    // Costruisci il prompt con istruzioni chiare per l'IA
    let promptFinale = messaggioUtente;
    if (informazioniLive) {
      promptFinale = `[INFORMAZIONI IN TEMPO REALE OTTERNUTE DA INTERNET]:\n${informazioniLive}\n\n[ISTRUZIONE]: Rispondi all'utente utilizzando le informazioni in tempo reale fornite sopra.\n\n[DOMANDA UTENTE]: ${messaggioUtente}`;
    }

    const rispostaIstruita = await chiamaGroq(promptFinale);

    return NextResponse.json({
      success: true,
      response: rispostaIstruita,
      message: rispostaIstruita,
      fontiWeb: informazioniLive ? true : false
    });
  } catch (errore: any) {
    return NextResponse.json(
      { success: false, error: errore?.message || "Errore durante l'elaborazione della risposta." },
      { status: 500 }
    );
  }
}
