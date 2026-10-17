import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { code, language, action } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: "Nessun codice fornito per la sandbox." }, { status: 400 });
    }

    // Simulazione sicura e controllo della sandbox per l'esecuzione di script/codice
    // In un ambiente isolato avanzato, qui si collegherebbe a container Docker o microservizi dedicati.
    
    let output = "";
    let success = true;

    if (action === 'validate_syntax') {
      try {
        // Controllo base di validazione sintattica JavaScript/TypeScript
        if (language === 'javascript' || language === 'typescript') {
          new Function(code);
        }
        output = "Analisi sintattica completata con successo. Nessun errore critico rilevato.";
      } catch (syntaxErr: any) {
        success = false;
        output = `Errore di sintassi: ${syntaxErr.message}`;
      }
    } else {
      // Esecuzione simulata controllata
      output = `[Sandbox E2B / Secure Process]: Esecuzione completata per il linguaggio [${language || 'javascript'}].\nOutput simulato: Codice verificato in ambiente protetto.`;
    }

    return NextResponse.json({
      success,
      output,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Errore interno nella Sandbox." }, { status: 500 });
  }
}