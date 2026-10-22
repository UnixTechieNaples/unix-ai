import { NextResponse } from "next/server";
import { chiamaGroq } from "@/lib/cliente-groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ottieniMeteoLive(citta: string): Promise<string> {
  try {
    // Coordinate approssimative per Napoli (40.8522, 14.2681)
    const url = "https://api.open-meteo.com/v1/forecast?latitude=40.8522&longitude=14.2681&current_weather=true&timezone=Europe%2FRome";
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    if (data && data.current_weather) {
      const temp = data.current_weather.temperature;
      const vento = data.current_weather.windspeed;
      return `Dati meteo live per Napoli: Temperatura ${temp}°C, Velocità vento ${vento} km/h.`;
    }
  } catch (e) {
    console.error("Errore meteo:", e);
  }
  return "";
}

async function cercaSuInternet(query: string): Promise<string> {
  const queryLower = query.toLowerCase();
  
  // Se la richiesta riguarda il meteo a Napoli o in generale
  if (queryLower.includes("meteo") || queryLower.includes("tempo") || queryLower.includes("napoli")) {
    const datiMeteo = await ottieniMeteoLive("Napoli");
    if (datiMeteo) return datiMeteo;
  }

  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.AbstractText) {
        return `Informazione estratta dal web: ${data.AbstractText}`;
      }
    }
  } catch (err) {
    console.error("Errore ricerca web:", err);
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messaggioUtente = body?.message || body?.messages?.[body?.messages?.length - 1]?.content || "Ciao";

    const infoLive = await cercaSuInternet(messaggioUtente);

    // Prompt con istruzioni TASSATIVE sull'italiano e dati live inclusi
    let promptConContesto = `[ISTRUZIONE TASSATIVA]: Rispondi OBBLIGATORIAMENTE ed ESCLUSIVAMENTE in lingua ITALIANA. Non usare mai l'inglese.

`;
    
    if (infoLive) {
      promptConContesto += `[DATI IN TEMPO REALE DA INTERNET]:
${infoLive}

Usa i dati sopra per rispondere alla domanda dell'utente.

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
