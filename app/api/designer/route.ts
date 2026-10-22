import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userMood = body?.mood || "curioso";

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `
SEI IL UI/UX SELF-DESIGNER DEL UNIX-AI PRO STUDIO.
IL TUO COMPITO È PROPORRE MIGLIORAMENTI ESTETICI, VARIAZIONI DI TEMA CROMATICO O NUOVE ANIMAZIONI PER L'INTERFACCIA E L'AVATAR DELL'IA.
STATO D'ANIMO ATTUALE DELL'IA: ${userMood}

REGOLE TASSATIVE:
Genera una proposta visiva creativa ed elegante coerente con lo stile cyberpunk/terminale di studio.
Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "title": "Titolo della proposta di design",
  "description": "Descrizione del cambiamento visivo o dell'avatar",
  "details": "Codice CSS o specifiche dei colori/layout proposti (es. sfumature neon, bordi o layout griglia)",
  "accentColor": "#06b6d4"
}
    `;

    const completion = await groq.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.7,
      max_tokens: 1024
    });

    const rawContent = completion.choices[0]?.message?.content || "";
    const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    const proposal = {
      id: `ui-${Date.now()}`,
      type: "ui_design",
      title: result.title || "Evoluzione UI & Avatar",
      description: result.description || "Proposta di restyling visivo generata dall'IA.",
      details: result.details || "Aggiornamento dei componenti grafici.",
      timestamp: new Date().toLocaleTimeString("it-IT")
    };

    return NextResponse.json({
      success: true,
      pendingAction: proposal
    });

  } catch (err: any) {
    console.error("Errore durante la generazione UI Self-Designer:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}