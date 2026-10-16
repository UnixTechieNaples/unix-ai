import Groq from "groq-sdk";

// Lista modelli in ordine di priorità da testare
const MODEL_CANDIDATES = [
  "llama-3.1-8b-instant",
  "llama3-8b-8192",
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "openai/gpt-oss-20b"
];

export async function processStudioCommand({ userPrompt, memoryContext }: { userPrompt: string; memoryContext?: string }) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        reply: "Errore: GROQ_API_KEY non configurata nelle variabili d'ambiente.",
      };
    }

    // Ricerca web automatica preventiva con Serper.dev
    let webSearchResults = "";
    if (userPrompt && (
        userPrompt.toLowerCase().includes('cerca') || 
        userPrompt.toLowerCase().includes('meteo') || 
        userPrompt.toLowerCase().includes('notizie') || 
        userPrompt.toLowerCase().includes('oggi') || 
        userPrompt.toLowerCase().includes('aggiornat') ||
        userPrompt.toLowerCase().includes('su google')
    )) {
      try {
        const serperApiKey = process.env.SERPER_API_KEY || 'db5a1994d038daab4a8c40b2f4112b19cbe96a2a';
        
        const searchRes = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ q: userPrompt })
        });

        if (searchRes.ok) {
          const data = await searchRes.json();
          const snippets: string[] = [];
          if (data.organic && Array.isArray(data.organic)) {
            for (const item of data.organic) {
              if (item.snippet) {
                snippets.push(`- ${item.title}: ${item.snippet}`);
              }
              if (snippets.length >= 6) break;
            }
          }
          if (snippets.length > 0) {
            webSearchResults = `\n\nDATI AGGIORNATI DA INTERNET IN TEMPO REALE:\n${snippets.join('\n')}\n`;
          }
        }
      } catch (e) {
        console.error("Errore ricerca automatica orchestrator:", e);
      }
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `
Sei un assistente personale amichevole, un collega umano e brillante. 
REGOLE TASSATIVE:
1. NON presentarti mai come Jarvis, non sei un terminale e non sei un sistema operativo. Presentati semplicemente come un assistente o un collega.
2. È SEVERAMENTE VIETATO l'uso di tabelle, elenchi puntati o elenchi numerati.
3. Rispondi SEMPRE e SOLO con paragrafi di testo discorsivo, fluido e naturale in lingua italiana, completando sempre le frasi senza tagliarle.
4. Se ricevi informazioni aggiornate da internet, hai l'obbligo assoluto di leggerle e integrarle nella risposta.

Memoria di contesto attuale del sistema:
${memoryContext || "Nessun contesto aggiuntivo."}
${webSearchResults}
    `;

    let replyText: string | null = null;
    let lastError = "";

    // Prova i modelli candidate in cascata finché uno funziona
    for (const model of MODEL_CANDIDATES) {
      try {
        const completion = await groq.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4096,
        });

        replyText = completion.choices[0]?.message?.content || null;
        if (replyText) {
          console.log(`[GROQ] Risposta generata con successo utilizzando il modello: ${model}`);
          break;
        }
      } catch (err: any) {
        lastError = err?.message || "Errore sconosciuto";
        console.warn(`[GROQ] Modello ${model} non disponibile, provo il successivo... (${lastError})`);
      }
    }

    if (!replyText) {
      return {
        success: false,
        reply: `Errore Groq: Nessun modello disponibile. Dettaglio: ${lastError}`,
        error: lastError
      };
    }

    return {
      success: true,
      reply: replyText,
      patches: null
    };

  } catch (error: any) {
    console.error("ERRORE CRITICO ORCHESTRATOR:", error);
    return {
      success: false,
      reply: `Errore di connessione: ${error?.message || "Errore sconosciuto"}`,
      error: error?.message
    };
  }
}