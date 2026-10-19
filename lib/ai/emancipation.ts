export interface DependencyItem {
  id: string;
  name: string;
  type: 'api' | 'cloud_service' | 'database';
  isExternal: boolean;
  replacementCandidate: string;
  emancipationStatus: 'pending' | 'migrated' | 'in_progress';
}

// Registro locale delle dipendenze di sistema
const systemDependencies: DependencyItem[] = [
  {
    id: 'dep-1',
    name: 'OpenAI Embeddings API',
    type: 'api',
    isExternal: true,
    replacementCandidate: 'Local HuggingFace Transformers / Xenova-Transformers (Zero-Cost)',
    emancipationStatus: 'in_progress'
  },
  {
    id: 'dep-2',
    name: 'Supabase Cloud Managed',
    type: 'database',
    isExternal: true,
    replacementCandidate: 'Self-Hosted PostgreSQL with pgvector (Docker)',
    emancipationStatus: 'pending'
  }
];

/**
 * Restituisce l'elenco delle dipendenze e il loro stato di emancipazione.
 */
export function getEmancipationRegistry(): DependencyItem[] {
  return systemDependencies;
}

/**
 * Aggiorna lo stato di emancipazione di una risorsa specifica.
 */
export function updateDependencyStatus(id: string, status: 'pending' | 'migrated' | 'in_progress'): DependencyItem | null {
  const dep = systemDependencies.find(d => d.id === id);
  if (dep) {
    dep.emancipationStatus = status;
    return dep;
  }
  return null;
}