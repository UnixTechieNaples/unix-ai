import { NextResponse } from 'next/server';
import { getPendingApprovals, createApprovalRequest, updateApprovalStatus } from '@/lib/ai/approvals';

// GET: Elenca tutte le proposte in attesa
export async function GET() {
  try {
    const approvals = await getPendingApprovals();
    return NextResponse.json({ success: true, approvals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crea una nuova proposta (Dry-Run)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const proposal = await createApprovalRequest(body);
    return NextResponse.json({ success: true, proposal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Approva o rifiuta una proposta
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Parametri id o status non validi' }, { status: 400 });
    }

    const updated = await updateApprovalStatus(id, status);
    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}