import Groq from "groq-sdk";

export async function chiamaGroq(promptTesto: string): Promise<string> {
  const chiaveApi = process.env.GROQ_API_KEY;
  if (!chiaveApi) {
    throw new Error("GROQ_API_KEY non configurata nelle variabili datori.");
  }

  const groq = new Groq({ apiKey: chiaveApi });
  const completamento = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [{ role: "user", content: promptTesto }],
  });

  return completamento.choices[0]?.message?.content || "Nessuna risposta generata da Groq.";
}
