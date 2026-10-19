export interface AudioAsset {
  id: string;
  textSnippet: string;
  audioUrl: string;
  createdAt: string;
}

// Archivio locale in memoria per i campioni vocali autoprodotti (banking audio)
const audioBankingCache = new Map<string, AudioAsset>();

/**
 * Registra o memorizza un campione audio generato per un determinato testo.
 */
export function registerAudioAsset(textSnippet: string, audioUrl: string): AudioAsset {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
  const asset: AudioAsset = {
    id,
    textSnippet,
    audioUrl,
    createdAt: new Date().toISOString(),
  };

  audioBankingCache.set(id, asset);
  return asset;
}

/**
 * Recupera un campione audio precedentemente archiviato.
 */
export function getAudioAsset(id: string): AudioAsset | undefined {
  return audioBankingCache.get(id);
}

/**
 * Restituisce l'elenco di tutti i campioni vocali presenti nella banca audio.
 */
export function listAudioBank(): AudioAsset[] {
  return Array.from(audioBankingCache.values());
}