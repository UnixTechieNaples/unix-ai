import { createClient } from '@supabase/supabase-js';

// Funzione helper per ottenere il client Supabase solo a runtime
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

export interface NeuralNodeDB {
  id: string;
  title: string;
  content: string;
  type: string;
  timestamp: string;
}

// Funzione per recuperare i neuroni persistenti salvati per l'utente
export async function getNeuroniUtente(userId: string): Promise<NeuralNodeDB[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('neural_nodes')
      .select('id, title, content, type, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      type: item.type || 'memory',
      timestamp: item.timestamp ? new Date(item.timestamp).toLocaleTimeString('it-IT') : new Date().toLocaleTimeString('it-IT')
    }));
  } catch (err) {
    console.error("Errore recupero neuroni utente:", err);
    return [];
  }
}

// Funzione per salvare o aggiornare un neurone nel database
export async function salvaNeuroneUtente(userId: string, node: NeuralNodeDB) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('neural_nodes').upsert([
      {
        id: node.id,
        user_id: userId,
        title: node.title,
        content: node.content,
        type: node.type,
        timestamp: new Date().toISOString()
      }
    ], { onConflict: 'id' });
  } catch (err) {
    console.error("Errore salvataggio neurone su Supabase:", err);
  }
}

// Funzione richiesta dall'orchestratore per leggere i dati e le memorie degli utenti
export async function getUtenti() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('user_memories')
      .select('user_id, user_name, content');
    
    if (error || !data) return [];
    
    const map = new Map();
    data.forEach((item: any) => {
      const uid = item.user_id || 'sconosciuto';
      if (!map.has(uid)) {
        map.set(uid, { userId: uid, name: item.user_name || 'Utente', learnedFacts: [] });
      }
      if (item.content) {
        map.set(uid, {
          ...map.get(uid),
          learnedFacts: [...map.get(uid).learnedFacts, item.content]
        });
      }
    });

    return Array.from(map.values());
  } catch (err) {
    console.error("Errore recupero utenti:", err);
    return [];
  }
}

// Verifica se l'utente è Super Admin
export async function checkIsSuperAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    return data.role === 'super_admin';
  } catch (err) {
    return false;
  }
}

// Salvataggio interazione e tracciamento sessione
export async function salvaUtente(userId: string, content: string, userName: string, ip?: string, userAgent?: string) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('user_memories').insert([
      { user_id: userId, content, user_name: userName }
    ]);

    if (ip || userAgent) {
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();
      await supabase.from('user_sessions').insert([
        { user_id: userId, email: profile?.email || 'sconosciuto', ip_address: ip, user_agent: userAgent, action_type: 'chat_interaction' }
      ]);
    }
  } catch (err) {
    console.error("Errore nel salvataggio su Supabase:", err);
  }
}

// Report sessioni per il Super Admin
export async function getActiveUsersReport(): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('email, ip_address, user_agent, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !sessions || sessions.length === 0) {
      return "Nessuna sessione attiva registrata al momento nel database.";
    }

    let report = "Report Attività e Utenti Loggati:\n\n";
    sessions.forEach((s, idx) => {
      report += `${idx + 1}. Email: ${s.email}\n   - IP: ${s.ip_address || 'Non rilevato'}\n   - Dispositivo: ${s.user_agent || 'Sconosciuto'}\n   - Ultima attività: ${new Date(s.created_at).toLocaleString()}\n\n`;
    });

    return report;
  } catch (err) {
    return "Errore durante il recupero del report delle sessioni.";
  }
}