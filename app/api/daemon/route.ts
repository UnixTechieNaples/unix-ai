import { NextResponse } from 'next/server';
import { runAutonomousCycle } from '@/lib/ai/daemon';

// POST: Esegue manualmente o via trigger il ciclo autonomo
export async function POST(request: Request) {
  try {
    // Verifica opzionale di un token segreto di sicurezza per i cron jobs
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const result = await runAutonomousCycle();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Stato corrente del daemon
export async function GET() {
  return NextResponse.json({
    status: 'online',
    description: 'Background Daemon attivo per il Ciclo di Autonomia Proattiva a costo zero.',
    frequency: 'Regolabile tramite cron o chiamate manuali'
  });
}