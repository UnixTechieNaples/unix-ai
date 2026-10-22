import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { messages, prompt } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY non configurata." }, { status: 500 });
    }

    // Estrae l'ultimo messaggio inviato dall'utente
    let textToAnalyze = "";
    if (typeof prompt === "string" && prompt.trim() !== "") {
      textToAnalyze = prompt;
    } else if (Array.isArray(messages) && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      textToAnalyze = typeof lastMessage === "string" ? lastMessage : (lastMessage.content || lastMessage.text || "");
    }

    if (!textToAnalyze) {
      textToAnalyze = "Ciao!";
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: textToAnalyze,
    });

    const reply = response.text || "Nessuna risposta ricevuta da Gemini.";

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
