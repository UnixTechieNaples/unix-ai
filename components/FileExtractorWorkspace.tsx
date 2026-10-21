"use client";

import React, { useState } from "react";

interface ExtractedFile {
  path: string;
  content: string;
  size: number;
}

export default function FileExtractorWorkspace() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<ExtractedFile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedFile(null);

    try {
      const res = await fetch("/api/upload-extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Errore durante l'elaborazione del file.");
      }

      setResult(data);
      if (data.type === "single") {
        setSelectedFile({ path: data.fileName, content: data.content, size: data.fileSize });
      } else if (data.files && data.files.length > 0) {
        setSelectedFile(data.files[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = result?.files?.filter((f: ExtractedFile) =>
    f.path.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-zinc-100 max-w-6xl mx-auto shadow-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-wide text-emerald-400">Laboratorio Estrazione Archivi & File</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Trascina o seleziona un file ZIP, di log o di codice per analizzarne la struttura e i contenuti in tempo reale.
        </p>
      </div>

      {/* Area Drag & Drop / Upload */}
      <div className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 transition-colors rounded-xl p-8 text-center bg-zinc-900/40 relative">
        <input
          type="file"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <svg className="w-12 h-12 text-emerald-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium">
            {loading ? "Analisi ed estrazione in corso..." : "Clicca qui o trascina un file (.zip, .txt, .json, .ts, .js)"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Visualizzatore Risultati */}
      {result && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Se è un file ZIP, mostra l'albero dei file */}
          {result.type === "zip" ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col h-[500px]">
              <div className="mb-3">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Archivio: {result.fileName}</span>
                <p className="text-xs text-zinc-400 mt-0.5">Totale file estratti: {result.totalFiles}</p>
                <input
                  type="text"
                  placeholder="Cerca file..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-3 w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {filteredFiles.map((file: ExtractedFile, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors truncate ${
                      selectedFile?.path === file.path
                        ? "bg-emerald-600 text-white font-medium"
                        : "hover:bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {file.path}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col h-[500px] justify-center items-center text-center">
              <p className="text-sm font-medium text-emerald-400">{result.fileName}</p>
              <p className="text-xs text-zinc-400 mt-1">File singolo caricato con successo.</p>
            </div>
          )}

          {/* Anteprima Contenuto del File Selezionato */}
          <div className={`${result.type === "zip" ? "md:col-span-2" : "md:col-span-2"} bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col h-[500px]`}>
            {selectedFile ? (
              <>
                <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                  <span className="text-xs font-mono text-emerald-400 truncate max-w-[60%]">{selectedFile.path}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`File: ${selectedFile.path}\n\nContenuto:\n${selectedFile.content}`);
                        alert("Contenuto del file copiato negli appunti! Ora incollalo nella Chat per farlo analizzare all'IA.");
                      }}
                      className="bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/50 px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center gap-1"
                    >
                      📋 Copia per la Chat
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-zinc-950 p-3 rounded border border-zinc-900 font-mono text-xs text-zinc-300 whitespace-pre-wrap select-all">
                  {selectedFile.content}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
                Seleziona un file dalla lista per visualizzarne il contenuto
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}