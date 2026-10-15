import Groq from "groq-sdk";

// Inizializzazione del client Groq (come da specifiche del tuo progetto)
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Se eseguito lato client, altrimenti gestiscilo via API Route
});

export interface AIResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
}

/**
 * Funzione unificata per generare risposte testuali o strutturate (stile Instructor)
 */
export async function generateStructuredAIResponse<T>(
  prompt: string,
  systemPrompt: string = "You are Unix-AI Pro Studio core intelligence, an expert autonomous developer assistant."
): Promise<AIResponse<T>> {
  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: `${systemPrompt} Ensure all responses where structured data is requested are valid JSON.` },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }, // Forza l'output JSON
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Nessuna risposta ricevuta dal modello.");

    const parsedData = JSON.parse(content) as T;
    return { success: true, data: parsedData };
  } catch (error: any) {
    console.error("Errore nella generazione strutturata AI:", error);
    return { success: false, data: null, error: error.message };
  }
}