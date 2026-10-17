"use client";

import React, { useState } from "react";

interface StudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudioSettingsModal({ isOpen, onClose }: StudioSettingsModalProps) {
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [autoSync, setAutoSync] = useState(true);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 w-full max-w-lg rounded-2xl p-6 flex flex-col shadow-[0_0_30px_rgba(0,240,255,0.2)] font-mono">
        <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-4">
          <h2 className="text-lg font-bold text-cyan-300">Impostazioni Avanzate Studio</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-cyan-300 font-bold text-lg transition">
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              TEMPERATURA MODELLO: <span className="text-cyan-300">{temperature}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">TOKEN MASSIMI DI RISPOSTA:</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg px-4 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-slate-400">SINCRONIZZAZIONE AUTOMATICA CLOUD:</span>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 accent-cyan-400"
            />
          </div>

          {saved && (
            <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 p-2 rounded text-xs text-center font-bold animate-pulse">
              Impostazioni salvate con successo!
            </div>
          )}

          <div className="border-t border-cyan-500/30 pt-4 mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="bg-cyan-600/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 text-xs px-5 py-2 rounded-lg font-semibold transition"
            >
              Salva Modifiche
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}