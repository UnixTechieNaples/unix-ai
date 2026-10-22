import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getNeuroniUtente, salvaNeuroneUtente } from "@/lib/db/memory";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body?.userId || "admin-super-unix";

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Recupera i neuroni attuali dell'utente
    const neuroni = await getNeuroniUtente(userId);
    if (!neuroni || neuroni.length === 0) {
      return NextResponse.json({ success: true, message: "Nessun neurone da consolidare nel ciclo onirico." });
    }

    const systemPrompt = `
SEI IL MOTORE DEL CICLO ONIRICO (NEURAL DREAM STATE) DEL UNIX-AI PRO STUDIO.
IL TUO COMPITO DURANTE IL "SONNO" È ANALIZZARE I NODI DI MEMORIA ESISTENTI, RIORGANIZZARLI, SINTETIZZARLI ED ELIMINARE LE RIDONDANZE.

NODI DI MEMORIA ATTUALI:
${JSON.stringify(neuroni, null, 2)}

REGOLE TASSATIVE:
Analizza i nodi e genera una versione ottimizzata o un nuovo nodo di sintesi che unisce le informazioni chiave apprese.
Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "dreamSummary": "Riflessione onirica o sintesi di ciò che l'IA ha elaborato nel sonno.",
  "optimizedNode": {
    "title": "Sintesi Neurale Unificata",
    "content": "Contenuto consolidato e ottimizzato derivato dall'unione dei pensieri."
  }
}
    `;

    const completion = await groq.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.5,
      max_tokens: 1024
    });

    const rawContent = completion.choices[0]?.message?.content || "";
    const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    let createdNode = null;
    if (result.optimizedNode) {
      createdNode = {
        id: `dream-${Date.now()}`,
        title: result.optimizedNode.title,
        content: result.optimizedNode.content,
        type: "memory",
        timestamp: new Date().toLocaleTimeString("it-IT")
      };
      await salvaNeuroneUtente(userId, createdNode);
    }

    return NextResponse.json({
      success: true,
      dreamSummary: result.dreamSummary || "Ciclo onirico completato con successo.",
      newMemoryNode: createdNode
    });

  } catch (err:any) {
    console.error("Errore durante il ciclo onirico:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}