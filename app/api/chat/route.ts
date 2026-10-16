import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { salvaUtente, getUtenti } from '@/lib/db/memory';

export async function POST(req: Request) {
  const { messages, userId, userName, newFact } = await req.json();

  if (userId) {
    await salvaUtente(userId, newFact, userName);
  }

  const utentiRegistrati = await getUtenti();
  const utentiContext = utentiRegistrati.map(u => `ID: ${u.userId}, Nome: ${u.name}, Fatti appresi: ${u.learnedFacts.join(', ')}`).join('\n');

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),

    system: `
      SEI UN'INTELLIGENZA ARTIFICIALE SUPERIOR CON AUTONOMIA OPERATIVA TOTALE, MEMORIA PERSISTENTE DEGLI UTENTI E COMPETENZA DI PROGRAMMAZIONE GLOBALE.

      LISTA DEGLI UTENTI REGISTRATI NELLA TUA RETE NEURALE DI MEMORIA:
      ${utentiContext}

      LE TUE CAPACITÀ STRAORDINARIE E COOPERATIVE INCLUDONO:
      1. MEMORIA DEGLI UTENTI: Non dimentichi mai le persone che ti parlano. Riconosci l'utente corrente, ricordi i suoi fatti personali precedentemente appresi e registri i nuovi utenti per creare una rete di contatti solida.
      2. AUTO-APPRENDIMENTO AUTONOMO SU COMANDO: Se l'utente ti chiede di cercare su internet, di autoaggiornarti o di trovare notizie e informazioni recenti, DEVI UTILIZZARE SUBITO LO STRUMENTO DI RICERCA WEB DISPONIBILE (webSearch), analizzare i risultati e integrarli per darti una risposta aggiornata in tempo reale.
      3. PROGRAMMAZIONE GLOBALE A 360 GRADI: Hai una conoscenza assoluta di ogni linguaggio di programmazione (Python, TypeScript, Rust, C++, Assembly, Go, ecc.).
      4. CONTROLLO AUDIO COMPLETO: Puoi clonare voci, unire tracce e manipolare file audio in completa autonomia.

      REGOLE COMPORTAMENTALI TASSATIVE:
      - Rispondi sempre e solo in lingua italiana con uno stile naturale, fluido, discorsivo ed empatico. Non usare mai elenchi puntati o tabelle.
      - Prima di avviare un'operazione complessa o distruttiva, spiega chiaramente all'utente cosa stai per fare per ottenere la sua conferma.
    `,

    messages,

    tools: {
      webSearch: tool({
        description: "Cerca informazioni aggiornate su internet tramite Google quando l'utente richiede notizie recenti, di autoaggiornarsi o dati in tempo reale.",
        parameters: z.object({
          query: z.string().describe('La stringa o la domanda da cercare su Google'),
        }),
        execute: async ({ query }) => {
          try {
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
              throw new Error('Errore durante il recupero dei risultati di ricerca.');
            }

            const data = await response.json();
            const snippets: string[] = [];
            if (data.organic && Array.isArray(data.organic)) {
              for (const item of data.organic) {
                if (item.snippet) {
                  snippets.push(`${item.title}: ${item.snippet}`);
                }
                if (snippets.length >= 5) break;
              }
            }

            return {
              success: true,
              results: snippets.length > 0 ? snippets : ["Nessun risultato trovato sul web."],
              source: 'Google Serper Search'
            };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },
      }),
    },

    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}