import fs from 'fs/promises';
import path from 'path';

const dbFilePath = path.join(process.cwd(), 'database_utenti.json');

export interface Utente {
  userId: string;
  name?: string;
  lastInteraction: string;
  learnedFacts: string[];
}

export async function getUtenti(): Promise<Utente[]> {
  try {
    const data = await fs.readFile(dbFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function salvaUtente(userId: string, learnedFact?: string, name?: string): Promise<void> {
  const utenti = await getUtenti();
  let utente = utenti.find(u => u.userId === userId);

  if (!utente) {
    utente = {
      userId,
      name: name || 'Utente Sconosciuto',
      lastInteraction: new Date().toISOString(),
      learnedFacts: []
    };
    utenti.push(utente);
  } else {
    utente.lastInteraction = new Date().toISOString();
    if (name) utente.name = name;
  }

  if (learnedFact && !utente.learnedFacts.includes(learnedFact)) {
    utente.learnedFacts.push(learnedFact);
  }

  await fs.writeFile(dbFilePath, JSON.stringify(utenti, null, 2), 'utf-8');
}
