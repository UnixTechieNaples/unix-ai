import { NextResponse } from 'next/server';
import { runSwarmOperation, SwarmTask } from '@/lib/ai/swarm';

export async function POST(request: Request) {
  try {
    const { tasks }: { tasks: SwarmTask[] } = await request.json();

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'Nessun task assegnato allo sciame' }, { status: 400 });
    }

    const results = await runSwarmOperation(tasks);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}