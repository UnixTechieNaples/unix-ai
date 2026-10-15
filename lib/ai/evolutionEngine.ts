import { generateStructuredAIResponse } from "./client";
import { storeMemoryEmbeddings } from "@/lib/supabase/vector";

interface ReflectionInput {
  failedTask: string;
  errorOutput: string;
}

interface ReflectionResult {
  success: boolean;
  reflectionSummary: string;
  correctedStrategy: string;
}

/**
 * Motore di Closed-Loop Self-Evolution: l'IA analizza il proprio errore e impara
 */
export async function processSelfReflection(input: ReflectionInput): Promise<ReflectionResult> {
  const systemPrompt = `
    You are the Self-Evolving Reflection Engine of Unix-AI Pro Studio.
    An autonomous task has failed. Analyze the error output and generate a deep technical reflection.
    Return a JSON object with:
    - "reflectionSummary": A concise technical explanation of WHY the error occurred.
    - "correctedStrategy": The precise steps or code adjustments needed to fix it next time.
  `;

  const prompt = `
    Failed Task: ${input.failedTask}
    Error / Output Traceback: ${input.errorOutput}
  `;

  const aiResponse = await generateStructuredAIResponse<ReflectionResult>(prompt, systemPrompt);

  if (!aiResponse.success || !aiResponse.data) {
    return {
      success: false,
      reflectionSummary: "Impossibile generare una riflessione sull'errore.",
      correctedStrategy: "Riprovare l'esecuzione con un approccio standard.",
    };
  }

  const result = aiResponse.data;

  // Salva permanentemente la riflessione nel database vettoriale di Supabase (Memoria Episodica)
  await storeMemoryEmbeddings(
    `[SELF-EVOLUTION REFLECTION] Task: ${input.failedTask} | Cause: ${result.reflectionSummary} | Solution: ${result.correctedStrategy}`,
    { type: "evolution_reflection", timestamp: new Date().toISOString() }
  );

  return {
    success: true,
    reflectionSummary: result.reflectionSummary,
    correctedStrategy: result.correctedStrategy,
  };
}