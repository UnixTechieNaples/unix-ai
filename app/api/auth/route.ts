import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, action } = body; // action: 'signup' o 'signin'

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email e password sono obbligatorie." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

      // Crea o aggiorna il profilo nella tabella profiles con ruolo di default 'user'
      if (data.user) {
        await supabase.from('profiles').upsert([
          { id: data.user.id, email: email, role: 'user' }
        ]);
      }

      return NextResponse.json({ success: true, message: "Registrazione completata! Ora puoi effettuare il login." });
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });

      // Controlla il ruolo nella tabella profiles
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();

      return NextResponse.json({ 
        success: true, 
        user: {
          id: data.user.id,
          email: data.user.email,
          role: profile?.role || 'user'
        }
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Errore interno del server" }, { status: 500 });
  }
}