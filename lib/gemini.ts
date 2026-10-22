import Groq from "groq-sdk";

export async function callGemini(promptText: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY non configurata nelle variabili d'ambiente.");
  }

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: promptText }],
  });

  return completion.choices[0]?.message?.content || "Nessuna risposta generata da Groq.";
}
