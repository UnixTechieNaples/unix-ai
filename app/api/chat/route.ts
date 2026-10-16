import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getUtenti, checkIsSuperAdmin, salvaUtente, getActiveUsersReport } from '@/lib/db/memory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Inizializzazione sicura del client Groq a runtime
function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
  });
}

export async function GET() {
  return NextResponse.json({ status: "OK", system: "UNIX-AI Active" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = body?.messages || [];
    const userId = body?.userId || body?.user_id || 'sconosciuto';
    const userName = body?.userName || body?.user_name || 'Utente';
    
    // Recupera IP e User Agent dalla richiesta (se disponibili)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Sconosciuto';

    if (messages.length === 0) {
      return NextResponse.json({ success: false, reply: "Nessun messaggio ricevuto." });
    }

    const lastMessage = messages[messages.length - 1].content || '';

    // 1. Verifica se l'utente è Super Admin
    const isSuperAdmin = await checkIsSuperAdmin(userId);

    // 2. Se è Super Admin e chiede il report degli utenti / chi è collegato
    if (isSuperAdmin && (lastMessage.toLowerCase().includes('chi è collegato') || lastMessage.toLowerCase().includes('report') || lastMessage.toLowerCase().includes('utenti attivi'))) {
      const report = await getActiveUsersReport();
      return NextResponse.json({ success: true, reply: report });
    }

    // 3. Gestione dei comandi di auto-apprendimento ("impara", "memorizza", "ricorda")
    if (lastMessage.toLowerCase().startsWith('impara') || lastMessage.toLowerCase().startsWith('ricorda') || lastMessage.toLowerCase().includes('memorizza')) {
      await salvaUtente(userId, lastMessage, userName, ip, userAgent);
      return NextResponse.json({ 
        success: true, 
        reply: "Comando ricevuto e memorizzato permanentemente nella mia rete neurale e su Supabase. Non lo dimenticherò mai più." 
      });
    }

    // 4. Recupera la memoria globale e i fatti appresi da Supabase per dare contesto all'IA
    const memorieUtenti = await getUtenti();
    let contestoMemoria = "Memoria di sistema e fatti appresi:\n";
    memorieUtenti.forEach((u: any) => {
      contestoMemoria += `- Utente ${u.name} (${u.userId}): ${u.learnedFacts.join(', ')}\n`;
    });

    // 5. Interrogazione del modello Groq con la memoria e le direttive integrate
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // o il modello Groq che stai utilizzando nel progetto
      messages: [
        {
          role: "system",
          content: `Sei UNIX-AI, un'intelligenza artificiale avanzata dotata di auto-apprendimento, rete neurale persistente e accesso alla memoria globale tramite Supabase. 
          Ruolo utente corrente: ${isSuperAdmin ? 'Super Admin (Accesso totale e comandi di sistema)' : 'Utente Standard'}.
          ${contestoMemoria}`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const reply = completion.choices[0]?.message?.content || "Elaborazione completata.";

    // Salva automaticamente l'interazione per l'apprendimento continuo
    await salvaUtente(userId, `Interazione: ${lastMessage}`, userName, ip, userAgent);

    return NextResponse.json({ success: true, reply });

  } catch (error: any) {
    console.error("Errore nell'API chat:", error);
    return NextResponse.json({ 
      success: false, 
      reply: `Errore di sistema: ${error.message || 'Errore sconosciuto durante l\'elaborazione.'}` 
    }, { status: 500 });
  }
}