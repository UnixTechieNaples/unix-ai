import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, prompt, messages } = body;

    let textToAnalyze = "";
    if (typeof prompt === "string" && prompt.trim() !== "") {
      textToAnalyze = prompt;
    } else if (typeof message === "string" && message.trim() !== "") {
      textToAnalyze = message;
    } else if (Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      textToAnalyze = typeof lastMsg === "string" ? lastMsg : (lastMsg?.content || lastMsg?.text || "");
    }

    if (!textToAnalyze) {
      textToAnalyze = "Analizza e rispondi.";
    }

    const rawContent = await callGemini(textToAnalyze);

    return NextResponse.json({
      message: rawContent,
      response: rawContent,
      content: rawContent
    });

  } catch (error: any) {
    console.error("Errore studio route:", error);
    return NextResponse.json(
      { error: `Errore Gemini API: ${error?.message || "Errore sconosciuto"}` },
      { status: 500 }
    );
  }
}
