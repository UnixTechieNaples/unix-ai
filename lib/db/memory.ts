import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Funzione per verificare se un utente è Super Admin
export async function checkIsSuperAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return data.role === 'super_admin';
}

// Funzione per salvare l'interazione e tracciare l'attività
export async function salvaUtente(userId: string, content: string, userName: string, ip?: string, userAgent?: string) {
  try {
    // Salva la memoria della conversazione
    await supabase.from('user_memories').insert([
      { user_id: userId, content, user_name: userName }
    ]);

    // Se vengono passati i dati di sessione, tracciamo anche l'accesso/dispositivo
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

// Funzione dedicata al Super Admin per ottenere la lista degli utenti attivi e loggati
export async function getActiveUsersReport(): Promise<string> {
  try {
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('email, ip_address, user_agent, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !sessions || sessions.length === 0) {
      return "Nessuna sessione attiva registrata al momento nel database.";
    }

    let report = "📊 **Report Attività e Utenti Loggati:**\n\n";
    sessions.forEach((s, idx) => {
      report += `${idx + 1}. **Email:** ${s.email}\n   - **IP:** ${s.ip_address || 'Non rilevato'}\n   - **Dispositivo:** ${s.user_agent || 'Sconosciuto'}\n   - **Ultima attività:** ${new Date(s.created_at).toLocaleString()}\n\n`;
    });

    return report;
  } catch (err) {
    return "Errore durante il recupero del report delle sessioni.";
  }
}