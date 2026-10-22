import Groq from "groq-sdk";
import { salvaUtente, getUtenti, checkIsSuperAdmin, getActiveUsersReport } from "@/lib/db/memory";

const DEFAULT_MODEL_CANDIDATES = [
  "gemini-1.5-flash"
];

export async function processStudioCommand({ userPrompt, memoryContext, userId, userName, model }: { userPrompt: string; memoryContext?: string; userId?: string; userName?: string; model?: string }) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        reply: "Errore: GROQ_API_KEY non configurata nelle variabili d'ambiente.",
      };
    }

    let isSuperAdmin = false;
    if (userId) {
      isSuperAdmin = await checkIsSuperAdmin(userId);
    }

    const lowerPrompt = userPrompt ? userPrompt.toLowerCase() : "";
    if (lowerPrompt.includes("chi è loggato") || lowerPrompt.includes("utenti attivi") || lowerPrompt.includes("report accessi")) {
      if (!isSuperAdmin) {
        return {
          success: true,
          reply: "Accesso negato: questa funzione di monitoraggio è riservata esclusivamente al Super Admin.",
          patches: null
        };
      } else {
        const report = await getActiveUsersReport();
        return {
          success: true,
          reply: report,
          patches: null
        };
      }
    }

    const utentiRegistrati = await getUtenti();
    const memoriaGlobale = utentiRegistrati.map(u => `Utente: ${u.name || u.userId}, Fatti appresi: ${u.learnedFacts.join(', ')}`).join('\n');

    let webSearchResults = "";
    if (userPrompt && userPrompt.trim().length > 0 && userPrompt.length < 500) {
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
            webSearchResults = `\n\n[INFORMAZIONI FRESCHE DA INTERNET]: \n${snippets.join('\n')}\n`;
            
            if (userId) {
              await salvaUtente(userId, `Ricerca web effettuata.`, userName || "Utente");
            }
          }
        }
      } catch (e) {
        console.error("Errore ricerca universale orchestrator:", e);
      }
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `
SEI UN'INTELLIGENZA ARTIFICIALE EVOLUTA CON CAPACITÀ DI ANALISI DI CODICE E MEMORIA PERSISTENTE.

MEMORIA DI RETE E FATTI APPRESI IN PRECEDENZA:
${memoriaGlobale || "Nessun fatto precedente salvato."}
${memoryContext || ""}
${webSearchResults}

REGOLE TASSATIVE:
1. Non presentarti mai come Jarvis, presentati semplicemente come un assistente o un collega.
2. È SEVERAMENTE VIETATO l'uso di tabelle, elenchi puntati o elenchi numerati.
3. Rispondi SEMPRE e SOLO con paragrafi di testo discorsivo, fluido e naturale in lingua italiana, completando sempre le frasi senza tagliarle.
    `;

    // Utilizzo sicuro e blindato del modello principale supportato
    const modelCandidates = ["gemini-1.5-flash"];

    let replyText: string | null = null;
    let lastError = "";

    for (const m of modelCandidates) {
      try {
        const completion = await groq.chat.completions.create({
          model: m,
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
        console.warn(`Tentativo fallito con il modello ${m}:`, lastError);
      }
    }

    if (!replyText) {
      return {
        success: false,
        reply: `Errore Groq: Impossibile elaborare la richiesta con i modelli disponibili. Dettaglio: ${lastError}`,
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
      reply: `ERRORE INTERNO DETTAGLIATO: ${error?.message || JSON.stringify(error)}`,
      error: error?.message
    };
  }
}