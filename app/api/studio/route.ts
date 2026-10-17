import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { salvaUtente, getUtenti, checkIsSuperAdmin, getActiveUsersReport } from "@/lib/db/memory";

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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Estrazione di IP e User-Agent dagli headers della richiesta HTTP
    const headers = req.headers;
    const forwardedFor = headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : headers.get("x-real-ip") || "Sconosciuto";
    const clientUserAgent = headers.get("user-agent") || "Sconosciuto";
    
    const userPrompt = body?.prompt || body?.userPrompt || body?.message || body?.messages?.[body.messages?.length - 1]?.content;
    const userId = body?.userId;
    const userName = body?.userName;
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
        return NextResponse.json({
          success: true,
          reply: "Accesso negato: questa funzione di monitoraggio è riservata esclusivamente al Super Admin.",
          patches: null
        });
      } else {
        const report = await getActiveUsersReport();
        const formattedReport = typeof report === 'string' ? report : JSON.stringify(report, null, 2);
        return NextResponse.json({
          success: true,
          reply: `Report accessi e utenti registrati nel database:\n\n${formattedReport}`,
          patches: null
        });
      }
    }

    // Rilevamento automatico se la richiesta necessita di una ricerca web live
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

REGOLE TASSATIVE:
1. Non presentarti mai come Jarvis, presentati semplicemente come un assistente o un collega.
2. È SEVERAMENTE VIETATO l'uso di tabelle, elenchi puntati o elenchi numerati di qualsiasi tipo.
3. Se sono presenti "DATI AGGIORNATI ESTRATTI DALLA RETE INTERNET", DEVI utilizzarli obbligatoriamente per rispondere, integrandoli in modo fluido e naturale senza mai affermare di non poter accedere a internet.
4. Rispondi SEMPRE e SOLO con paragrafi di testo discorsivo, fluido e naturale in lingua italiana, completando sempre le frasi senza tagliarle.
    `;

    const modelsToTry = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile"];
    let replyText = null;
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

        replyText = completion.choices[0]?.message?.content;
        if (replyText) {
          if (userId) {
            await salvaUtente(userId, `Interazione: ${userPrompt.substring(0, 50)}...`, userName || "Utente", clientIp, clientUserAgent);
          }
          break;
        }
      } catch (err: any) {
        lastError = err?.message || "Errore sconosciuto";
      }
    }

    if (!replyText) {
      return NextResponse.json({
        success: false,
        reply: `Errore Groq GPT-OSS: ${lastError}`,
        error: lastError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
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