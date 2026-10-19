import * as ts from 'typescript';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedCode?: string;
}

export interface CircuitBreakerState {
  attempts: number;
  maxAttempts: number;
  isTripped: boolean;
  lastError?: string;
}

// Mappa in memoria per tracciare i tentativi di risoluzione per file/task
const activeBreakers = new Map<string, CircuitBreakerState>();

const MAX_AUTONOMOUS_ATTEMPTS = 3;

/**
 * Valida la sintassi e la correttezza di un blocco di codice TypeScript/JavaScript.
 */
export function validateCodeSyntax(code: string, fileName = 'temp.tsx'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Crea un sorgente AST virtuale tramite il compilatore TypeScript
    const sourceFile = ts.createSourceFile(
      fileName,
      code,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    // Verifico la presenza di errori sintattici primari
    const parseDiagnostics = (sourceFile as any).parseDiagnostics || [];

    for (const diagnostic of parseDiagnostics) {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(diagnostic.start || 0);
      errors.push(`[Riga ${line + 1}, Colonna ${character + 1}] ${message}`);
    }

    // Controlli di sicurezza di base (es. prevenzione eval o importazioni pericolose non consentite)
    if (code.includes('eval(')) {
      errors.push('Sicurezza: L\'uso di eval() non è consentito per motivi di sicurezza.');
    }

    if (code.includes('process.exit(')) {
      warnings.push('Attenzione: Trovata chiamata a process.exit(), assicurarsi sia intenzionale.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedCode: code,
    };
  } catch (err: any) {
    return {
      isValid: false,
      errors: [`Errore critico del compilatore sandbox: ${err.message}`],
      warnings: [],
    };
  }
}

/**
 * Gestisce il Circuit Breaker per un determinato compito o file.
 * Se l'IA supera 3 tentativi di auto-correzione falliti, l'operazione viene bloccata.
 */
export function checkCircuitBreaker(taskId: string): CircuitBreakerState {
  const current = activeBreakers.get(taskId) || {
    attempts: 0,
    maxAttempts: MAX_AUTONOMOUS_ATTEMPTS,
    isTripped: false,
  };

  return current;
}

/**
 * Registra un fallimento e incrementa il contatore del Circuit Breaker.
 */
export function registerFailure(taskId: string, errorReason: string): CircuitBreakerState {
  const current = checkCircuitBreaker(taskId);
  const newAttempts = current.attempts + 1;

  const newState: CircuitBreakerState = {
    attempts: newAttempts,
    maxAttempts: MAX_AUTONOMOUS_ATTEMPTS,
    isTripped: newAttempts >= MAX_AUTONOMOUS_ATTEMPTS,
    lastError: errorReason,
  };

  activeBreakers.set(taskId, newState);
  return newState;
}

/**
 * Resetta il Circuit Breaker quando il compito ha successo o viene approvato.
 */
export function resetCircuitBreaker(taskId: string): void {
  activeBreakers.delete(taskId);
}