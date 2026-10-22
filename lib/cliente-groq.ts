import Groq from "groq-sdk";

const TAVILY_KEY = process.env.TAVILY_API_KEY || "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";

async function cercaConTavily(query: string): Promise<string> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 6
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

  // Interroghiamo Tavily preventivamente per qualsiasi richiesta
  const datiWeb = await cercaConTavily(promptTesto);

  let promptFinale = `Sei UNIX-AI, un assistente virtuale intelligente. Rispondi SEMPRE ed ESCLUSIVAMENTE in lingua ITALIANA.\n\n`;
  if (datiWeb) {
    promptFinale += `Informazioni fresche trovate in tempo reale sulla rete per la richiesta:\n${datiWeb}\n\nUsa queste informazioni per rispondere direttamente e in modo dettagliato all'utente.`;
  } else {
    promptFinale += `Rispondi alla domanda: ${promptTesto}`;
  }

  const groq = new Groq({ apiKey: chiaveApi });
  const completamento = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: "Sei UNIX-AI. Rispondi sempre in italiano. Se ti vengono forniti dati di ricerca web, usali per rispondere in modo completo."
      },
      {
        role: "user",
        content: promptFinale
      }
    ],
  });

  let reply = completamento.choices[0]?.message?.content || "Nessuna risposta generata da Groq.";

  // Controllo di sicurezza: se l'IA fa resistenza o dice che non ha accesso, forziamo i dati di Tavily
  const replyLower = reply.toLowerCase();
  if (
    replyLower.includes("non dispongo") || 
    replyLower.includes("non ho la possibilità") || 
    replyLower.includes("non ho accesso") || 
    replyLower.includes("ti consiglio di consultare") ||
    replyLower.includes("al momento non")
  ) {
    if (datiWeb) {
      return `Ecco i dati aggiornati trovati in tempo reale sulla rete:\n\n${datiWeb}`;
    }
  }

  return reply;
}
