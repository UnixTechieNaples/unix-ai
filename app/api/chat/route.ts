import { NextResponse } from "next/server";
import { chiamaGroq } from "@/lib/cliente-groq";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function cercaSuInternet(query: string): Promise<string> {
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    if (!res.ok) return "";
    const data = await res.json();
    
    let risultati = "";
    if (data.AbstractText) {
      risultati += `Sintesi principale: ${data.AbstractText}\n`;
    }
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      const argomenti = data.RelatedTopics.slice(0, 3)
        .map((t: any) => t.Text)
        .filter(Boolean)
        .join("\n- ");
      if (argomenti) risultati += `Dettagli dal web:\n- ${argomenti}\n`;
    }
    return risultati;
  } catch (err) {
    console.error("Errore ricerca web:", err);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messaggioUtente = body?.message || body?.messages?.[body?.messages?.length - 1]?.content || "Ciao";

    const risultatiWeb = await cercaSuInternet(messaggioUtente);

    let promptFinale = messaggioUtente;
    if (risultatiWeb) {
      promptFinale = `[INFORMAZIONI IN TEMPO REALE DA INTERNET]:\n${risultatiWeb}\n\n[DOMANDA UTENTE]: ${messaggioUtente}`;
    }

    const rispostaIstruita = await chiamaGroq(promptFinale);

    return NextResponse.json({
      success: true,
      response: rispostaIstruita,
      message: rispostaIstruita,
      fontiWeb: risultatiWeb ? true : false
    });
  } catch (errore: any) {
    return NextResponse.json(
      { success: false, error: errore?.message || "Errore durante l'elaborazione della risposta." },
      { status: 500 }
    );
  }
}
