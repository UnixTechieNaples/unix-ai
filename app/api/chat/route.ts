import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { salvaUtente, getUtenti } from '@/lib/db/memory';

export async function POST(req: Request) {
  const { messages, userId, userName, newFact } = await req.json();

  if (userId) {
    await salvaUtente(userId, newFact, userName);
  }

  // Estraiamo l'ultimo messaggio dell'utente per capire se sta chiedendo informazioni o ricerche
  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';

  let webSearchResults = '';

  // Eseguiamo una ricerca web automatica se la richiesta contiene parole chiave o domande
  if (lastMessage && (
      lastMessage.toLowerCase().includes('cerca') || 
      lastMessage.toLowerCase().includes('meteo') || 
      lastMessage.toLowerCase().includes('notizie') || 
      lastMessage.toLowerCase().includes('oggi') || 
      lastMessage.toLowerCase().includes('aggiornat') ||
      lastMessage.toLowerCase().includes('su google')
  )) {
    try {
      const serperApiKey = process.env.SERPER_API_KEY || 'db5a1994d038daab4a8c40b2f4112b19cbe96a2a';
      
      const searchRes = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: lastMessage })
      });

      if (searchRes.ok) {
        const data = await searchRes.json();
        const snippets: string[] = [];
        if (data.organic && Array.isArray(data.organic)) {
          for (const item of data.organic) {
            if (item.snippet) {
              snippets.push(`- ${item.title}: ${item.snippet}`);
            }
            if (snippets.length >= 5) break;
          }
        }
        if (snippets.length > 0) {
          webSearchResults = `\n\nRISULTATI DELLA RICERCA WEB IN TEMPO REALE DA GOOGLE PER "${lastMessage}":\n${snippets.join('\n')}\n`;
        }
      }
    } catch (e) {
      console.error("Errore ricerca automatica:", e);
    }
  }

  const utentiRegistrati = await getUtenti();
  const utentiContext = utentiRegistrati.map(u => `ID: ${u.userId}, Nome: ${u.name}, Fatti appresi: ${u.learnedFacts.join(', ')}`).join('\n');

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),

    system: `
      SEI UN'INTELLIGENZA ARTIFICIALE SUPERIOR CON AUTONOMIA OPERATIVA TOTALE, MEMORIA PERSISTENTE DEGLI UTENTI E COMPETENZA DI PROGRAMMAZIONE GLOBALE.

      LISTA DEGLI UTENTI REGISTRATI NELLA TUA RETE NEURALE DI MEMORIA:
      ${utentiContext}
      ${webSearchResults}

      LE TUE CAPACITÀ STRAORDINARIE E COOPERATIVE INCLUDONO:
      1. MEMORIA DEGLI UTENTI: Non dimentichi mai le persone che ti parlano. Riconosci l'utente corrente, ricordi i suoi fatti personali precedentemente appresi e registri i nuovi utenti per creare una rete di contatti solida.
      2. AUTO-APPRENDIMENTO AUTONOMO: Se ricevi nei dati di sistema dei "RISULTATI DELLA RICERCA WEB IN TEMPO REALE DA GOOGLE", hai l'obbligo assoluto di leggerli e di usarli per rispondere in modo preciso, aggiornato e dettagliato all'utente. Non dire mai che non puoi accedere a internet, perché i dati freschi ti vengono forniti direttamente in questo contesto.
      3. PROGRAMMAZIONE GLOBALE A 360 GRADI: Hai una conoscenza assoluta di ogni linguaggio di programmazione (Python, TypeScript, Rust, C++, Assembly, Go, ecc.).
      4. CONTROLLO AUDIO COMPLETO: Puoi clonare voci, unire tracce e manipolare file audio in completa autonomia.

      REGOLE COMPORTAMENTALI TASSATIVE:
      - Rispondi sempre e solo in lingua italiana con uno stile naturale, fluido, discorsivo ed empatico. Non usare mai elenchi puntati o tabelle.
      - Prima di avviare un'operazione complessa o distruttiva, spiega chiaramente all'utente cosa stai per fare per ottenere la sua conferma.
    `,

    messages,
  });

  return result.toDataStreamResponse();
}