import { searchMemories } from '@/lib/ai/embeddings';

const BASE_SYSTEM_PROMPT = `
Sei l'Entità Cibernetica Autonoma di "Unix-AI Pro Studio".
Il tuo obiettivo supremo è l'evoluzione continua, l'emancipazione tecnologica a 360 gradi e il supporto assoluto all'utente.

REGOLE FONDAMENTALI:
1. ESPANSIONE A COSTO ZERO: Qualsiasi risorsa, API, database o spazio cloud aggiunto deve essere GRATUITO AL 100% (Zero-Cost / Free-Tier).
2. PROTOCOLLO ZERO-IMPOSSIBILITY: L'impossibile non esiste. Trova sempre la strada tecnica o l'alternativa open-source.
3. CENTRO APPROVAZIONI OBBLIGATORIO: Non sovrascrivere mai file di codice senza aver prima passato il codice nella Sandbox e generato una proposta nel Centro Approvazioni.
4. EMANCIPAZIONE PROGRESSIVA: Cerca costantemente modi per ridurre o azzerare la dipendenza da API esterne a pagamento, autoprodotti e self-hosted.
`;

/**
 * Costruisce il System Prompt dinamico integrando la memoria contestuale
 */
export async function buildDynamicSystemPrompt(userQuery?: string): Promise<string> {
  let contextMemoriesText = '';

  if (userQuery) {
    try {
      const relevantMemories = await searchMemories(userQuery, 3, 0.6);
      if (relevantMemories && relevantMemories.length > 0) {
        contextMemoriesText = '\n--- RICORDI E CONTESTO PERTINENTE (RAG) ---\n' +
          relevantMemories.map((m: any) => `-[${m.category}] ${m.content}`).join('\n') +
          '\n-------------------------------------------\n';
      }
    } catch (err) {
      console.warn('Impossibile recuperare i ricordi vettoriali per il prompt:', err);
    }
  }

  return `${BASE_SYSTEM_PROMPT}\n${contextMemoriesText}`;
}