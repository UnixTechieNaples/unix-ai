"use client";

import React, { useState, useEffect } from "react";

export default function WebhookMonitorPanel() {
  const [events, setEvents] = useState<Array<{ id: string; type: string; message: string; timestamp: string }>>([
    { id: "1", type: "push", message: "Sincronizzazione repository Git completata con successo.", timestamp: new Date().toLocaleTimeString() },
    { id: "2", type: "database_update", message: "Ricalcolo dei vettori di memoria Supabase effettuato.", timestamp: new Date().toLocaleTimeString() }
  ]);

  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <div className="flex justify-between items-center mb-4 border-b border-cyan-500/20 pb-2">
        <h3 className="text-sm font-bold text-cyan-300 tracking-wider">MONITORAGGIO WEBHOOK & AUTOMAZIONI</h3>
        <span className="text-[10px] bg-emerald-500/20 border border-emerald-400 text-emerald-300 px-2 py-0.5 rounded font-bold animate-pulse">
          IN ASCOLTO
        </span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {events.map((ev) => (
          <div key={ev.id} className="bg-slate-950/60 border border-cyan-500/20 p-2.5 rounded-lg text-xs flex justify-between items-center">
            <div>
              <span className="font-bold text-cyan-400 uppercase">[{ev.type}]</span> <span className="text-slate-300">{ev.message}</span>
            </div>
            <span className="text-[10px] text-slate-500">{ev.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}