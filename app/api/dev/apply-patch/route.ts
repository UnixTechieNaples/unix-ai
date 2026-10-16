import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Password di sicurezza Enclave
const SECURE_ENCLAVE_PASSWORD = "Napoli1976Unix";

export async function POST(req: Request) {
  try {
    const { password, patches } = await req.json();

    // 1. Controllo Tassativo della Password
    if (!password || password !== SECURE_ENCLAVE_PASSWORD) {
      return NextResponse.json(
        { 
          success: false, 
          error: "ACCESSO NEGATO: Password di sicurezza dell'Enclave non valida o mancante." 
        },
        { status: 403 }
      );
    }

    if (!Array.isArray(patches) || patches.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nessuna modifica/patch fornita." },
        { status: 400 }
      );
    }

    const appliedFiles = [];

    // 2. Applicazione automatica delle modifiche sui file del progetto locale
    for (const patch of patches) {
      const { relativePath, newContent } = patch;

      if (!relativePath || typeof newContent !== "string") {
        continue;
      }

      // Risoluzione percorso file locale (es. app/page.tsx, components/CyberCore3D.tsx, ecc.)
      const fullPath = path.join(process.cwd(), relativePath);

      // Assicura che la cartella di destinazione esista
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Scrittura effettiva del nuovo codice sul disco fisso
      await fs.writeFile(fullPath, newContent, "utf-8");
      appliedFiles.push(relativePath);
    }

    return NextResponse.json({
      success: true,
      message: `Modifiche applicate con successo a ${appliedFiles.length} file.`,
      modifiedFiles: appliedFiles,
    });

  } catch (error: any) {
    console.error("Errore durante l'applicazione della patch:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Errore sconosciuto durante la scrittura dei file." },
      { status: 500 }
    );
  }
}