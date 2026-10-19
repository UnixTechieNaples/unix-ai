import { NextResponse } from 'next/server';
import { registerAudioAsset, listAudioBank } from '@/lib/ai/audioManager';

// GET: Elenca tutti i campioni vocali archiviati
export async function GET() {
  try {
    const assets = listAudioBank();
    return NextResponse.json({ success: true, audioBank: assets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Registra un nuovo campione audio nell'archivio
export async function POST(request: Request) {
  try {
    const { textSnippet, audioUrl } = await request.json();

    if (!textSnippet || !audioUrl) {
      return NextResponse.json({ error: 'Parametri "textSnippet" e "audioUrl" obbligatori' }, { status: 400 });
    }

    const newAsset = registerAudioAsset(textSnippet, audioUrl);
    return NextResponse.json({ success: true, asset: newAsset });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}