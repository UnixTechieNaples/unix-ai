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
  const memoryContext = await getSemanticMemory(userId, lastMessage);

  // 2. Ricerca Web (se necessario)
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

  // 4. Gestione Modello e Chiamata a Groq
  // Definiamo un modello di fallback stabile nel caso quello richiesto dal client sia non disponibile (404)
  const DEFAULT_MODEL = 'llama3-8b-8192';
  const selectedModel = model || DEFAULT_MODEL;

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

    return completion.choices[0]?.message?.content || 'Spiacente, non sono riuscito a generare una risposta.';
  } catch (error: any) {
    // Se il modello selezionato dà errore 404, riproviamo automaticamente con il modello di fallback
    if (error.status === 404 || error.message?.includes('model_not_found')) {
      console.warn(`Model ${selectedModel} not found, falling back to ${DEFAULT_MODEL}`);
      
      const fallbackCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        model: DEFAULT_MODEL,
        temperature: 0.7,
        max_tokens: 4096,
      });
      
      return fallbackCompletion.choices[0]?.message?.content || 'Errore durante il tentativo di fallback.';
    }
    
    console.error('Groq API Error:', error);
    return `Errore API Groq: ${error.message || 'Errore sconosciuto'}`;
  }
}
