import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, prompt } = body;
    
    let textToAnalyze = "";
    if (typeof prompt === "string" && prompt.trim() !== "") {
      textToAnalyze = prompt;
    } else if (Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      textToAnalyze = typeof lastMsg === "string" ? lastMsg : (lastMsg.content || lastMsg.text || "");
    }

    if (!textToAnalyze) {
      textToAnalyze = "Ciao!";
    }

    const reply = await callGemini(textToAnalyze);

    return NextResponse.json({
      message: reply,
      response: reply,
      content: reply
    });

  } catch (error: any) {
    console.error("Errore Gemini API:", error);
    return NextResponse.json(
      { error: `Errore Gemini API: ${error?.message || "Errore sconosciuto"}` },
      { status: 500 }
    );
  }
}
