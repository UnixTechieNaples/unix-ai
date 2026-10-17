"use client";

import React, { useState, useEffect } from "react";

export default function OllamaStatusWidget() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    // Verifica rapida della connessione a Ollama locale
    fetch("http://127.0.0.1:11434/api/tags")
      .then((res) => {
        if (res.ok) setStatus("online");
        else setStatus("offline");
      })
      .catch(() => setStatus("offline"));
  }, []);

  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-3 text-xs flex items-center justify-between gap-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${status === "online" ? "bg-emerald-400 animate-pulse" : status === "offline" ? "bg-rose-500" : "bg-amber-400 animate-ping"}`}></span>
        <span className="text-slate-400 font-bold">OLLAMA LOCALE:</span>
        <span className={status === "online" ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
          {status === "online" ? "ONLINE (PRIVACY TOTALE)" : status === "offline" ? "OFFLINE / NON RAGGIUNGIBILE" : "VERIFICA..."}
        </span>
      </div>
    </div>
  );
}