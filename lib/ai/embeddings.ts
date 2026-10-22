import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Genera l'embedding vettoriale per un dato testo.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n/g, ' ');
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: cleanText,
    }),
  });

  if (!response.ok) {
    throw new Error(`Errore durante la generazione dell'embedding: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

/**
 * Salva un ricordo o un frammento informativo nella memoria a lungo termine.
 */
export async function storeMemory(
  content: string, 
  category: 'thought' | 'code_snippet' | 'user_preference' | 'architecture_decision',
  metadata: Record<string, any> = {}
) {
  const embedding = await generateEmbedding(content);

  const { data, error } = await supabaseAdmin
    .from('ai_memories')
    .insert([
      {
        content,
        category,
        metadata,
        embedding,
      },
    ])
    .select();

  if (error) {
    console.error('Errore durante il salvataggio della memoria:', error);
    throw error;
  }

  return data[0];
}

/**
 * Cerca le memorie più rilevanti dal punto di vista semantico rispetto a una query.
 */
export async function searchMemories(
  query: string,
  limit = 5,
  threshold = 0.6,
  categoryFilter?: string
) {
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabaseAdmin.rpc('match_memories', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
    filter_category: categoryFilter || null,
  });

  if (error) {
    console.error('Errore durante la ricerca nella memoria semantica:', error);
    throw error;
  }

  return data;
}

/**
 * FUNZIONE PONTE per il Chat Engine
 * Recupera le memorie e le formatta in un unico blocco di testo per il prompt.
 */
export async function getSemanticMemory(userId: string, query: string): Promise<string> {
  try {
    // Esegue la ricerca semantica
    const memories = await searchMemories(query, 5, 0.5);
    
    if (!memories || memories.length === 0) {
      return "Nessuna memoria rilevante trovata.";
    }

    // Concatena i contenuti delle memorie trovate in un unico testo
    return memories
      .map((m: any) => `[Memoria]: ${m.content}`)
      .join('\n');
  } catch (error) {
    console.error('Errore in getSemanticMemory:', error);
    return "Errore nel recupero della memoria semantica.";
  }
}
