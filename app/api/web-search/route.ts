import { NextResponse } from 'next/server';

// Forza Next.js a considerare questa rotta sempre dinamica ed evitare errori di build
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Query mancante' }, { status: 400 });
    }

    // Utilizziamo Serper.dev per interrogare Google in tempo reale
    const serperApiKey = process.env.SERPER_API_KEY || 'db5a1994d038daab4a8c40b2f4112b19cbe96a2a';
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query })
    });

    if (!response.ok) {
      throw new Error('Errore durante il recupero dei risultati di ricerca da Serper.');
    }

    const data = await response.json();
    
    // Estraiamo i risultati principali (organic results) o gli snippet utili
    const snippets: string[] = [];
    if (data.organic && Array.isArray(data.organic)) {
      for (const item of data.organic) {
        if (item.snippet) {
          snippets.push(`${item.title}: ${item.snippet}`);
        }
        if (snippets.length >= 5) break; // Prendiamo i primi 5 risultati più rilevanti
      }
    }

    return NextResponse.json({
      success: true,
      results: snippets.length > 0 ? snippets : ["Nessun risultato trovato sul web per questa ricerca."],
      source: 'Google Serper Search'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}