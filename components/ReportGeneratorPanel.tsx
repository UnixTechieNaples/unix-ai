"use client";

import React, { useState } from "react";

export default function ReportGeneratorPanel() {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("report");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/studio/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, format })
      });
      const data = await res.json();

      if (data.success) {
        setResult(data.content);
      } else {
        setResult(`Errore: ${data.error}`);
      }
    } catch (err: any) {
      setResult(`Errore di connessione: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-6 shadow-lg backdrop-blur-md flex flex-col h-full">
      <div className="border-b border-cyan-500/20 pb-4 mb-4">
        <h2 className="text-lg font-bold text-cyan-300">Generatore Automatico Report ed Ebook</h2>
        <p className="text-xs text-slate-400">Compila documenti strutturati basati sui contesti e sulla memoria neurale.</p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">ARGOMENTO / TITOLO:</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Es. Architettura dei Microservizi e Sicurezza Cloud..."
            className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-4 py-2.5 text-sm text-cyan-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-400 mb-1">FORMATO:</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-4 py-2.5 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400 transition"
            >
              <option value="report">Report Tecnico Dettagliato</option>
              <option value="ebook">Ebook Suddiviso in Capitoli</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 bg-cyan-600/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 px-6 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 h-[42px]"
          >
            {loading ? "Generazione..." : "Genera Documento"}
          </button>
        </div>
      </form>

      {result && (
        <div className="flex-1 bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 overflow-y-auto max-h-[400px]">
          <h3 className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">[CONTENUTO GENERATO]</h3>
          <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{result}</div>
        </div>
      )}
    </div>
  );
}