"use client";

import React from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const performanceData = [
  { time: "00:00", tokens: 1200, latency: 120 },
  { time: "04:00", tokens: 2100, latency: 140 },
  { time: "08:00", tokens: 3800, latency: 95 },
  { time: "12:00", tokens: 5200, latency: 110 },
  { time: "16:00", tokens: 4600, latency: 105 },
  { time: "20:00", tokens: 6100, latency: 90 },
];

export default function SystemMetrics() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-white"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold tracking-wide">Unix-AI Core Telemetry</h3>
          <p className="text-sm text-slate-400">Monitoraggio real-time di token e latenza Groq</p>
        </div>
        <span className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
          Live Status: Optimal
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" textAnchor="end" />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
            <Line type="monotone" dataKey="tokens" stroke="#38bdf8" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="latency" stroke="#a855f7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}