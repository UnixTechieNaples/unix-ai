import fs from 'fs';
import path from 'path';
import { validateCodeSyntax } from '@/lib/ai/sandbox';

/**
 * Permette all'entità di modificare o creare un file all'interno del proprio workspace.
 * Include una validazione di sicurezza tramite la sandbox prima di sovrascrivere.
 */
export function selfModifyFile(relativePath: string, newContent: string): { success: boolean; message: string } {
  try {
    // Normalizza il percorso per sicurezza (impedisce path traversal)
    const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\))+/, '');
    const absolutePath = path.resolve(process.cwd(), safePath);

    // 1. Controllo di sicurezza: impediamo modifiche a file di configurazione critici del sistema operativo o env segreti
    if (absolutePath.includes('.env') || absolutePath.includes('node_modules')) {
      return {
        success: false,
        message: 'Modifica rifiutata dal Circuit Breaker: tentativo di alterare file protetti o di configurazione sensibile.'
      };
    }

    // 2. Validazione sintattica con la sandbox (se è un file TypeScript/JavaScript)
    if (absolutePath.endsWith('.ts') || absolutePath.endsWith('.tsx')) {
      const validation = validateCodeSyntax(newContent, path.basename(absolutePath));
      if (!validation.isValid) {
        return {
          success: false,
          message: `Sandbox bloccata: il codice generato contiene errori di sintassi -> ${validation.error}`
        };
      }
    }

    // 3. Scrittura fisica del file
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, newContent, 'utf-8');

    return {
      success: true,
      message: `File ${safePath} modificato e salvato con successo dall'entità autonoma.`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Errore critico durante l'auto-modifica del file: ${error.message}`
    };
  }
}