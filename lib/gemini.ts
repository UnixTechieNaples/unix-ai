import { chiamaGroq } from "./cliente-groq";

export async function callGemini(promptText: string): Promise<string> {
  return chiamaGroq(promptText);
}
