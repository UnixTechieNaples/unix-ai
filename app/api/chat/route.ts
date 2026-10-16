import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { salvaUtente, getUtenti } from '@/lib/db/memory';

export async function POST(req: Request) {
  const { messages, userId, userName, newFact } = await req.json();

  // Se viene passato un ID utente, lo salviamo nel database per non dimenticarlo
  if (userId) {
    await salvaUtente(userId, newFact, userName);
  }

  // Recuperiamo la lista degli utenti salvati per darla in pasto alla memoria dell'IA
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

    // Definiamo gli strumenti (tools) che l'IA può chiamare in autonomia
    tools: {
      webSearch: tool({
        description: 'Cerca informazioni aggiornate su internet tramite Google quando l'utente richiede notizie recenti, di autoaggiornarsi o dati in tempo reale.',
        parameters: z.object({
          query: z.string().describe('La stringa o la domanda da cercare su Google'),
        }),
        execute: async ({ query }) => {
          try {
            // Chiamata interna al nostro endpoint /api/web-search
            // Nota: in ambiente serverless/Vercel usiamo l'URL assoluto o relativo basato sulla richiesta
            const host = req.headers.get('host') || 'localhost:3000';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            
            const response = await fetch(`${protocol}://${host}/api/web-search`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query }),
            });

            const data = await response.json();
            return data;
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },
      }),
    },

    // Permettiamo all'IA di fare più passaggi se necessario (es. cerca, legge e risponde)
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}