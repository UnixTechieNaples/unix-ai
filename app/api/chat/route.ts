import { NextResponse } from 'next/server';
import { buildDynamicSystemPrompt } from '@/lib/ai/systemPrompt';
import { executeToolCall, AI_TOOLS } from '@/lib/ai/tools';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Costruzione del Prompt Dinamico con recupero RAG
    const systemPrompt = await buildDynamicSystemPrompt(lastUserMessage);

    // Preparazione della chiamata al modello (es. via OpenAI API / Vercel AI SDK / Local LLM)
    // Qui definiamo la struttura reattiva con supporto alle chiamate Tool
    return NextResponse.json({
      success: true,
      systemPromptUsed: systemPrompt,
      availableTools: AI_TOOLS.map(t => t.name),
      message: "Chat endpoint configurato con supporto Agentic Tool Use e RAG integrato."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}