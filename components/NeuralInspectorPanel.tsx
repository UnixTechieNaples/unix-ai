"use client";

import React, { useState } from "react";

export interface NeuralMemoryNode {
  id: string;
  title: string;
  content: string;
  type: "memory" | "code" | "file" | "context";
  timestamp: string;
}

interface NeuralInspectorPanelProps {
  nodes: NeuralMemoryNode[];
  onUpdateNode: (id: string, newContent: string) => void;
  onDeleteNode: (id: string) => void;
  onAddNode: (title: string, content: string) => void;
}

export default function NeuralInspectorPanel({
  nodes,
  onUpdateNode,
  onDeleteNode,
  onAddNode,
}: NeuralInspectorPanelProps) {
  // Accesso sbloccato automaticamente in modo trasparente per il Super Admin
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const [selectedId, setSelectedId] = useState<string>(nodes[0]?.id || "");
  const [editContent, setEditContent] = useState<string>(nodes[0]?.content || "");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedId) || nodes[0];

  const handleSelect = (node: NeuralMemoryNode) => {
    setSelectedId(node.id);
    setEditContent(node.content);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, editContent);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddNode(newTitle, newContent);
    setNewTitle("");
    setNewContent("");
    setIsAdding(false);
  };

  return (
    <div className="border border-cyan-500/30 bg-slate-900/60 rounded-xl p-4 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.08)] flex flex-col h-full font-mono text-xs">
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-3 mb-3">
        <span className="text-cyan-300 font-bold tracking-wider flex items-center gap-2">
          <span>🧠</span> NEURAL MEMORY INSPECTOR <span className="text-emerald-400 text-[10px] ml-2">[UNLOCKED: 3D_MATRIX]</span>
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 rounded text-[10px] font-semibold transition"
          >
            {isAdding ? "CHIUDI" : "+ NUOVO NEURONE"}
          </button>
        </div>
      </div>

      {isAdding ? (
        <form onSubmit={handleCreate} className="space-y-3 bg-slate-950/60 p-3 rounded-lg border border-cyan-500/20 mb-3">
          <p className="text-cyan-400 font-bold text-[11px]">[INIEZIONE NUOVO NODO MEMORIA]</p>
          <input
            type="text"
            placeholder="Titolo / Etichetta neurone..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-slate-900 border border-cyan-500/30 rounded px-3 py-1.5 text-cyan-100 outline-none focus:border-cyan-400"
          />
          <textarea
            placeholder="Contenuto o codice da memorizzare..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full h-20 bg-slate-900 border border-cyan-500/30 rounded p-2 text-cyan-100 outline-none focus:border-cyan-400 resize-none text-xs"
          />
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold rounded hover:bg-cyan-400 transition"
            >
              MEMORIZZA
            </button>
          </div>
        </form>
      ) : null}

      {/* MAPPA VISUALE INTERATTIVA DEI NEURONI */}
      <div className="mb-4 bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 relative overflow-hidden shadow-inner">
        <div className="absolute top-2 left-3 text-[9px] text-cyan-500 tracking-widest">[INTERACTIVE_NEURAL_CLUSTER]</div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 pb-2 min-h-[100px]">
          {nodes.map((node, index) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <div
                key={node.id}
                onClick={() => handleSelect(node)}
                className={`relative group cursor-pointer flex flex-col items-center transition-all duration-300 transform hover:scale-110 ${
                  isSelected ? "scale-110" : "opacity-80"
                }`}
              >
                {index > 0 && (
                  <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-cyan-500/40 hidden sm:block" />
                )}

                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isSelected
                      ? "bg-cyan-500/30 border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.8)] animate-pulse"
                      : "bg-slate-900 border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:border-cyan-400"
                  }`}
                >
                  <span className="text-cyan-300 font-bold text-xs">N#{node.id}</span>
                </div>

                <span className={`mt-1.5 text-[10px] max-w-[80px] truncate text-center ${
                  isSelected ? "text-cyan-300 font-bold" : "text-slate-400"
                }`}>
                  {node.title}
                </span>

                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        <div className="md:col-span-1 border-r border-cyan-500/20 pr-3 space-y-2 max-h-[220px] overflow-y-auto">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">INDICE NODI ({nodes.length})</p>
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => handleSelect(node)}
              className={`p-2 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                selectedNode?.id === node.id
                  ? "bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  : "bg-slate-950/40 border-cyan-500/20 text-slate-400 hover:border-cyan-500/40 hover:text-slate-200"
              }`}
            >
              <div className="truncate">
                <div className="font-bold text-xs truncate text-cyan-300">{node.title}</div>
              </div>
              <span className="text-[9px] px-1 py-0.5 rounded bg-slate-900 border border-cyan-500/30 uppercase text-cyan-400">
                {node.type}
              </span>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 flex flex-col space-y-3">
          {selectedNode ? (
            <>
              <div className="flex justify-between items-center bg-slate-950/60 px-3 py-2 rounded-lg border border-cyan-500/20">
                <div>
                  <span className="text-cyan-400 font-bold">{selectedNode.title}</span>
                  <span className="ml-2 text-[10px] text-slate-500">ID: #{selectedNode.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteNode(selectedNode.id)}
                  className="text-[10px] bg-rose-950/40 border border-rose-500/40 text-rose-300 px-2.5 py-1 rounded hover:bg-rose-900/40 transition"
                >
                  ELIMINA NODO
                </button>
              </div>

              <div className="flex-1 flex flex-col">
                <span className="text-[10px] text-slate-400 mb-1">CONTENUTO MEMORIZZATO (Modificabile in tempo reale):</span>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full flex-1 min-h-[100px] bg-slate-950 border border-cyan-500/30 rounded-lg p-3 text-cyan-100 outline-none focus:border-cyan-400 text-xs font-mono resize-none shadow-inner"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 rounded-lg text-xs font-bold transition shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                >
                  SALVA MODIFICHE AL NEURONE
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-slate-600 italic">
              Nessun neurone selezionato.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}