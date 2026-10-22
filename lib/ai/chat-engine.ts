import Groq from 'groq-sdk';
import { getSemanticMemory } from '@/lib/ai/embeddings';
import { webSearch } from '@/lib/ai/web-search';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ChatRequest {
  userId: string;
  messages: any[];
  model?: string;
}

export async function executeAIChat({ userId, messages, model }: ChatRequest) {
  const lastMessage = messages[messages.length - 1]?.content || '';

  // 1. Recupero Memoria Semantica (RAG)
  const memoryContext = await getSemanticMemory(userId, lastMessage);

  // 2. Ricerca Web (se necessaria)
  let webContext = '';
  if (lastMessage.toLowerCase().includes('cerca') || lastMessage.toLowerCase().includes('web')) {
    webContext = await webSearch(lastMessage);
  }

  // 3. Costruzione del Prompt
  const systemPrompt = `
    Sei l'assistente AI di UNIX-AI PRO STUDIO. 
    Hai accesso alla memoria semantica dell'utente e alla ricerca web.
    
    CONTESTO MEMORIA:
    ${memoryContext}
    
    CONTESTO WEB:
    ${webContext}
    
    Rispondi in modo tecnico, preciso e professionale.
  `;

  // 4. Modello attivo e stabile supportato da Groq
  const STABLE_MODEL = 'openai/gpt-oss-20b';
  const selectedModel = model && model.includes('llama') ? STABLE_MODEL : (model || STABLE_MODEL);

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      model: selectedModel,
      temperature: 0.7,
      max_tokens: 4096,
    });

    return completion.choices[0]?.message?.content || 'Risposta non generata.';
  } catch (error: any) {
    console.error('Groq API Error Details:', error);
    throw new Error(`Errore API Groq: ${error.message || 'Impossibile completare la richiesta'}`);
  }
}