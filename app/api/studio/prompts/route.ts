import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Recupera la libreria dei prompt salvati
export async function GET(req: Request) {
  try {
    const { data, error } = await supabase
      .from('prompt_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Se la tabella non esiste ancora, restituiamo un set di template di default
      return NextResponse.json({
        success: true,
        prompts: [
          { id: '1', title: 'Analisi Codice', content: 'Analizza questo blocco di codice individuando eventuali bug, colli di bottiglia o vulnerabilità di sicurezza.', category: 'Sviluppo' },
          { id: '2', title: 'Refactoring Pulito', content: 'Riscrivi questo codice seguendo i principi Clean Code, migliorando la leggibilità e le performance.', category: 'Ottimizzazione' },
          { id: '3', title: 'Spiegazione Architetturale', content: 'Spiega in dettaglio come funziona questa architettura e quali flussi di dati gestisce.', category: 'Spiegazione' }
        ]
      });
    }

    return NextResponse.json({ success: true, prompts: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Salva un nuovo template di prompt
export async function POST(req: Request) {
  try {
    const { title, content, category, userId } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ success: false, error: "Titolo e contenuto del prompt sono obbligatori." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('prompt_library')
      .insert([{ title, content, category: category || 'Generale', user_id: userId || 'admin-super-unix', created_at: new Date().toISOString() }]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Template di prompt salvato con successo." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}