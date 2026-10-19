import { NextResponse } from 'next/server';
import { getPersonalityState, evolvePersonality } from '@/lib/ai/personality';

// GET: Legge lo stato dell'androide
export async function GET() {
  try {
    const personality = await getPersonalityState();
    return NextResponse.json({ success: true, personality });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Stimola l'evoluzione psicologica/visiva
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mood, energyBoost } = body;
    const updated = await evolvePersonality(mood, energyBoost);
    return NextResponse.json({ success: true, personality: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}