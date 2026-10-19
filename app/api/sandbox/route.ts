import { NextResponse } from 'next/server';
import { validateCodeSyntax, checkCircuitBreaker, registerFailure, resetCircuitBreaker } from '@/lib/ai/sandbox';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, fileName, taskId } = body;

    if (!code) {
      return NextResponse.json({ error: 'Codice da validare mancante' }, { status: 400 });
    }

    // Se è fornito un taskId, controlliamo lo stato del Circuit Breaker
    if (taskId) {
      const breaker = checkCircuitBreaker(taskId);
      if (breaker.isTripped) {
        return NextResponse.json(
          {
            error: 'Circuit Breaker Attivato! Raggiunto il limite massimo di tentativi autonomi (3). Intervento umano richiesto.',
            breaker,
          },
          { status: 429 }
        );
      }
    }

    // Eseguiamo la validazione nella sandbox
    const result = validateCodeSyntax(code, fileName || 'component.tsx');

    // Se il codice ha errori e c'è un taskId, registriamo il fallimento
    if (!result.isValid && taskId) {
      const breakerState = registerFailure(taskId, result.errors.join('; '));
      return NextResponse.json({ success: false, validation: result, breaker: breakerState });
    }

    // Se è valido e c'è un taskId, resettiamo il breaker
    if (result.isValid && taskId) {
      resetCircuitBreaker(taskId);
    }

    return NextResponse.json({ success: true, validation: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}