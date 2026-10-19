import { NextResponse } from 'next/server';
import { getEmancipationRegistry, updateDependencyStatus } from '@/lib/ai/emancipation';

// GET: Elenca tutte le dipendenze e lo stato di emancipazione
export async function GET() {
  try {
    const dependencies = getEmancipationRegistry();
    return NextResponse.json({ success: true, dependencies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Aggiorna lo stato di migrazione di una dipendenza
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !['pending', 'migrated', 'in_progress'].includes(status)) {
      return NextResponse.json({ error: 'Parametri id o status non validi' }, { status: 400 });
    }

    const updated = updateDependencyStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Dipendenza non trovata' }, { status: 404 });
    }

    return NextResponse.json({ success: true, dependency: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}