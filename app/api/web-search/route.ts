import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Query mancante' }, { status: 400 });
    }

    // Usiamo l'endpoint di DuckDuckGo HTML/Lite o API pubbliche libere per cercare informazioni fresche online
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('Errore durante il recupero dei risultati di ricerca.');
    }

    const html = await response.text();
    
    // Semplice parsing dei risultati testuali dall'HTML di DuckDuckGo per estrarre snippet utili
    const snippets: string[] = [];
    const matches = html.matchAll(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g);
    for (const match of matches) {
      const cleanText = match[1].replace(/<[^>]*>/g, '').trim();
      snippets.push(cleanText);
      if (snippets.length >= 5) break; // Prendiamo i primi 5 risultati
    }

    return NextResponse.json({
      success: true,
      results: snippets.length > 0 ? snippets : ["Nessun risultato dettagliato trovato, ma la connessione è attiva."],
      source: 'DuckDuckGo Online Search'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
