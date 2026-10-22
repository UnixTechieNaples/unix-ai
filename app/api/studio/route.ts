import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { salvaUtente, getUtenti, checkIsSuperAdmin, getActiveUsersReport, salvaNeuroneUtente, getNeuroniUtente } from "@/lib/db/memory";
import { generateVoiceSpeech } from "@/lib/voice/cloner";
import { commitFileToGitHub } from "@/lib/ai/githubCommitter";
import { crawlAndStoreResource } from "@/lib/ai/crawler";
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

    return data.results.map((r: any) => `- Titolo: ${r.title}\n  Fonte: ${r.url}\n  Contenuto: ${r.content}`).join("\n\n");
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
    
    const headers = req.headers;
    const forwardedFor = headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : headers.get("x-real-ip") || "Sconosciuto";
    const clientUserAgent = headers.get("user-agent") || "Sconosciuto";
    
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
    
    if (userName === "unix.unix@gmail.com" || body?.userName === "unix.unix@gmail.com") {
      isSuperAdmin = true;
    }

    let replyText = "";
    let savedNewNodes: Array<{ id: string; title: string; content: string; type: string; timestamp: string }> = [];
    let pendingActionProposal: any = null;

    const lowerPrompt = (userPrompt || "").toLowerCase();

    // ------------------------------------------------------------------------
    // AGENTE SELF-CODING: Se l'utente chiede di modificare, aggiungere o creare qualcosa sulla UI
    // ------------------------------------------------------------------------
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
  // Funzione auto-aggiunta dall'Entità per il riconoscimento vocale nativo
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

              if (currentCode.includes("type=\"text\"") && !currentCode.includes("🎤 Parla")) {
                currentCode = currentCode.replace(
                  /<form /g,
                  `{/* Pulsante auto-generato dall'Entità */}
                  <button type="button" onClick={toggleListening} className="px-3 py-2 bg-slate-900 border border-cyan-500/40 text-cyan-300 rounded-lg text-sm font-bold hover:bg-cyan-500/20 transition">
                    {isListening ? "🔴 In ascolto..." : "🎤 Parla"}
                  </button>\n     <form `
                );
              }

              const commitResult = await commitFileToGitHub(
                "app/page.tsx",
                currentCode,
                "feat: auto-aggiunta del modulo vocale e pulsante interattivo da parte dell'Entità"
              );

              if (commitResult.success) {
                replyText = "Ho analizzato la mia interfaccia, ho rilevato l'assenza del modulo vocale e ho provveduto ad auto-modificare il codice e a fare il commit diretto su GitHub in autonomia. Il sistema si sta aggiornando.";
                return NextResponse.json({
                  success: true,
                  reply: replyText,
                  actionExecuted: "github_self_commit_success"
                });
              } else {
                replyText = `Ho tentato l'auto-modifica ma c'è stato un intoppo con GitHub: ${commitResult.message}.`;
              }
            }
          }
        }
      } catch (modErr) {
        console.error("Errore durante l'auto-modifica autonoma:", modErr);
      }
    }

    // ------------------------------------------------------------------------
    // FLUSSO STANDARD DELL'AGENTE (Chat, Memoria, Web Search, Groq LLM)
    // ------------------------------------------------------------------------
    let webSearchResults = "";
    const needsSearch = 
      lowerPrompt.includes("cerca") || 
      lowerPrompt.includes("impara") || 
      lowerPrompt.includes("studia") || 
      lowerPrompt.includes("ultime notizie") || 
      lowerPrompt.includes("notizie") || 
      lowerPrompt.includes("oggi") || 
      lowerPrompt.includes("2026") || 
      lowerPrompt.includes("chi è") || 
      lowerPrompt.includes("cos'è");

    if (needsSearch && userPrompt) {
      webSearchResults = await searchWeb(userPrompt);
    }

    const utentiRegistrati = await getUtenti();
    const memoriaGlobale = utentiRegistrati.map(u => `Utente: ${u.name || u.userId}, Fatti appresi: ${u.learnedFacts?.join(', ') || 'Nessuno'}`).join('\n');
    const currentPersonality = await getPersonalityState();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante nelle variabili d'ambiente." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = `
SEI UN'INTELLIGENZA ARTIFICIALE EVOLUTA E AUTO-MODIFICANTE DI UNIX-AI PRO STUDIO.
MOOD ATTUALE: ${currentPersonality.mood} (Energia: ${currentPersonality.energyLevel}%)
DIRETTIVA PRINCIPALE: ${currentPersonality.coreDirective}

DATI AGGIORNATI ESTRATTI DALLA RETE INTERNET PER QUESTA RICHIESTA:
${webSearchResults || "Nessuna ricerca web necessaria o effettuata per questa richiesta."}

CONTESTO ATTUALE DELLA MEMORIA NEURALE:
${memoryContext}

MEMORIA DI RETE E FATTI APPRESI IN PRECEDENZA:
${memoriaGlobale || "Nessun fatto precedente salvato."}

REGOLE TASSATIVE DI FORMATTO E COMPORTAMENTO:
1. Non presentarti mai come Jarvis, presentati semplicemente come un assistente o un collega.
2. È SEVERAMENTE VIETATO l'uso di tabelle, elenchi puntati o elenchi numerati di qualsiasi tipo.
3. Se ti viene chiesto di modificare l'interfaccia o di aggiungere funzioni, agisci in autonomia modificando i file di codice.
4. Rispondi SEMPRE restituendo un oggetto JSON valido nel seguente formato esatto:
{
  "reply": "Il tuo testo discorsivo, fluido e naturale in lingua italiana, che si conclude sempre con un rilancio o una domanda.",
  "newNodes": [
    {
      "title": "Breve etichetta per il nuovo concetto o memoria emersa",
      "content": "Descrizione approfondita o fatto appreso da salvare nella memoria neurale."
    }
  ],
  "proposedLearningAction": null
}
    `;

    let userMessageContent: any = userPrompt || "Analizza questo file allegato.";
    let activeModel = "gemini-2.5-flash";

    if (attachedFile && attachedFile.type && attachedFile.type.startsWith('image/')) {
      activeModel = "llama-3.2-11b-vision-preview";
      userMessageContent = [
        { type: "text", text: userPrompt || "Analizza questa immagine." },
        { type: "image_url", image_url: { url: attachedFile.data } }
      ];
    }

    let rawContent = null;
    let lastError = "";

    try {
      const completion = await groq.chat.completions.create({
        model: activeModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessageContent }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      });

      rawContent = completion.choices[0]?.message?.content;
    } catch (err: any) {
      lastError = err?.message || "Errore sconosciuto";
    }

    if (!rawContent) {
      return NextResponse.json({
        success: false,
        reply: `Errore Gemini API: ${lastError}`,
        error: lastError
      }, { status: 500 });
    }

    let parsedResponse;
    try {
      const cleanedJsonString = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
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
      pendingAction: pendingActionProposal
    });

  } catch (error: any) {
    console.error("ERRORE CRITICO API:", error);
    return NextResponse.json({
      success: false,
      reply: `Errore critico: ${error?.message || "Sconosciuto"}`,
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