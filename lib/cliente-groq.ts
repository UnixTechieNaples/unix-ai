import Groq from "groq-sdk";

export async function chiamaGroq(promptTesto: string): Promise<string> {
  const chiaveApi = process.env.GROQ_API_KEY;
  if (!chiaveApi) {
    throw new Error("GROQ_API_KEY non configurata nelle variabili d'ambiente.");
  }

  const groq = new Groq({ apiKey: chiaveApi });
  const completamento = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: "Sei UNIX-AI. Rispondi sempre ed esclusivamente in lingua ITALIANA. ATTENZIONE: Non tentare MAI di chiamare strumenti, funzioni o tool esterni (come browser.run o simili). I dati di ricerca necessari ti vengono già forniti direttamente dal sistema all'interno del prompt. Usali esclusivamente per scrivere la risposta finale in formato testuale."
      },
      {
        role: "user",
        content: promptTesto
      }
    ],
  });

  return completamento.choices[0]?.message?.content || "Nessuna risposta generata da Groq.";
}
