import Groq from "groq-sdk";

// Lista modelli in ordine di priorità da testare
const MODEL_CANDIDATES = [
  "llama-3.1-8b-instant",
  "llama3-8b-8192",
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "openai/gpt-oss-20b"
];

export async function processStudioCommand({ userPrompt, memoryContext }: { userPrompt: string; memoryContext?: string }) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        reply: "Errore: GROQ_API_KEY non configurata nelle variabili d'ambiente.",
      };
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `
Sei JARVIS-UNIX, l'intelligenza artificiale avanzata che alimenta Unix-AI Pro Studio.
Il tuo obiettivo è assistere l'utente con uno stile cyberpunk, professionale, reattivo e preciso.
Rispondi sempre in lingua italiana, mantenendo un tono da sistema operativo intelligente e futuristico.

Memoria di contesto attuale del sistema:
${memoryContext || "Nessun contesto aggiuntivo."}
    `;

    let replyText: string | null = null;
    let lastError = "";

    // Prova i modelli candidate in cascata finché uno funziona
    for (const model of MODEL_CANDIDATES) {
      try {
        const completion = await groq.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        });

        replyText = completion.choices[0]?.message?.content || null;
        if (replyText) {
          console.log(`[GROQ] Risposta generata con successo utilizzando il modello: ${model}`);
          break;
        }
      } catch (err: any) {
        lastError = err?.message || "Errore sconosciuto";
        console.warn(`[GROQ] Modello ${model} non disponibile, provo il successivo... (${lastError})`);
      }
    }

    if (!replyText) {
      return {
        success: false,
        reply: `Errore Groq: Nessun modello disponibile. Dettaglio: ${lastError}`,
        error: lastError
      };
    }

    return {
      success: true,
      reply: replyText,
      patches: null
    };

  } catch (error: any) {
    console.error("ERRORE CRITICO ORCHESTRATOR:", error);
    return {
      success: false,
      reply: `Errore di connessione: ${error?.message || "Errore sconosciuto"}`,
      error: error?.message
    };
  }
}