import { NextResponse } from "next/server";
import AdmZip from "adm-zip";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "Nessun file caricato." }, { status: 400 });
    }

    const fileName = file.name;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let extractedFiles: { path: string; content: string; size: number }[] = [];

    // Controlla se il file è un archivio ZIP
    if (fileName.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
      try {
        const zip = new AdmZip(fileBuffer);
        const zipEntries = zip.getEntries();

        for (const entry of zipEntries) {
          // Ignora le directory vuote o i file di sistema nascosti (es. __MACOSX)
          if (entry.isDirectory || entry.entryName.includes("__MACOSX")) continue;

          let content = "";
          try {
            // Prova a leggere il contenuto come testo utf-8
            content = entry.getData().toString("utf8");
          } catch (e) {
            content = "[File binario o non leggibile come testo]";
          }

          extractedFiles.push({
            path: entry.entryName,
            content: content,
            size: entry.header.size,
          });
        }
      } catch (zipErr: any) {
        return NextResponse.json({ success: false, error: `Errore durante l'estrazione dello ZIP: ${zipErr.message}` }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        type: "zip",
        fileName,
        totalFiles: extractedFiles.length,
        files: extractedFiles,
      });
    } else {
      // Gestione di un file singolo standard (es. txt, log, json, js, ecc.)
      let content = "";
      try {
        content = fileBuffer.toString("utf8");
      } catch (e) {
        content = "[File binario]";
      }

      return NextResponse.json({
        success: true,
        type: "single",
        fileName,
        fileSize: file.size,
        content: content,
      });
    }
  } catch (error: any) {
    console.error("Errore elaborazione file:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
