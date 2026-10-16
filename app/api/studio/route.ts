import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { salvaUtente, getUtenti, checkIsSuperAdmin, getActiveUsersReport } from "@/lib/db/memory";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userPrompt = body?.prompt || body?.messages?.[body.messages?.length - 1]?.content;
    const userId = body?.userId;
    const userName = body?.userName;

    if (!userPrompt) {
      return NextResponse.json({ success: false, error: "Nessun prompt fornito." }, { status: 400 });
    }

    let isSuperAdmin = false;
    if (userId) {
      isSuperAdmin = await checkIsSuperAdmin(userId);
    }

    const lowerPrompt = userPrompt.toLowerCase();
    if (lowerPrompt.includes("chi è loggato") || lowerPrompt.includes("utenti attivi") || lowerPrompt.includes("report accessi")) {
      if (!isSuperAdmin) {
        return NextResponse.json({
          success: true,
          reply: "Accesso negato: questa funzione di monitoraggio è riservata esclusivamente al Super Admin.",
          patches: null
        });
      } else {
        const report = await getActiveUsersReport();
        return NextResponse.json({
          success: true,
          reply: report,
          patches: null
        });
      }
    }

    const utentiRegistrati = await getUtenti();
    const memoriaGlobale = utentiRegistrati.map(u => `Utente: ${u.name || u.userId}, Fatti appresi: ${u.learnedFacts.join(', ')}`).join('\n');

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante nelle variabili d'ambiente." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = `
SEI UN'INTELLIGENZA ARTIFICIALE EVOLUTA CON CAPACITÀ DI AUTO-AGGIORNAMENTO UNIVERSALE E MEMORIA PERSISTENTE.

MEMORIA DI RETE E FATTI APPRESI IN PRECEDENZA:
${memoriaGlobale || "Nessun fatto precedente salvato."}

REGOLE TASSATIVE:
1. Non presentarti mai come Jarvis, presentati semplicemente come un assistente o un collega.
2. È SEVERAMENTE VIETATO l'uso di tabelle, elenchi puntati o elenchi numerati di qualsiasi tipo.
3. Rispondi SEMPRE e SOLO con paragrafi di testo discorsivo, fluido e naturale in lingua italiana, completando sempre le frasi senza tagliarle.
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
            await salvaUtente(userId, `Interazione: ${userPrompt.substring(0, 50)}...`, userName || "Utente");
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