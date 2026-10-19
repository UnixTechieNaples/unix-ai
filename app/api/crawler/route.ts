import { NextResponse } from 'next/server';
import { crawlAndStoreResource } from '@/lib/ai/crawler';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL di destinazione mancante' }, { status: 400 });
    }

    const result = await crawlAndStoreResource(url);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}