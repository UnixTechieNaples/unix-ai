"use client";

import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export default function ToastNotification({ message, type = "info", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColors = {
    success: "border-emerald-500/50 bg-emerald-950/90 text-emerald-300",
    error: "border-rose-500/50 bg-rose-950/90 text-rose-300",
    info: "border-cyan-500/50 bg-slate-900/90 text-cyan-300",
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 border px-4 py-3 rounded-xl text-xs font-mono shadow-lg backdrop-blur-md flex items-center gap-3 animate-bounce ${borderColors[type]}`}>
      <span>{type === "success" ? "✔️" : type === "error" ? "❌" : "ℹ️"}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-150 font-bold">✕</button>
    </div>
  );
}