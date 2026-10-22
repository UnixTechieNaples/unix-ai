import Groq from 'groq-sdk';
import { getSemanticMemory } from '@/lib/ai/embeddings';
import { webSearch } from '@/lib/ai/web-search';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface ChatRequest {
  userId: string;
  messages: any[];
  model: string;
}

export async function executeAIChat({ userId, messages, model }: ChatRequest) {
  const lastMessage = messages[messages.length - 1]?.content || '';

  // 1. Recupero Memoria Semantica (RAG)
  // Cerca nei documenti caricati ( inclusi gli ZIP estratti) informazioni pertinenti
  const memoryContext = await getSemanticMemory(userId, lastMessage);

  // 2. Ricerca Web (se necessario)
  // Se il messaggio contiene domande su eventi recenti, integriamo Tavily
  let webContext = '';
  if (lastMessage.toLowerCase().includes('cerca') || lastMessage.toLowerCase().includes('web')) {
    webContext = await webSearch(lastMessage);
  }

  // 3. Costruzione del Prompt Augmentato
  const systemPrompt = `
    Sei l'assistente AI di UNIX-AI PRO STUDIO. 
    Hai accesso alla memoria semantica dell'utente e alla ricerca web.
    
    CONTESTO MEMORIA:
    ${memoryContext}
    
    CONTESTO WEB:
    ${webContext}
    
    Rispondi in modo tecnico, preciso e professionale. Se le informazioni sono presenti nel contesto, usa quelle.
  `;

  // 4. Chiamata a Groq
  const completion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    model: model, // Qui passa 'llama-3.1-8b-instant'
    temperature: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content || 'Spiacente, non sono riuscito a generare una risposta.';
}
