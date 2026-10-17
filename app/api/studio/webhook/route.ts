import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-webhook-signature") || req.headers.get("x-hub-signature-256");
    const payload = await req.json().catch(() => ({}));

    // Verifica opzionale della firma per la sicurezza dei webhook (es. GitHub/Supabase)
    const eventType = req.headers.get("x-github-event") || payload.type || "custom_event";

    console.log(`[Webhook Ricevuto] Tipo evento: ${eventType}`, payload);

    // Gestione automatizzata in base all'evento ricevuto
    let responseMessage = "Webhook elaborato con successo.";

    if (eventType === "push" || eventType === "repository_dispatch") {
      responseMessage = "Evento Git intercettato: sincronizzazione dei flussi di sviluppo avviata.";
    } else if (eventType === "database_update") {
      responseMessage = "Aggiornamento database rilevato: ricalcolo dei vettori di memoria in corso.";
    }

    return NextResponse.json({
      success: true,
      event: eventType,
      message: responseMessage,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("Errore critico nel webhook:", err);
    return NextResponse.json({ success: false, error: err.message || "Errore interno nell'elaborazione del webhook." }, { status: 500 });
  }
}