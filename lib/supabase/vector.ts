import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Salva un frammento di memoria o un blocco di codice nella base dati vettoriale
 */
export async function storeMemoryEmbeddings(content: string, metadata: object = {}) {
  try {
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
 * Recupera memorie simili basate sulla ricerca semantica tramite la funzione RPC di Supabase
 */
export async function searchVectorMemory(queryText: string) {
  try {
    const { data, error } = await supabase.rpc("match_ai_memories", {
      query_text: queryText,
      match_threshold: 0.70,
      match_count: 5,
    });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Errore nella ricerca vettoriale:", error);
    return { success: false, error: error.message, data: [] };
  }
}