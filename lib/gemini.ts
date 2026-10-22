import { GoogleGenAI } from "@google/genai";

export async function callGemini(promptText: string, retries = 3): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY non configurata nelle variabili d'ambiente.");
  }

  const ai = new GoogleGenAI({ apiKey });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptText,
      });

      return response.text || "Nessuna risposta generata da Gemini.";
    } catch (error: any) {
      const isOverloaded = error?.message?.includes("503") || error?.message?.includes("high demand") || error?.status === 503;
      if (isOverloaded && attempt < retries) {
        console.warn(`Tentativo ${attempt} fallito per sovraccarico (503). Riprovo tra ${attempt * 2} secondi...`);
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
        continue;
      }
      throw error;
    }
  }

  throw new Error("I server di Gemini sono attualmente sovraccarichi. Riprova tra qualche istante.");
}
