import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { commitFileToGitHub } from "@/lib/ai/githubCommitter";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    // Controllo di sicurezza opzionale per cron job
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY mancante." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // L'IA riflette autonomamente su cosa analizzare o migliorare con il modello aggiornato
    const aiResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    const textContent = aiResponse.text || '';
    const completion = { choices: [{ message: { content: textContent } }] };

    const thought = completion.choices[0]?.message?.content || "Analisi completata senza variazioni necessarie.";

    return NextResponse.json({
      success: true,
      autonomousThought: thought,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}