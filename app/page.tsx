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

export default function StudioDashboard() {
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>({
    id: "admin-super-unix",
    email: "unix.unix@gmail.com",
    role: "superadmin"
  });

  const [activeTab, setActiveTab] = useState<"chat" | "webhooks" | "report">("chat");
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [branchViewerNode, setBranchViewerNode] = useState<{ id: string; title: string } | null>(null);

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string; file?: { name: string; size: string }; audio?: string | null }>>([
    { role: "unix", content: "Unix-AI Pro Studio online. Dashboard unificata e sincronizzata attiva per unix.unix@gmail.com.", audio: null }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

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
  }, [user]);

  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    name: string;
    size: string;
    type: string;
    contentBase64?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleUpdateNode = async (id: string, newContent: string) => {
    const targetNode = neuralNodes.find((n) => n.id === id);
    if (!targetNode) return;

    const updatedNode = { ...targetNode, content: newContent, timestamp: new Date().toLocaleTimeString("it-IT") };
    setNeuralNodes((prev) => prev.map((node) => (node.id === id ? updatedNode : node)));

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
          <p className="text-[10px] text-slate-500">UTENTE: {user?.email} [{user?.role.toUpperCase()}]</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          <OllamaStatusWidget />
          <TokenMetricsWidget />
        </div>
      </header>

      {/* Navigazione a Schede */}
      <div className="flex gap-2 my-4 z-10 border-b border-cyan-500/20 pb-2">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${activeTab === "chat" ? "bg-cyan-600/30 border border-cyan-400 text-cyan-300" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
        >
          💬 Studio Chat & Neuroni
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
      </div>

      {/* Modali di Sistema */}
      <PromptLibraryModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onSelectPrompt={(content) => setPrompt(content)}
      />

      {branchViewerNode && (
        <MemoryBranchViewer
          nodeId={branchViewerNode.id}
          nodeTitle={branchViewerNode.title}
          isOpen={!!branchViewerNode}
          onClose={() => setBranchViewerNode(null)}
        />
      )}
    </div>
  );
}