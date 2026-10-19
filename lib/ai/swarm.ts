import { validateCodeSyntax } from '@/lib/ai/sandbox';
import { searchMemories } from '@/lib/ai/embeddings';

export interface SwarmTask {
  taskId: string;
  workerType: 'coder' | 'researcher' | 'security';
  payload: any;
}

export interface SwarmResult {
  taskId: string;
  workerType: string;
  success: boolean;
  output: any;
}

/**
 * Esegue un singolo micro-worker specializzato in base al compito assegnato
 */
async function executeMicroWorker(task: SwarmTask): Promise<SwarmResult> {
  try {
    switch (task.workerType) {
      case 'coder': {
        const validation = validateCodeSyntax(task.payload.code, task.payload.fileName);
        return {
          taskId: task.taskId,
          workerType: 'coder',
          success: validation.isValid,
          output: validation
        };
      }
      case 'researcher': {
        const memories = await searchMemories(task.payload.query, 3, 0.5);
        return {
          taskId: task.taskId,
          workerType: 'researcher',
          success: true,
          output: { memoriesFound: memories }
        };
      }
      case 'security': {
        const hasDangerousEval = task.payload.code?.includes('eval(');
        return {
          taskId: task.taskId,
          workerType: 'security',
          success: !hasDangerousEval,
          output: { secure: !hasDangerousEval, warnings: hasDangerousEval ? ['Rilevato uso di eval()'] : [] }
        };
      }
      default:
        throw new Error(`Tipo di worker sconosciuto: ${task.workerType}`);
    }
  } catch (err: any) {
    return {
      taskId: task.taskId,
      workerType: task.workerType,
      success: false,
      output: { error: err.message }
    };
  }
}

/**
 * Coordina uno sciame di micro-agenti in parallelo per risolvere un obiettivo complesso
 */
export async function runSwarmOperation(tasks: SwarmTask[]): Promise<SwarmResult[]> {
  const promises = tasks.map(task => executeMicroWorker(task));
  const results = await Promise.all(promises);
  return results;
}