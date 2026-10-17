import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();

    if (!prompt) {
      return NextResponse.json({ success: false, error: "Nessun prompt fornito per il modello locale." }, { status: 400 });
    }

    // Endpoint predefinito di Ollama (es. attivo in locale su localhost:11434)
    const ollamaHost = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
    const selectedModel = model || "llama3"; // Modello locale di default

    const response = await fetch(`${ollamaHost}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Errore di comunicazione con Ollama locale (${response.statusText}). Assicurati che Ollama sia in esecuzione.`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      reply: data.response || "Risposta generata dal modello locale.",
      mode: "offline",
      modelUsed: selectedModel,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("Errore modalità offline Ollama:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || "Impossibile contattare il server Ollama locale. Modalità offline non disponibile." 
    }, { status: 500 });
  }
}