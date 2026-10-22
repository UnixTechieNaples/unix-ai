import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Percorsi chiave dei file del progetto da scansionare
const FILES_TO_SCAN = [
  "app/studio/page.tsx",
  "app/api/studio/route.ts"
];

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const projectRoot = process.cwd();
    let scannedFilesData: { filename: string; content: string }[] = [];

    // Lettura dei file sorgente da scansionare
    for (const relativePath of FILES_TO_SCAN) {
      const fullPath = path.join(projectRoot, relativePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        scannedFilesData.push({ filename: relativePath, content: content.substring(0, 3000) });
      }
    }

    if (scannedFilesData.length === 0) {
      return NextResponse.json({ success: false, error: "Nessun file trovato per la scansione." });
    }

    const systemPrompt = `
SEI L'AUTONOMOUS CODE WATCHDOG DEL UNIX-AI PRO STUDIO.
IL TUO COMPITO È SCANSIONARE IL CODICE SORGENTE DEL PROGETTO PER RILEVARE BUG, INEFFICIENZE O MIGLIORAMENTI DI PERFORMANCE.

FILE ANALIZZATI:
${scannedFilesData.map(f => `--- FILE: ${f.filename} ---\n${f.content}`).join("\n\n")}

REGOLE TASSATIVE:
Se trovi un problema o un'area di miglioramento, proponi una correzione concreta.
Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "hasBug": true,
  "title": "Titolo breve della correzione proposta",
  "description": "Spiegazione del bug o inefficienza trovata",
  "details": "Dettaglio della patch o soluzione proposta",
  "affectedFile": "Nome del file interessato"
}
Se non trovi problemi critici, imposta "hasBug": false.
    `;

    const aiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    const textContent = aiResponse.text || '';
    const completion = { choices: [{ message: { content: textContent } }] };

    const rawContent = completion.choices[0]?.message?.content || "";
    const cleanedJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    if (result.hasBug) {
      const proposal = {
        id: `bugfix-${Date.now()}`,
        type: "bugfix",
        title: result.title || "Ottimizzazione Codice Watchdog",
        description: result.description || "Trovata inefficienza durante la scansione automatica.",
        details: `File: ${result.affectedFile}\n\n${result.details}`,
        timestamp: new Date().toLocaleTimeString("it-IT")
      };

      return NextResponse.json({ success: true, pendingAction: proposal });
    }

    return NextResponse.json({ success: true, message: "Scansione completata: nessun bug rilevato." });

  } catch (err: any) {
    console.error("Errore durante la scansione Watchdog:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}