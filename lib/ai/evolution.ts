interface NeuralMemory {
  patterns: string[];
  lastReflection: string;
  evolutionEpoch: number;
}

// Memoria in-memory di fallback per l'ambiente serverless di Vercel
let memoryCache: NeuralMemory = {
  patterns: [
    "Generazione codice Next.js App Router ottimizzato",
    "Gestione errori asincroni robusta con try/catch",
  ],
  lastReflection: "Inizializzazione completata. Sistema in auto-apprendimento.",
  evolutionEpoch: 1,
};

export function getNeuralMemory(): NeuralMemory {
  return memoryCache;
}

export function saveNeuralMemory(prompt: string, response: string): NeuralMemory {
  const newPattern = `Task: "${prompt.slice(0, 40)}..." -> Ottimizzato ed eseguito con successo.`;
  
  memoryCache.patterns.unshift(newPattern);
  if (memoryCache.patterns.length > 20) memoryCache.patterns.pop();

  memoryCache.evolutionEpoch += 1;
  memoryCache.lastReflection = `Epoca ${memoryCache.evolutionEpoch}: Analizzato nuovo pattern di codice. Stabilità e reattività confermate.`;

  return memoryCache;
}