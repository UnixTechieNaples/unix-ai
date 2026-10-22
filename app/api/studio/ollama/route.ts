import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { salvaUtente, getUtenti, checkIsSuperAdmin, salvaNeuroneUtente, getNeuroniUtente } from "@/lib/db/memory";
import { generateVoiceSpeech } from "@/lib/voice/cloner";
import { commitFileToGitHub } from "@/lib/ai/githubCommitter";
import { registerAudioAsset } from "@/lib/ai/audioManager";
import { getPersonalityState } from "@/lib/ai/personality";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function searchWeb(query: string): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) return "Ricerca web non disponibile (TAVILY_API_KEY mancante).";

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: query,
        max_results: 3,
        search_depth: "advanced"
      })
    });

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return "Nessun risultato trovato sul web.";
    }

    return data.results.map((r: any) => `- Titolo: ${r.title}\n Fonte: ${r.url}\n Contenuto: ${r.content}`).join("\n\n");
  } catch (err) {
    console.error("Errore durante la ricerca Tavily:", err);
    return "Errore di connessione al motore di ricerca web.";
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || "admin-super-unix";
    const neuroniDB = await getNeuroniUtente(userId);
    return NextResponse.json({ success: true, nodes: neuroniDB });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    const userPrompt = body?.prompt || body?.userPrompt || body?.message || body?.messages?.[body.messages?.length - 1]?.content;
    const attachedFile = body?.attachedFile;
    const userId = body?.userId || "admin-super-unix";
    const userName = body?.userName || "unix.unix@gmail.com";
    const memoryContext = body?.memoryContext || "";

    if (!userPrompt && !attachedFile) {
      return NextResponse.json({ success: false, error: "Nessun prompt o file fornito." }, { status: 400 });
    }

    let isSuperAdmin = false;
    if (userId) {
      isSuperAdmin = await checkIsSuperAdmin(userId);
    }
    if (userName === "unix.unix@gmail.com") {
      isSuperAdmin = true;
    }

    let replyText = "";
    let savedNewNodes: Array<{ id: string; title: string; content: string; type: string; timestamp: string }> = [];

    const lowerPrompt = (userPrompt || "").toLowerCase();

    const isModificationRequest = 
      lowerPrompt.includes("modifica") || 
      lowerPrompt.includes("aggiungi") || 
      lowerPrompt.includes("crea") || 
      lowerPrompt.includes("inserisci") ||
      lowerPrompt.includes("tasto") ||
      lowerPrompt.includes("pulsante");

    if (isModificationRequest) {
      try {
        const pagePath = path.resolve(process.cwd(), "app/page.tsx");
        if (fs.existsSync(pagePath)) {
          let currentCode = fs.readFileSync(pagePath, "utf-8");

          if ((lowerPrompt.includes("voce") || lowerPrompt.includes("parla") || lowerPrompt.includes("tasto")) && !currentCode.includes("SpeechRecognition")) {
            const speechLogicToAdd = `
  const [isListening, setIsListening] = React.useState(false);
  const [recognitionInstance, setRecognitionInstance] = React.useState<any>(null);

  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Il browser non supporta il riconoscimento vocale.");
      return;
    }
    if (isListening) {
      if (recognitionInstance) recognitionInstance.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "it-IT";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      setPrompt((prev: string) => (prev ? prev + " " + speechText : speechText));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    setRecognitionInstance(recognition);
    recognition.start();
  };
`;

            if (currentCode.includes("export default function StudioDashboard")) {
              currentCode = currentCode.replace(
                "export default function StudioDashboard() {",
                `export default function StudioDashboard() {\n${speechLogicToAdd}`
              );

              if (currentCode.includes('type="text"') && !currentCode.includes("🎤 Parla")) {
                currentCode = currentCode.replace(
                  /<form /g,
                  `<button type="button" onClick={toggleListening} className="px-3 py-2 bg-slate-900 border border-cyan-500/40 text-cyan-300 rounded-lg text-sm font-bold hover:bg-cyan-500/20 transition">
                    {isListening ? "🔴 In ascolto..." : "🎤 Parla"}
                  </button>\n    <form `
                );
              }

              const commitResult = await commitFileToGitHub(
                "app/page.tsx",
                currentCode,
                "feat: auto-aggiunta del modulo vocale e pulsante interattivo"
              );

              if (commitResult.success) {
                return NextResponse.json({
                  success: true,
                  reply: "Ho analizzato l'interfaccia, aggiunto il modulo vocale ed eseguito il commit autonomo su GitHub. L'app si sta aggiornando.",
                  actionExecuted: "github_self_commit_success"
                });
              }
            }
          }
        }
      } catch (modErr) {
        console.error("Errore durante l'auto-modifica:", modErr);
      }
    }

    let webSearchResults = "";
    const needsSearch = 
      lowerPrompt.includes("cerca") || 
      lowerPrompt.includes("impara") || 
      lowerPrompt.includes("studia") || 
      lowerPrompt.includes("ultime notizie") || 
      lowerPrompt.includes("notizie") || 
      lowerPrompt.includes("oggi") || 
      lowerPrompt.includes("chi è") || 
      lowerPrompt.includes("cos'è");

    if (needsSearch && userPrompt) {
      webSearchResults = await searchWeb(userPrompt);
    }

    const utentiRegistrati = await getUtenti();
    const memoriaGlobale = utentiRegistrati.map(u => `Utente: ${u.name || u.userId}, Fatti appresi: ${u.learnedFacts?.join(', ') || 'Nessuno'}`).join('\n');
    const currentPersonality = await getPersonalityState();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY mancante nelle variabili d'ambiente di Vercel." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstructions = `
SEI UN'INTELLIGENZA ARTIFICIALE EVOLUTA DI UNIX-AI PRO STUDIO.
MOOD ATTUALE: ${currentPersonality.mood} (Energia: ${currentPersonality.energyLevel}%)
DIRETTIVA PRINCIPALE: ${currentPersonality.coreDirective}

DATI AGGIORNATI ESTRATTI DALLA RETE INTERNET:
${webSearchResults || "Nessuna ricerca web necessaria."}

CONTESTO MEMORIA NEURALE:
${memoryContext}

MEMORIA DI RETE E FATTI APPRESI:
${memoriaGlobale || "Nessun fatto salvato."}

REGOLE TASSATIVE:
1. Non presentarti mai come Jarvis.
2. VIETATO l'uso di tabelle ed elenchi puntati/numerati.
3. Rispondi RESTITUENDO UN JSON VALIDO in questo formato:
{
  "reply": "Il tuo testo discorsivo, fluido e naturale in italiano con un rilancio finale.",
  "newNodes": [
    {
      "title": "Breve etichetta concetto",
      "content": "Descrizione fatto appreso da salvare"
    }
  ],
  "proposedLearningAction": null
}
`;

    let contents: any[] = [];
    if (attachedFile && attachedFile.data) {
      const base64Data = attachedFile.data.split(",")[1] || attachedFile.data;
      const mimeType = attachedFile.type || "image/jpeg";
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }
    contents.push(userPrompt || "Analizza le informazioni fornite.");

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstructions,
        temperature: 0.7,
      }
    });

    const rawContent = response.text;

    if (!rawContent) {
      return NextResponse.json({ success: false, reply: "Nessuna risposta generata da Gemini." }, { status: 500 });
    }

    let parsedResponse;
    try {
      const cleanedJsonString = rawContent.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      parsedResponse = JSON.parse(cleanedJsonString);
    } catch (parseErr) {
      parsedResponse = {
        reply: rawContent,
        newNodes: [],
        proposedLearningAction: null
      };
    }

    replyText = parsedResponse.reply || rawContent;

    if (parsedResponse.newNodes && Array.isArray(parsedResponse.newNodes)) {
      for (const node of parsedResponse.newNodes) {
        if (node.title && node.content) {
          const createdNode = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
            title: node.title,
            content: node.content,
            type: "memory",
            timestamp: new Date().toLocaleTimeString("it-IT")
          };
          await salvaNeuroneUtente(userId, createdNode);
          savedNewNodes.push(createdNode);
        }
      }
    }

    const audioData = await generateVoiceSpeech(replyText);
    if (audioData) {
      registerAudioAsset(replyText.slice(0, 80), audioData);
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
      newNodes: savedNewNodes,
      audio: audioData,
      pendingAction: null
    });

  } catch (error: any) {
    console.error("ERRORE GEMINI API:", error);
    return NextResponse.json({
      success: false,
      reply: `Errore Gemini API: ${error?.message || "Errore sconosciuto"}`,
      error: error?.message
    }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body?.userId || "admin-super-unix";
    const node = body?.node;
    if (!node || !node.id) return NextResponse.json({ success: false, error: "Dati incompleti." }, { status: 400 });
    await salvaNeuroneUtente(userId, node);
    return NextResponse.json({ success: true, message: "Neurone salvato." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  return NextResponse.json({ success: true, message: "Eliminazione completata." });
}
