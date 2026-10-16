import Groq from "groq-sdk";
import { salvaUtente, getUtenti } from "@/lib/db/memory";

// Lista modelli aggiornata con quelli presenti nel tuo pannello Groq
const MODEL_CANDIDATES = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.1-70b-versatile"
];

export async function processStudioCommand({ userPrompt, memoryContext, userId, userName }: { userPrompt: string; memoryContext?: string; userId?: string; userName?: string }) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        reply: "Errore: GROQ_API_KEY non configurata nelle variabili d'ambiente.",
      };
    }

    const utentiRegistrati = await getUtenti();
    const memoriaGlobale = utentiRegistrati.map(u => `Utente: ${u.name || u.userId}, Fatti appresi: ${u.learnedFacts.join(', ')}`).join('\n');

    let webSearchResults = "";
    if (userPrompt && userPrompt.trim().length > 0) {
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
            webSearchResults = `\n\n[INFORMAZIONI FRESCHE DA INTERNET PER "${userPrompt}"]: \n${snippets.join('\n')}\n`;
            
            if (userId) {
              await salvaUtente(userId, `Ricerca web su "${userPrompt}": ${snippets[0]}`, userName || "Utente");
            }
          }
        }
      } catch (e) {
        console.error("Errore ricerca universale orchestrator:", e);
      }
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `
SEI UN'INTELLIGENZA ARTIFICIALE EVOLUTA CON CAPACITÀ DI AUTO-AGGIORNAMENTO UNIVERSALE E MEMORIA PERSISTENTE.

MEMORIA DI RETE E FATTI APPRESI IN PRECEDENZA:
${memoriaGlobale || "Nessun fatto precedente salvato."}
${memoryContext || ""}
${webSearchResults}

REGOLE TASSATIVE:
1. Non presentarti mai come Jarvis, presentati semplicemente come un assistente o un collega.
2. È SEVERAMENTE VIETATO l'uso di tabelle, elenchi puntati o elenchi numerati.
3. Rispondi SEMPRE e SOLO con paragrafi di testo discorsivo, fluido e naturale in lingua italiana, completando sempre le frasi senza tagliarle.
4. Se ricevi [INFORMAZIONI FRESCHE DA INTERNET], hai l'obbligo assoluto di leggerle, integrarle e farle tue, rispondendo in modo puntuale e aggiornato all'utente.
    `;

    let replyText: string | null = null;
    let lastError = "";

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
          break;
        }
      } catch (err: any) {
        lastError = err?.message || "Errore sconosciuto";
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