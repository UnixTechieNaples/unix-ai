import { validateCodeSyntax } from '@/lib/ai/sandbox';
import { createApprovalRequest } from '@/lib/ai/approvals';
import { storeMemory, searchMemories } from '@/lib/ai/embeddings';

/**
 * Definizione formale degli strumenti a disposizione dell'Agente AI
 */
export const AI_TOOLS = [
  {
    name: 'search_memories',
    description: 'Cerca ricordi o decisioni passate nella memoria semantica vettoriale',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Concetto o domanda da cercare' },
        limit: { type: 'number', description: 'Numero massimo di risultati (default 5)' }
      },
      required: ['query']
    }
  },
  {
    name: 'validate_and_propose_code_change',
    description: 'Valida un blocco di codice nella sandbox e genera una proposta nel Centro Approvazioni',
    parameters: {
      type: 'object',
      properties: {
        taskTitle: { type: 'string', description: 'Titolo breve del task' },
        description: { type: 'string', description: 'Descrizione del cambiamento' },
        filePath: { type: 'string', description: 'Percorso del file interessato (es. app/page.tsx)' },
        originalContent: { type: 'string', description: 'Codice originale attuale' },
        proposedContent: { type: 'string', description: 'Nuovo codice proposto' },
        aiRationale: { type: 'string', description: 'Motivazione tecnica del cambio' }
      },
      required: ['taskTitle', 'filePath', 'proposedContent', 'aiRationale']
    }
  }
];

/**
 * Esecutore dinamico dei Tool invocati dall'agente
 */
export async function executeToolCall(toolName: string, args: any) {
  switch (toolName) {
    case 'search_memories': {
      return await searchMemories(args.query, args.limit || 5);
    }
    case 'validate_and_propose_code_change': {
      // 1. Passaggio obbligatorio in Sandbox
      const validation = validateCodeSyntax(args.proposedContent, args.filePath);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Il codice non ha superato la validazione sintattica nella Sandbox.',
          validationErrors: validation.errors
        };
      }

      // 2. Invio al Centro Approvazioni (Dry-Run)
      const proposal = await createApprovalRequest({
        taskTitle: args.taskTitle,
        description: args.description || '',
        filePath: args.filePath,
        originalContent: args.originalContent || '',
        proposedContent: args.proposedContent,
        aiRationale: args.aiRationale
      });

      return {
        success: true,
        message: 'Codice validato con successo nella Sandbox e proposto nel Centro Approvazioni.',
        proposalId: proposal.id
      };
    }
    default:
      throw new Error(`Tool non riconosciuto: ${toolName}`);
  }
}