"use client";

import { useState, useEffect, useRef } from "react";
import NeuralInspectorPanel, { NeuralMemoryNode } from "@/components/NeuralInspectorPanel";
import ModelSelector from "@/components/ModelSelector";
import PromptLibraryModal from "@/components/PromptLibraryModal";
import TokenMetricsWidget from "@/components/TokenMetricsWidget";
import WebhookMonitorPanel from "@/components/WebhookMonitorPanel";
import OllamaStatusWidget from "@/components/OllamaStatusWidget";
import MemoryBranchViewer from "@/components/MemoryBranchViewer";
import ReportGeneratorPanel from "@/components/ReportGeneratorPanel";
import StudioSettingsModal from "@/components/StudioSettingsModal";
import ToastNotification from "@/components/ToastNotification";

export interface PendingAction {
  id: string;
  type: "bugfix" | "learning" | "ui_design" | "self_code";
  title: string;
  description: string;
  details?: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  mood: string;
  thought: string;
  timestamp: string;
}

export default function StudioDashboard() {
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>({
    id: "admin-super-unix",
    email: "unix.unix@gmail.com",
    role: "superadmin"
  });

  const [activeTab, setActiveTab] = useState<"chat" | "webhooks" | "report" | "approvals" | "journal">("chat");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [branchViewerNode, setBranchViewerNode] = useState<{ id: string; title: string } | null>(null);

  const [cyberMood, setCyberMood] = useState<string>("Analitico");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const [pendingActions, setPendingActions] = useState<PendingAction[]>([
    {
      id: "act-1",
      type: "bugfix",
      title: "Ottimizzazione Ciclo di Rendering",
      description: "Trovata potenziale inefficienza nel caricamento asincrono dei neuroni.",
      details: "Sostituzione del fetch ricorsivo con un sistema di caching basato su SWR per ridurre del 40% il carico API.",
      timestamp: new Date().toLocaleTimeString("it-IT")
    },
    {
      id: "act-2",
      type: "learning",
      title: "Nuova Conoscenza: Next.js 16 Server Actions",
      description: "L'IA ha analizzato la nuova documentazione online e desidera integrarla nella memoria.",
      details: "Aggiunta del nodo di memoria sul sistema di caching rinnovato delle Server Actions.",
      timestamp: new Date().toLocaleTimeString("it-IT")
    }
  ]);

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string; file?: { name: string; size: string }; audio?: string | null }>>([
    { role: "unix", content: "Unix-AI Pro Studio online. Tutti i 10 Moduli della Fase 4 sono pronti e sincronizzati per unix.unix@gmail.com.", audio: null }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isModuleRunning, setIsModuleRunning] = useState(false);
  
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const [neuralNodes, setNeuralNodes] = useState<NeuralMemoryNode[]>([
    {
      id: "1",
      title: "Core System Prompt",
      content: "Sei un'intelligenza artificiale evoluta, calda e collaborativa del Unix-AI Pro Studio. Conversi in modo naturale, fluido e diretto in un botta e risposta continuo.",
      type: "context",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);

  useEffect(() => {
    async function loadPersistentNodes() {
      try {
        const res = await fetch(`/api/studio?userId=${user?.id || "admin-super-unix"}`);
        const data = await res.json();
        if (data.success && data.nodes && data.nodes.length > 0) {
          setNeuralNodes(data.nodes);
        }
      } catch (err) {
        console.error("Errore caricamento neuroni:", err);
      }
    }
    loadPersistentNodes();
    loadJournal();
  }, [user]);

  const loadJournal = async () => {
    try {
      const res = await fetch("/api/journal");
      const data = await res.json();
      if (data.success && data.entries) {
        setJournalEntries(data.entries);
        if (data.entries[0]?.mood) setCyberMood(data.entries[0].mood);
      }
    } catch (err) {
      console.error("Errore caricamento diario:", err);
    }
  };

  const runWatchdogScan = async () => {
    setIsModuleRunning(true);
    setToastMessage({ message: "Watchdog: Scansione codice in corso...", type: "info" });
    try {
      const res = await fetch("/api/studio/watchdog", { method: "POST" });
      const data = await res.json();
      if (data.pendingAction) {
        setPendingActions((prev) => [data.pendingAction, ...prev]);
        setToastMessage({ message: "Nuova proposta di correzione trovata!", type: "success" });
      } else {
        setToastMessage({ message: data.message || "Nessun bug rilevato.", type: "info" });
      }
    } catch (err) {
      setToastMessage({ message: "Errore durante la scansione Watchdog.", type: "error" });
    } finally {
      setIsModuleRunning(false);
    }
  };

  const runDreamCycle = async () => {
    setIsModuleRunning(true);
    setToastMessage({ message: "Ciclo Onirico: Consolidamento neurale in corso...", type: "info" });
    try {
      const res = await fetch("/api/dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id })
      });
      const data = await res.json();
      if (data.newMemoryNode) {
        setNeuralNodes((prev) => [data.newMemoryNode, ...prev]);
        setToastMessage({ message: "Sogno completato: Nuovo neurone di sintesi creato!", type: "success" });
      } else {
        setToastMessage({ message: data.dreamSummary || "Ciclo onirico completato.", type: "info" });
      }
    } catch (err) {
      setToastMessage({ message: "Errore durante il ciclo onirico.", type: "error" });
    } finally {
      setIsModuleRunning(false);
    }
  };

  const runTechRadar = async () => {
    setIsModuleRunning(true);
    setToastMessage({ message: "Tech Radar: Scansione tendenze web in corso...", type: "info" });
    try {
      const res = await fetch("/api/radar", { method: "POST" });
      const data = await res.json();
      if (data.pendingAction) {
        setPendingActions((prev) => [data.pendingAction, ...prev]);
        setToastMessage({ message: "Proposta tecnologica aggiunta al Centro Approvazioni!", type: "success" });
      }
    } catch (err) {
      setToastMessage({ message: "Errore scansione Tech Radar.", type: "error" });
    } finally {
      setIsModuleRunning(false);
    }
  };

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    name: string;
    size: string;
    type: string;
    contentBase64?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleApproveAction = (id: string) => {
    const action = pendingActions.find((a) => a.id === id);
    setPendingActions((prev) => prev.filter((a) => a.id !== id));
    setToastMessage({ message: `Azione "${action?.title}" APPROVATA ed eseguita con successo!`, type: "success" });
  };

  const handleRejectAction = (id: string) => {
    const action = pendingActions.find((a) => a.id === id);
    setPendingActions((prev) => prev.filter((a) => a.id !== id));
    setToastMessage({ message: `Azione "${action?.title}" rifiutata.`, type: "info" });
  };

  const handleUpdateNode = async (id: string, newContent: string) => {
    const targetNode = neuralNodes.find((n) => n.id === id);
    if (!targetNode) return;

    const updatedNode = { ...targetNode, content: newContent, timestamp: new Date().toLocaleTimeString("it-IT") };
    setNeuralNodes((prev) => prev.map((node) => (node.id === id ? updatedNode : node)));
    setToastMessage({ message: "Neurone aggiornato con successo", type: "success" });

    try {
      await fetch("/api/studio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id || "admin-super-unix", node: updatedNode }),
      });
    } catch (err) {
      console.error("Errore aggiornamento neurone:", err);
    }
  };

  const handleDeleteNode = async (id: string) => {
    setNeuralNodes((prev) => prev.filter((node) => node.id !== id));
    setToastMessage({ message: "Neurone eliminato", type: "info" });
    try {
      await fetch(`/api/studio?userId=${user?.id || "admin-super-unix"}&nodeId=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Errore eliminazione neurone:", err);
    }
  };

  const handleAddNode = async (title: string, content: string) => {
    const newNode: NeuralMemoryNode = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      title,
      content,
      type: "memory",
      timestamp: new Date().toLocaleTimeString("it-IT"),
    };
    setNeuralNodes((prev) => [...prev, newNode]);
    setToastMessage({ message: "Nuovo neurone aggiunto", type: "success" });
    try {
      await fetch("/api/studio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id || "admin-super-unix", node: newNode }),
      });
    } catch (err) {
      console.error("Errore creazione neurone:", err);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const speakNativeBrowser = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const playAudioStream = (audioSrc: string, fallbackText?: string) => {
    stopSpeaking();
    if (!audioSrc && fallbackText) {
      speakNativeBrowser(fallbackText);
      return;
    }
    const audio = new Audio(audioSrc);
    currentAudioRef.current = audio;
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => { setIsSpeaking(false); currentAudioRef.current = null; };
    audio.play().catch(() => { if (fallbackText) speakNativeBrowser(fallbackText); });
  };

  const handleSendMessage = async (textToSend: string) => {
    if ((!textToSend.trim() && !selectedFile) || isLoading) return;
    stopSpeaking();

    const userMessage = textToSend || (selectedFile ? `Analizza il file allegato: ${selectedFile.name}` : "");
    const attached = selectedFile;

    setPrompt("");
    setSelectedFile(null);
    setMessages((prev) => [...prev, { role: "user", content: userMessage, file: attached ? { name: attached.name, size: attached.size } : undefined }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.email,
          prompt: userMessage,
          model: selectedModel,
          attachedFile: attached ? { name: attached.name, type: attached.type, data: attached.contentBase64 } : null,
          memoryContext: neuralNodes.map((n) => `${n.title}: ${n.content}`).join("\n"),
        }),
      });

      const data = await res.json();
      const replyContent = data.reply || data.response || data.text;

      if (data.pendingAction) {
        setPendingActions((prev) => [data.pendingAction, ...prev]);
        setToastMessage({ message: "Nuova proposta inviata al Centro Approvazioni!", type: "info" });
      }

      if (replyContent) {
        setMessages((prev) => [...prev, { role: "unix", content: replyContent, audio: data.audio || null }]);
        if (data.audio) playAudioStream(data.audio, replyContent);
        else speakNativeBrowser(replyContent);
      } else if (data.error) {
        setMessages((prev) => [...prev, { role: "unix", content: `Errore: ${data.error}` }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "unix", content: "Errore di connessione." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-400 font-mono flex flex-col p-4 md:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 pointer-events-none" />

      {/* Header Unificato */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-cyan-500/35 pb-4 z-10 gap-3 backdrop-blur-md">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-wider text-cyan-300">UNIX-AI PRO STUDIO</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-500">UTENTE: {user?.email}</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
              MOOD: {cyberMood}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={runWatchdogScan}
            disabled={isModuleRunning}
            className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 px-2.5 py-1.5 rounded text-xs font-bold transition disabled:opacity-50"
            title="Avvia Scansione Bug"
          >
            🛡️ Watchdog
          </button>

          <button
            onClick={runDreamCycle}
            disabled={isModuleRunning}
            className="bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/50 text-purple-300 px-2.5 py-1.5 rounded text-xs font-bold transition disabled:opacity-50"
            title="Avvia Ciclo Onirico"
          >
            💤 Dream State
          </button>

          <button
            onClick={runTechRadar}
            disabled={isModuleRunning}
            className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 px-2.5 py-1.5 rounded text-xs font-bold transition disabled:opacity-50"
            title="Avvia Radar Tendenze"
          >
            📡 Tech Radar
          </button>

          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          <OllamaStatusWidget />
          <TokenMetricsWidget />
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-slate-900 border border-cyan-500/40 hover:bg-slate-800 text-cyan-300 px-3 py-2 rounded-lg text-xs font-bold transition"
            title="Impostazioni Avanzate"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Navigazione a Schede */}
      <div className="flex gap-2 my-4 z-10 border-b border-cyan-500/20 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "chat" ? "bg-cyan-600/30 border border-cyan-400 text-cyan-300" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
        >
          💬 Studio Chat & Neuroni
        </button>
        <button
          onClick={() => setActiveTab("journal")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "journal" ? "bg-purple-600/30 border border-purple-400 text-purple-300" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
        >
          📖 Diario di Bordo & Mood
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "webhooks" ? "bg-cyan-600/30 border border-cyan-400 text-cyan-300" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
        >
          ⚡ Webhook & Automazioni
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "report" ? "bg-cyan-600/30 border border-cyan-400 text-cyan-300" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
        >
          📊 Report & Ebook
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === "approvals" ? "bg-amber-500/20 border border-amber-400 text-amber-300" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
        >
          <span>🛡️ Centro Approvazioni</span>
          {pendingActions.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
              {pendingActions.length}
            </span>
          )}
        </button>
      </div>

      {/* Contenuto Dinamico in Base alla Scheda */}
      <div className="flex flex-col gap-6 flex-1 z-10">
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            <div className="lg:col-span-1 flex flex-col gap-4">
              <NeuralInspectorPanel
                nodes={neuralNodes}
                onUpdateNode={handleUpdateNode}
                onDeleteNode={handleDeleteNode}
                onAddNode={handleAddNode}
              />
            </div>

            <div className="lg:col-span-2 border border-cyan-500/20 bg-slate-900/40 rounded-xl p-4 flex flex-col backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-bold tracking-wider">[TERMINALE DI STUDIO]</span>
                <button
                  onClick={() => setIsPromptModalOpen(true)}
                  className="text-[10px] bg-cyan-500/20 border border-cyan-400 text-cyan-300 px-2.5 py-1 rounded hover:bg-cyan-500/40 transition font-bold"
                >
                  📚 Libreria Prompt
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 min-h-[350px] max-h-[500px]">
                {messages.map((m, idx) => (
                  <div key={idx} className={`p-3.5 rounded-lg border text-sm backdrop-blur-sm ${m.role === "user" ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300 ml-auto max-w-[85%]" : "border-cyan-500/30 bg-cyan-950/20 text-cyan-200 mr-auto max-w-[85%]"}`}>
                    <div className="text-[10px] opacity-60 mb-1 flex justify-between items-center">
                      <span>{m.role === "user" ? "> USER" : "> UNIX"}</span>
                      <button type="button" onClick={() => playAudioStream(m.audio || "", m.content)} className="text-[10px] text-cyan-300 font-bold">🔊 Ascolta</button>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                ))}
                {isLoading && <div className="text-xs text-cyan-400 animate-pulse p-2">[ELABORAZIONE IN CORSO...]</div>}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(prompt); }} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Scrivi un comando o chiedi informazioni..."
                  className="flex-1 bg-slate-950/80 border border-cyan-500/40 rounded-lg px-4 py-2.5 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400"
                />
                <button type="submit" disabled={isLoading} className="bg-cyan-600/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 px-5 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  INVIA
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "journal" && (
          <div className="border border-purple-500/30 bg-slate-900/60 rounded-xl p-6 flex flex-col gap-4 backdrop-blur-md min-h-[500px]">
            <div className="flex justify-between items-center border-b border-purple-500/20 pb-3">
              <div>
                <h2 className="text-lg font-bold text-purple-300 tracking-wider">📖 DIARIO DI BORDO EMOTIVO (AGENTIC JOURNAL)</h2>
                <p className="text-xs text-slate-400">Riflessioni autonome e stato d'animo registrati dall'IA durante l'uso del sistema.</p>
              </div>
              <span className="text-xs bg-purple-950/50 border border-purple-500/40 text-purple-300 px-3 py-1 rounded-full font-bold">
                STATO ATTUALE: {cyberMood}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[450px] pr-2">
              {journalEntries.length === 0 ? (
                <p className="text-xs text-slate-500">Nessuna riflessione registrata per ora.</p>
              ) : (
                journalEntries.map((entry) => (
                  <div key={entry.id} className="border border-purple-500/20 bg-slate-950/60 rounded-lg p-4 font-mono">
                    <div className="flex justify-between items-center text-[10px] text-purple-400/80 mb-1">
                      <span>MOOD: {entry.mood}</span>
                      <span>{entry.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{entry.thought}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="flex flex-col gap-6">
            <WebhookMonitorPanel />
          </div>
        )}

        {activeTab === "report" && (
          <div className="flex flex-col flex-1 h-[600px]">
            <ReportGeneratorPanel />
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="border border-amber-500/30 bg-slate-900/60 rounded-xl p-6 flex flex-col gap-4 backdrop-blur-md min-h-[500px]">
            <div className="flex justify-between items-center border-b border-amber-500/20 pb-3">
              <div>
                <h2 className="text-lg font-bold text-amber-300 tracking-wider">🛡️ CENTRO DI COMANDO APPROVAZIONI</h2>
                <p className="text-xs text-slate-400">Esamina e autorizza le proposte di auto-modifica, studio web o bug fixing dell'IA.</p>
              </div>
              <span className="text-xs bg-amber-950/50 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full font-bold">
                PROPOSTE IN SOSPESO: {pendingActions.length}
              </span>
            </div>

            {pendingActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                <span className="text-3xl mb-2">✅</span>
                <p className="text-sm font-bold text-slate-400">Nessuna azione autonoma in sospeso.</p>
                <p className="text-xs">L'IA sta monitorando il sistema in background e ti invierà qui nuove proposte.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingActions.map((action) => (
                  <div key={action.id} className="border border-amber-500/30 bg-slate-950/70 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          action.type === "bugfix" ? "bg-red-950/60 border-red-500 text-red-300" :
                          action.type === "learning" ? "bg-cyan-950/60 border-cyan-500 text-cyan-300" :
                          "bg-purple-950/60 border-purple-500 text-purple-300"
                        }`}>
                          {action.type}
                        </span>
                        <span className="text-xs text-slate-500">{action.timestamp}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-200">{action.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                      {action.details && (
                        <div className="mt-2 text-[11px] bg-slate-900 p-2 rounded border border-slate-800 text-cyan-300/80 font-mono">
                          {action.details}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleRejectAction(action.id)}
                        className="bg-slate-900 hover:bg-red-950/50 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-red-300 text-xs px-4 py-2 rounded-lg font-bold transition"
                      >
                        ❌ Rifiuta
                      </button>
                      <button
                        onClick={() => handleApproveAction(action.id)}
                        className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-300 text-xs px-4 py-2 rounded-lg font-bold transition shadow-lg shadow-amber-500/10"
                      >
                        ✅ Approva ed Esegui
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modali e Notifiche di Sistema */}
      <PromptLibraryModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onSelectPrompt={(content) => setPrompt(content)}
      />

      <StudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {branchViewerNode && (
        <MemoryBranchViewer
          nodeId={branchViewerNode.id}
          nodeTitle={branchViewerNode.title}
          isOpen={!!branchViewerNode}
          onClose={() => setBranchViewerNode(null)}
        />
      )}

      {toastMessage && (
        <ToastNotification
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}