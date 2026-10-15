import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Salva un vettore di memoria o un frammento di codice nella base dati
 */
export async function storeMemoryEmbeddings(content: string, metadata: object = {}) {
  try {
    // Nota: L'embedding vettoriale può essere generato tramite modello o API dedicate
    const { data, error } = await supabase
      .from("ai_memory_store")
      .insert([{ content, metadata, created_at: new Date().toISOString() }]);

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Errore nel salvataggio della memoria vettoriale:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Recupera memorie simili basate su query semantiche
 */
export async function searchVectorMemory(queryText: string) {
  try {
    // Esempio di chiamata RPC a funzione Postgres in Supabase per la ricerca di similarità
    const { data, error } = await supabase.rpc("match_ai_memories", {
      query_text: queryText,
      match_threshold: 0.78,
      match_count: 5,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Errore nella ricerca vettoriale:", error);
    return { success: false, error: error.message };
  }
}