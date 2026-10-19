import { storeMemory } from '@/lib/ai/embeddings';

export interface CrawlResult {
  url: string;
  title: string;
  summary: string;
  savedToMemory: boolean;
}

/**
 * Pulisce il testo estratto da una pagina HTML per la memorizzazione
 */
function cleanHtmlText(htmlText: string): string {
  return htmlText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Esplora un'URL web, ne analizza il contenuto e lo salva nella memoria semantica dell'IA.
 */
export async function crawlAndStoreResource(targetUrl: string): Promise<CrawlResult> {
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UnixAI-Pro-Studio-Crawler/2.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Impossibile accedere alla risorsa web (${response.status}: ${response.statusText})`);
    }

    const rawText = await response.text();
    const cleanedText = cleanHtmlText(rawText).slice(0, 4000); // Manteniamo i primi 4000 caratteri rilevanti

    const summaryContent = `[Web Intelligence] Contenuto estratto da ${targetUrl}: ${cleanedText.slice(0, 500)}...`;

    // Salvataggio immediato nella memoria vettoriale
    await storeMemory(
      summaryContent,
      'architecture_decision',
      { url: targetUrl, crawledAt: new Date().toISOString() }
    );

    return {
      url: targetUrl,
      title: `Risorsa Web: ${targetUrl}`,
      summary: summaryContent,
      savedToMemory: true
    };
  } catch (error: any) {
    console.error('Errore durante il crawling web:', error);
    throw error;
  }
}