"use client";

import { useEffect } from "react";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Errore critico intercettato nel modulo Studio:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-400 font-mono flex flex-col items-center justify-center p-6">
      <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-8 max-w-lg w-full text-center shadow-[0_0_40px_rgba(244,63,94,0.2)]">
        <div className="text-rose-400 text-3xl font-bold mb-2">⚠️ ERRORE DI SISTEMA</div>
        <p className="text-sm text-slate-300 mb-6">
          Si è verificata un'anomalia nel sottosistema neurale o nell'interfaccia di Studio. Il core di sicurezza ha isolato l'errore per preservare la stabilità.
        </p>
        <div className="bg-slate-950 p-3 rounded-lg border border-rose-500/30 text-xs text-rose-300 font-mono mb-6 text-left overflow-x-auto">
          {error.message || "Errore sconosciuto nel rendering della dashboard."}
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="bg-cyan-600/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 px-6 py-2.5 rounded-lg text-xs font-semibold transition"
          >
            Riavvia Subito
          </button>
          <a
            href="/studio"
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center"
          >
            Torna alla Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}