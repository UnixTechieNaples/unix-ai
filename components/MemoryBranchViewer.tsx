"use client";

import React, { useState, useEffect } from "react";

interface MemoryVersion {
  versionId: string;
  branch: string;
  content: string;
  timestamp: string;
}

interface MemoryBranchViewerProps {
  nodeId: string;
  nodeTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryBranchViewer({ nodeId, nodeTitle, isOpen, onClose }: MemoryBranchViewerProps) {
  const [versions, setVersions] = useState<MemoryVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && nodeId) {
      fetch(`/api/studio/memory/branch?nodeId=${nodeId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.versions) {
            setVersions(data.versions);
          }
        })
        .catch((err) => console.error("Errore caricamento versioni neurone:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, nodeId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 w-full max-w-2xl rounded-2xl p-6 flex flex-col max-h-[80vh] shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        <div className="flex justify-between items-center border-b border-cyan-500/30 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-cyan-300">Cronologia Versioni (Memory Branching)</h2>
            <p className="text-xs text-slate-400">Neurone: <span className="text-cyan-400 font-semibold">{nodeTitle}</span></p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-cyan-300 font-bold text-lg transition"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <p className="text-cyan-400 animate-pulse text-sm">Caricamento rami e versioni in corso...</p>
          ) : versions.length > 0 ? (
            versions.map((ver) => (
              <div key={ver.versionId} className="bg-slate-950/70 border border-cyan-500/20 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded">
                    Branch: {ver.branch}
                  </span>
                  <span className="text-[10px] text-slate-500">{ver.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded border border-slate-800">
                  {ver.content}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm">Nessuna versione precedente registrata per questo neurone.</p>
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