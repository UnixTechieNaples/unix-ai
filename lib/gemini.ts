import { GoogleGenAI } from "@google/genai";

export async function callGemini(promptText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY non configurata nelle variabili d'ambiente.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: promptText,
  });

  return response.text || "Nessuna risposta generata da Gemini.";
}
