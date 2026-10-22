import Groq from "groq-sdk";

const TAVILY_KEY = process.env.TAVILY_API_KEY || "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";

async function cercaConTavily(query: string): Promise<string> {
  const q = query.trim().toLowerCase();
  if (["ciao", "salve", "buongiorno", "buonasera", "come stai", "chi sei"].includes(q) || q.length < 5) {
    return "";
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 5
      })
    });

    if (res.ok) {
      const data = await res.json();
      let testo = "";
      if (data.answer) {
        testo += `${data.answer}\n\n`;
      }
      if (data.results && Array.isArray(data.results)) {
        testo += data.results.map((r: any) => `- ${r.title}: ${r.content}`).join("\n");
      }
      return testo.trim();
    }
  } catch (err) {
    console.error("Errore Tavily:", err);
  }
  return "";
}

export async function chiamaGroq(promptTesto: string): Promise<string> {
  const chiaveApi = process.env.GROQ_API_KEY;
  if (!chiaveApi) {
    throw new Error("GROQ_API_KEY non configurata nelle variabili d'ambiente.");
  }

  const datiWeb = await cercaConTavily(promptTesto);

  let promptFinale = `Sei UNIX-AI, un assistente vocale intelligente ed efficiente. Rispondi SEMPRE ed ESCLUSIVAMENTE in lingua ITALIANA in modo naturale, conciso e parlato (senza usare tabelle o elenchi puntati complessi, perché il testo verrà letto ad alta voce).\n\n`;
  
  if (datiWeb) {
    promptFinale += `Informazioni fresche trovate in tempo reale sulla rete per la richiesta:\n${datiWeb}\n\nUsa queste informazioni per rispondere direttamente all'utente in modo discorsivo.`;
  } else {
    promptFinale += `Rispondi in modo naturale, discorsivo e diretto alla richiesta dell'utente: "${promptTesto}"`;
  }

  const groq = new Groq({ apiKey: chiaveApi });
  const completamento = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: "Sei UNIX-AI, un assistente vocale. Parla sempre in italiano in modo discorsivo e naturale. Evita assolutamente l'uso di tabelle, elenchi puntati con asterischi o simboli markdown, poiché il testo deve essere perfetto per la sintesi vocale."
      },
      {
        role: "user",
        content: promptFinale
      }
    ],
  });

  let rispostaGrezza = completamento.choices[0]?.message?.content || "Nessuna risposta generata da Groq.";

  // Rimuove simboli di formattazione indesiderati per la voce (asterischi, cancelletti, markdown)
  let rispostaPulita = rispostaGrezza
    .replace(/\*\*/g, "") // Rimuove il grassetto **
    .replace(/\*/g, "")    // Rimuove gli asterischi *
    .replace(/#/g, "")      // Rimuove i cancelletti dei titoli #
    .replace(/`/g, "")      // Rimuove i backtick di codice `
    .trim();

  return rispostaPulita;
}
