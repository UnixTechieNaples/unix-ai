import { NextResponse } from 'next/server';
import { storeMemory, searchMemories } from '@/lib/ai/embeddings';

// GET: Ricerca semantica tra i ricordi
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 5;

    if (!query) {
      return NextResponse.json({ error: 'Parametro query "q" mancante' }, { status: 400 });
    }

    const memories = await searchMemories(query, limit, 0.5, category);
    return NextResponse.json({ success: true, memories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Salvataggio di un nuovo ricordo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, category, metadata } = body;

    if (!content || !category) {
      return NextResponse.json(
        { error: 'Parametri "content" e "category" obbligatori' }, 
        { status: 400 }
      );
    }

    const memory = await storeMemory(content, category, metadata || {});
    return NextResponse.json({ success: true, memory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}