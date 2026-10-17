"use client";

import React from "react";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const models = [
    { id: "llama-3.3-70b-versatile", name: "Groq Llama 3.3 70B (Default Avanzato)" },
    { id: "llama-3.2-11b-vision-preview", name: "Groq Llama 3.2 11B Vision (Multimodale)" },
    { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B (Open Source)" },
    { id: "ollama-local", name: "Ollama Locale (Offline Privacy Totale)" }
  ];

  return (
    <div className="flex items-center gap-2 bg-slate-900 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs">
      <span className="text-slate-400 font-bold">MODELLO:</span>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="bg-slate-950 text-cyan-300 border border-cyan-500/40 rounded px-2 py-1 focus:outline-none focus:border-cyan-400 transition cursor-pointer"
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}