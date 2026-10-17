"use client";

import React, { useState, useEffect } from "react";

interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (content: string) => void;
}

export default function PromptLibraryModal({ isOpen, onClose, onSelectPrompt }: PromptLibraryModalProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/studio/prompts")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.prompts) {
            setPrompts(data.prompts);
          }
        })
        .catch((err) => console.error("Errore caricamento prompt library:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 w-full max-w-2xl rounded-2xl p-6 flex flex-col max-h-[80vh] shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-4">
          <h2 className="text-lg font-bold text-cyan-300">Libreria Prompt e Template</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-cyan-300 font-bold text-lg transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <p className="text-cyan-400 animate-pulse text-sm">Caricamento template in corso...</p>
          ) : prompts.length > 0 ? (
            prompts.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectPrompt(p.content);
                  onClose();
                }}
                className="bg-slate-950/60 border border-cyan-500/20 hover:border-cyan-400 p-4 rounded-xl cursor-pointer transition group"
              >
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-cyan-200 group-hover:text-cyan-400 text-sm">{p.title}</h3>
                  <span className="text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded">
                    {p.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{p.content}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm">Nessun template disponibile.</p>
          )}
        </div>

        <div className="border-t border-cyan-500/30 pt-4 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}