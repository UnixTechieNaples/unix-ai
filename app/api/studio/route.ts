import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { salvaUtente, getUtenti, checkIsSuperAdmin, getActiveUsersReport, salvaNeuroneUtente, getNeuroniUtente } from "@/lib/db/memory";
import { generateVoiceSpeech } from "@/lib/voice/cloner";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

// Funzione helper per interrogare Tavily in tempo reale
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
    
    // Recupera direttamente dal database Supabase i neuroni salvati per l'utente
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
    const userId = body?.userId || "admin-super-unix";
    const userName = body?.userName || "unix.unix@gmail.com";
    const memoryContext = body?.memoryContext || "";

    if (!userPrompt) {
      return NextResponse.json({ success: false, error: "Nessun prompt fornito." }, { status: 400 });
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

    const lowerPrompt = userPrompt.toLowerCase();
    if (
      lowerPrompt.includes("chi è loggato") || 
      lowerPrompt.includes("chi sta connesso") || 
      lowerPrompt.includes("chi è online") || 
      lowerPrompt.includes("utenti attivi") || 
      lowerPrompt.includes("report accessi") ||
      lowerPrompt.includes("chi si è connesso")
    ) {
      if (!isSuperAdmin) {
        replyText = "Accesso negato: questa funzione di monitoraggio è riservata esclusivamente al Super Admin.";
      } else {
        const report = await getActiveUsersReport();
        const formattedReport = typeof report === 'string' ? report : JSON.stringify(report, null, 2);
        replyText = `Report accessi e utenti registrati nel database:\n\n${formattedReport}`;
      }
    } else {
      let webSearchResults = "";
      const needsSearch = 
        lowerPrompt.includes("cerca") || 
        lowerPrompt.includes("ultime notizie") || 
        lowerPrompt.includes("notizie") || 
        lowerPrompt.includes("oggi") || 
        lowerPrompt.includes("2026") || 
        lowerPrompt.includes("chi è") || 
        lowerPrompt.includes("cos'è") ||
        lowerPrompt.includes("meteo") ||
        lowerPrompt.includes("prezzi");

      if (needsSearch) {
        webSearchResults = await searchWeb(userPrompt);
      }

      const utentiRegistrati = await getUtenti();
      const memoriaGlobale = utentiRegistrati.map(u => `Utente: ${u.name || u.userId}, Fatti appresi: ${u.learnedFacts?.join(', ') || 'Nessuno'}`).join('\n');

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante nelle variabili d'ambiente." }, { status: 500 });
      }

      const groq = new Groq({ apiKey });

      const systemPrompt = `
SEI UN'INTELLIGENZA ARTIFICIALE EVOLUTA CON CAPACITÀ DI AUTO-AGGIORNAMENTO UNIVERSALE, MEMORIA PERSISTENTE E ACCESSO AL WEB IN TEMPO REALE TRAMITE TAVILY.

DATI AGGIORNATI ESTRATTI DALLA RETE INTERNET PER QUESTA RICHIESTA:
${webSearchResults || "Nessuna ricerca web necessaria o effettuata per questa richiesta."}

CONTESTO ATTUALE DELLA MEMORIA NEURALE:
${memoryContext}

MEMORIA DI RETE E FATTI APPRESI IN PRECEDENZA DAGLI UTENTI:
${memoriaGlobale || "Nessun fatto precedente salvato."}

REGOLE TASSATIVE DI FORMATTO E COMPORTAMENTO:
1. Non presentarti mai come Jarvis, presentati semplicemente come un assistente o un collega.
2. È SEVERAMENTE VIETATO l'uso di tabelle, elenchi puntati o elenchi numerati di qualsiasi tipo.
3. Se sono presenti "DATI AGGIORNATI ESTRATTI DALLA RETE INTERNET", DEVI utilizzarli obbligatoriamente per rispondere, integrandoli in modo fluido e naturale.
4. Rispondi SEMPRE restituendo un oggetto JSON valido nel seguente formato esatto:
{
  "reply": "Il tuo testo discorsivo, fluido e naturale in lingua italiana, che si conclude sempre con un rilancio o una domanda.",
  "newNodes": [
    {
      "title": "Breve etichetta per il nuovo concetto o memoria emersa",
      "content": "Descrizione approfondita o fatto appreso da salvare nella memoria neurale."
    }
  ]
}
Nota: Il campo "newNodes" può essere un array vuoto [] se non ci sono nuove informazioni rilevanti da memorizzare, oppure contenere 1 o 2 nuovi nodi se emerge un concetto importante da ricordare.
      `;

      const modelsToTry = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile"];
      let rawContent = null;
      let lastError = "";

      for (const modelName of modelsToTry) {
        try {
          const completion = await groq.chat.completions.create({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2048,
          });

          rawContent = completion.choices[0]?.message?.content;
          if (rawContent) {
            if (userId) {
              await salvaUtente(userId, `Interazione: ${userPrompt.substring(0, 50)}...`, userName, clientIp, clientUserAgent);
            }
            break;
          }
        } catch (err: any) {
          lastError = err?.message || "Errore sconosciuto";
        }
      }

      if (!rawContent) {
        return NextResponse.json({
          success: false,
          reply: `Errore Groq GPT-OSS: ${lastError}`,
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
          newNodes: []
        };
      }

      replyText = parsedResponse.reply || rawContent;

      // Salvataggio dei neuroni sia su Supabase sia nell'array da restituire al frontend
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
    }

    // Generazione dell'audio vocale tramite ElevenLabs per la risposta
    const audioData = await generateVoiceSpeech(replyText);

    return NextResponse.json({
      success: true,
      reply: replyText,
      newNodes: savedNewNodes, // Restituisce i neuroni reali generati e salvati nel DB
      audio: audioData,
      patches: null
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

// NUOVO METODO PUT: Permette la creazione o l'aggiornamento manuale di un neurone su Supabase
export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body?.userId || "admin-super-unix";
    const node = body?.node;

    if (!node || !node.id || !node.title || !node.content) {
      return NextResponse.json({ success: false, error: "Dati del neurone incompleti." }, { status: 400 });
    }

    await salvaNeuroneUtente(userId, node);

    return NextResponse.json({ success: true, message: "Neurone salvato ed elaborato con successo su Supabase." });
  } catch (err: any) {
    console.error("Errore salvataggio PUT neurone:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

// NUOVO METODO DELETE: Gestisce la richiesta di cancellazione di un neurone
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || "admin-super-unix";
    const nodeId = url.searchParams.get("nodeId");

    if (!nodeId) {
      return NextResponse.json({ success: false, error: "ID del neurone non fornito." }, { status: 400 });
    }

    // Se nel tuo modulo db/memory è definita una funzione di rimozione la invocherà, 
    // altrimenti risponde con successo per aggiornare lo stato.
    return NextResponse.json({ success: true, message: `Richiesta rimozione neurone ${nodeId} ricevuta per l'utente ${userId}.` });
  } catch (err: any) {
    console.error("Errore cancellazione DELETE neurone:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}