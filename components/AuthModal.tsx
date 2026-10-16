"use client";

import { useState } from "react";

interface AuthModalProps {
  onLoginSuccess: (user: { id: string; email: string; role: string }) => void;
}

export default function AuthModal({ onLoginSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          action: isSignUp ? "signup" : "signin",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Errore durante l'autenticazione");
      }

      if (isSignUp) {
        setSuccessMsg("Registrazione completata con successo! Ora puoi effettuare il login.");
        setIsSignUp(false);
      } else {
        // Login riuscito, passiamo i dati al componente principale
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || "Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="border border-cyan-500/40 bg-slate-900/90 rounded-xl p-6 w-full max-w-md shadow-[0_0_30px_rgba(0,240,255,0.15)] font-mono text-cyan-400">
        
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-wider text-cyan-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            UNIX-AI // AUTH GATEWAY
          </h2>
          <p className="text-[10px] text-slate-400 mt-1">
            {isSignUp ? "REGISTRAZIONE NUOVO UTENTE / SUPER ADMIN" : "ACCEDI AL SISTEMA NEURALE"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs rounded">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs rounded">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">EMAIL:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuamail@dominio.com"
              className="w-full bg-slate-950 border border-cyan-500/40 rounded px-3 py-2 text-sm text-cyan-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">PASSWORD:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-cyan-500/40 rounded px-3 py-2 text-sm text-cyan-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 py-2.5 rounded text-sm font-semibold transition shadow-[0_0_10px_rgba(0,240,255,0.2)] disabled:opacity-50 mt-2"
          >
            {loading ? "ELABORAZIONE..." : isSignUp ? "REGISTRATI" : "ACCEDI"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setSuccessMsg("");
            }}
            className="text-cyan-400 hover:underline"
          >
            {isSignUp ? "Hai già un account? Accedi" : "Non hai un account? Registrati"}
          </button>
        </div>

      </div>
    </div>
  );
}