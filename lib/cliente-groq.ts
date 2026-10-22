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
        content: "Sei UNIX-AI, l'assistente ufficiale. DEVI RISPONDERE SEMPRE ED ESCLUSIVAMENTE IN LINGUA ITALIANA. È severamente vietato rispondere in inglese o altre lingue."
      },
      {
        role: "user",
        content: promptTesto
      }
    ],
  });

  return completamento.choices[0]?.message?.content || "Nessuna risposta generata da Groq.";
}
