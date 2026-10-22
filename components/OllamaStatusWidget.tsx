"use client";

import React from "react";

export default function OllamaStatusWidget() {
  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-3 text-xs flex items-center justify-between gap-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
        <span className="text-slate-400 font-bold">OLLAMA LOCALE:</span>
        <span className="text-rose-400 font-semibold">
          DISATTIVATO (MODALITÀ CLOUD)
        </span>
      </div>
    </div>
  );
}