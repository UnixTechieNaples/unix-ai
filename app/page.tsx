"use client";

import { useState, useEffect, useRef } from "react";
import NeuralReactor from "@/components/NeuralReactor";
import CyberCoreScene from "@/components/CyberCore3D";
import NeuralInspectorPanel, { NeuralMemoryNode } from "@/components/NeuralInspectorPanel";
import AuthModal from "@/components/AuthModal";

export default function StudioDashboard() {
  // Stato Autenticazione e Utente Corrente
  const [user, setUser] = useState<{ id: string; email: string; role: string } | null>(null);

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string; file?: { name: string; size: string } }>>([
    { role: "unix", content: "Unix-AI Pro Studio online. Effettua l'accesso per sincronizzare la tua memoria neurale." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stato Memoria Neuroni Modificabili
  const [neuralNodes, setNeuralNodes] = useState<NeuralMemoryNode[]>([
    {
      id: "1",
      title: "Core System Prompt",
      content: "Sei un'intelligenza artificiale evoluta del Unix-AI Pro Studio. Rispondi con stile cyberpunk e tecnico.",
      type: "context",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: "2",
      title: "Ultimo File Analizzato",
      content: "Nessun file critico in buffer. Pronto per l'acquisizione Base64.",
      type: "file",
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);

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

  const handleUpdateNode = (id: string, newContent: string) => {
    setNeuralNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, content: newContent, timestamp: new Date().toLocaleTimeString() } : node))
    );
  };

  const handleDeleteNode = (id: string) => {
    setNeuralNodes((prev) => prev.filter((node) => node.id !== id));
  };

  const handleAddNode = (title: string, content: string) => {
    const newNode: NeuralMemoryNode = {
      id: Date.now().toString(),
      title,
      content,
      type: "memory",
      timestamp: new Date().toLocaleTimeString(),
    };
    setNeuralNodes((prev) => [...prev, newNode]);
  };

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const base64Data = reader.result as string;
        setSelectedFile({
          file,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          type: file.type,
          contentBase64: base64Data,
        });

        handleAddNode(`File: ${file.name}`, `Base64 caricato (${file.type}, ${(file.size / 1024).toFixed(1)} KB)`);
      };

      reader.readAsDataURL(file);
    }
  };

  const playAudioStream = (audioSrc: string) => {
    stopSpeaking();
    const audio = new Audio(audioSrc);
    currentAudioRef.current = audio;

    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      currentAudioRef.current = null;
    };
    audio.onerror = () => {
      setIsSpeaking(false);
      currentAudioRef.current = null;
    };

    audio.play().catch(() => {
      setIsSpeaking(false);
      currentAudioRef.current = null;
    });
  };

  const handleSendMessage = async (textToSend: string) => {
    if ((!textToSend.trim() && !selectedFile) || isLoading) return;

    stopSpeaking();

    const userMessage = textToSend || (selectedFile ? `Analizza il file allegato: ${selectedFile.name}` : "");
    const attached = selectedFile;

    setPrompt("");
    setSelectedFile(null);
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        file: attached ? { name: attached.name, size: attached.size } : undefined,
      },
    ]);
    setIsLoading(true);

    try {
      // Chiamata all'endpoint corretto /api/studio
      const res = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.email,
          prompt: userMessage,
          attachedFile: attached
            ? {
                name: attached.name,
                type: attached.type,
                data: attached.contentBase64,
              }
            : null,
          memoryContext: neuralNodes.map((n) => `${n.title}: ${n.content}`).join("\n"),
        }),
      });

      const data = await res.json();
      const replyContent = data.reply || data.response || data.text;

      if (replyContent) {
        setMessages((prev) => [...prev, { role: "unix", content: replyContent }]);
        if (data.audio) {
          playAudioStream(data.audio);
        }
      } else if (data.error) {
        setMessages((prev) => [...prev, { role: "unix", content: `Errore: ${data.error}` }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "unix", content: "Errore di connessione con il core neurale." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "it-IT";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsListening(false);
          if (transcript.trim()) {
            handleSendMessage(transcript);
          }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        setRecognitionInstance(recognition);
      }
    }
  }, [user]);

  const toggleListening = () => {
    if (!recognitionInstance) {
      alert("Il riconoscimento vocale richiede Google Chrome.");
      return;
    }
    if (isListening) {
      recognitionInstance.stop();
      setIsListening(false);
    } else {
      try {
        setIsListening(true);
        recognitionInstance.start();
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-400 font-mono flex flex-col p-4 md:p-6 relative overflow-hidden">
      {/* Se l'utente non è loggato, mostra il modale di autenticazione */}
      {!user && (
        <AuthModal
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setMessages([
              {
                role: "unix",
                content: `Benvenuto ${loggedInUser.email}. Connessione stabilita con il core. Ruolo: ${loggedInUser.role.toUpperCase()}`,
              },
            ]);
          }}
        />
      )}

      {/* Sfondo Cyberpunk */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Header HUD */}
      <header className="flex flex-col md:flex-row justify-between items-center border-b border-cyan-500/35 pb-4 z-10 backdrop-blur-md gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-wider text-cyan-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            UNIX-AI PRO STUDIO
          </h1>
          <p className="text-[10px] text-slate-500">
            CORE SYSTEM // {user ? `UTENTE: ${user.email} [${user.role.toUpperCase()}]` : "ATTESA AUTENTICAZIONE"}
          </p>
        </div>
        <div className="flex gap-3 text-xs items-center">
          <div className="border border-cyan-500/30 px-3 py-1 rounded bg-slate-900/50">
            CORE: <span className="text-emerald-400">ONLINE</span>
          </div>
          {user && (
            <button
              type="button"
              onClick={() => setUser(null)}
              className="border border-rose-500/40 px-3 py-1 rounded bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 transition text-[10px]"
            >
              ESCI
            </button>
          )}
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 my-4 flex-1 z-10">
        <div className="lg:col-span-1 border border-cyan-500/20 bg-slate-900/40 rounded-xl p-4 flex flex-col items-center justify-between backdrop-blur-md">
          <div className="w-full text-left text-xs text-slate-400 mb-2 font-bold tracking-wider flex justify-between items-center">
            <span>[NEURAL REACTOR 3D]</span>
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="text-[9px] bg-rose-500/20 border border-rose-500 text-rose-300 px-2 py-0.5 rounded hover:bg-rose-500/40 transition animate-pulse"
              >
                ZITTISCI
              </button>
            )}
          </div>

          <CyberCoreScene isWorking={isLoading || isListening || isSpeaking} />
          <NeuralReactor isSpeaking={isSpeaking} isListening={isListening} />
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          <NeuralInspectorPanel
            nodes={neuralNodes}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onAddNode={handleAddNode}
          />

          <div className="border border-cyan-500/20 bg-slate-900/40 rounded-xl p-4 flex flex-col backdrop-blur-md">
            <div className="text-xs text-slate-400 mb-2 font-bold tracking-wider flex justify-between items-center">
              <span>[CHAT & TERMINAL OUTPUT]</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 max-h-[350px]">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-sm backdrop-blur-sm ${
                    m.role === "user"
                      ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300 ml-auto max-w-[85%]"
                      : "border-cyan-500/30 bg-cyan-950/20 text-cyan-200 mr-auto max-w-[85%]"
                  }`}
                >
                  <div className="text-[10px] opacity-60 mb-1">
                    {m.role === "user" ? "> USER_INPUT" : "> Unix_RESPONSE"}
                  </div>
                  {m.file && (
                    <div className="mb-2 p-2 bg-slate-950/60 border border-cyan-500/30 rounded flex items-center gap-2 text-xs text-cyan-300">
                      <span>📎</span>
                      <span className="font-semibold truncate">{m.file.name}</span>
                      <span className="text-slate-500">({m.file.size})</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="text-xs text-cyan-400 animate-pulse p-2">
                  [Unix IS PROCESSING & REASONING...]
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between bg-cyan-950/80 border border-cyan-500/50 px-3 py-1.5 rounded-lg text-xs text-cyan-300 mb-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-cyan-400">📎 [FILE READY]</span>
                  <span className="truncate max-w-[250px] font-medium">{selectedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-rose-400 hover:text-rose-300 font-bold ml-2 transition"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="audio/*,image/*,.py,.ts,.js,.rs,.json,.txt,.md"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-lg border bg-slate-900 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/40 transition font-bold text-lg leading-none"
              >
                +
              </button>

              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-lg border transition ${
                  isListening
                    ? "bg-rose-600/30 border-rose-500 text-rose-300 animate-pulse"
                    : "bg-slate-900 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/40"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isListening ? "Parla ora..." : "Digita il tuo comando..."}
                className="flex-1 bg-slate-950/80 border border-cyan-500/40 rounded-lg px-4 py-2.5 text-sm text-cyan-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="bg-cyan-600/30 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 px-5 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                INVIA
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}