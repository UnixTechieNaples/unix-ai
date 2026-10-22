import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { executeAIChat } from '@/lib/ai/chat-engine';

export async function POST(request: Request) {
  try {
    // 1. Verifica Autenticazione Server-Side
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // 2. Recupero dati dalla richiesta
    const { messages, model = 'llama-3.1-8b-instant' } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messaggi mancanti o invalidi' }, { status: 400 });
    }

    // 3. Invocazione del Chat Engine (Orchestratore Groq + RAG + Tools)
    const aiResponse = await executeAIChat({
      userId: user.id,
      messages: messages,
      model: model,
    });

    return NextResponse.json({
      success: true,
      content: aiResponse,
    });

  } catch (error: any) {
    console.error('Errore in /api/chat:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno del server' },
      { status: 500 }
    );
  }
}
