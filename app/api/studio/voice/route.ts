import { NextResponse } from 'next/server';
import { generateVoiceSpeech } from '@/lib/voice/cloner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text, voiceId, stability, similarityBoost } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: "Testo non fornito per la sintesi vocale." }, { status: 400 });
    }

    // Generazione della traccia audio tramite il modulo ElevenLabs configurato nel progetto
    const audioBase64 = await generateVoiceSpeech(text);

    if (!audioBase64) {
      return NextResponse.json({ success: false, error: "Impossibile generare l'audio con ElevenLabs." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      audio: audioBase64,
      parameters: {
        voiceId: voiceId || 'default-unix-voice',
        stability: stability || 0.75,
        similarityBoost: similarityBoost || 0.75,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Errore interno nel modulo vocale." }, { status: 500 });
  }
}