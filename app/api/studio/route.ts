import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ status: "API Groq GPT-OSS attiva" }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userPrompt = body?.prompt || body?.messages?.[body.messages?.length - 1]?.content;

    if (!userPrompt) {
      return NextResponse.json({ success: false, error: "Nessun prompt fornito." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante nelle variabili d'ambiente." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Modelli GPT-OSS ospitati su Groq come da tua dashboard
    const modelsToTry = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile"];
    let replyText = null;
    let lastError = "";

    for (const modelName of modelsToTry) {
      try {
        const completion = await groq.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: "Sei un assistente utile, rispondi sempre in italiano in modo chiaro e discorsivo." },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2048,
        });

        replyText = completion.choices[0]?.message?.content;
        if (replyText) break;
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
    });

  } catch (error: any) {
    console.error("ERRORE API GROQ:", error);
    return NextResponse.json({
      success: false,
      reply: `Errore critico: ${error?.message || "Sconosciuto"}`,
      error: error?.message
    }, { status: 500 });
  }
}