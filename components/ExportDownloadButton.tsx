"use client";

import React from "react";

interface ExportDownloadButtonProps {
  content: string;
  filename: string;
  label?: string;
}

export default function ExportDownloadButton({ content, filename, label = "Scarica Documento" }: ExportDownloadButtonProps) {
  const handleDownload = () => {
    if (!content) return;
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "documento-unix-ai.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!content}
      className="bg-emerald-600/30 border border-emerald-400 text-emerald-300 hover:bg-emerald-500/30 px-4 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2"
    >
      <span>📥</span>
      <span>{label}</span>
    </button>
  );
}