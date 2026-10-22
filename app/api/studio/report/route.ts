import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { topic, format, memoryData } = await req.json();

    if (!topic) {
      return NextResponse.json({ success: false, error: "Argomento del report o ebook non fornito." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const docFormat = format === 'ebook' ? 'un Ebook approfondito suddiviso in capitoli' : 'un Report tecnico dettagliato';

    const promptSystem = `
Sei il motore editoriale di Unix-AI Pro Studio. Il tuo compito è generare ${docFormat} basato sul seguente argomento: "${topic}".
Usa le informazioni e i contesti forniti dalla memoria neurale se disponibili: ${memoryData || 'Nessun contesto aggiuntivo'}.
Scrivi in lingua italiana con uno stile professionale, pulito e discorsivo, evitando tabelle rigide o elenchi puntati eccessivi. Struttura il testo in modo organico.
    `;

    const completion = await groq.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: promptSystem },
        { role: "user", content: `Genera il documento completo su: ${topic}` }
      ],
      temperature: 0.7,
      max_tokens: 3072,
    });

    const generatedContent = completion.choices[0]?.message?.content || "Generazione del documento completata.";

    return NextResponse.json({
      success: true,
      documentType: format || 'report',
      topic,
      content: generatedContent,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Errore nella generazione del report." }, { status: 500 });
  }
}