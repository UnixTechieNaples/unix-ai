"use client";

import React, { useState, useEffect } from "react";

export default function TokenMetricsWidget() {
  const [metrics, setMetrics] = useState<{
    totalTokensUsed: number;
    estimatedCostUsd: number;
    activeModels: string[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/studio/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.metrics) {
          setMetrics(data.metrics);
        }
      })
      .catch((err) => console.error("Errore caricamento metriche:", err));
  }, []);

  if (!metrics) return null;

  return (
    <div className="bg-slate-900/60 border border-cyan-500/30 rounded-lg p-3 text-xs flex items-center justify-between gap-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
        <span className="text-slate-400 font-bold">TOKEN USATI:</span>
        <span className="text-cyan-300 font-mono font-semibold">{metrics.totalTokensUsed.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-400 font-bold">COSTO STIMATO:</span>
        <span className="text-emerald-400 font-mono font-semibold">${metrics.estimatedCostUsd.toFixed(4)}</span>
      </div>
    </div>
  );
}