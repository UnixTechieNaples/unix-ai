import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface ApprovalRequest {
  taskTitle: string;
  description: string;
  filePath: string;
  originalContent: string;
  proposedContent: string;
  aiRationale: string;
}

/**
 * Crea una nuova proposta in attesa nel Centro Approvazioni (Dry-Run mode)
 */
export async function createApprovalRequest(req: ApprovalRequest) {
  const { data, error } = await supabaseAdmin
    .from('pending_approvals')
    .insert([
      {
        task_title: req.taskTitle,
        description: req.description,
        file_path: req.filePath,
        original_content: req.originalContent,
        proposed_content: req.proposedContent,
        ai_rationale: req.aiRationale,
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Errore creazione proposta di approvazione: ${error.message}`);
  }

  return data;
}

/**
 * Recupera tutte le proposte pendenti in attesa del tuo via libera
 */
export async function getPendingApprovals() {
  const { data, error } = await supabaseAdmin
    .from('pending_approvals')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Errore recupero approvazioni: ${error.message}`);
  }

  return data;
}

/**
 * Approva o rifiuta una proposta
 */
export async function updateApprovalStatus(id: string, status: 'approved' | 'rejected') {
  const { data, error } = await supabaseAdmin
    .from('pending_approvals')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Errore aggiornamento stato approvazione: ${error.message}`);
  }

  // Se approvato, qui scatterà l'applicazione effettiva sul file system (Fase successiva)
  return data;
}