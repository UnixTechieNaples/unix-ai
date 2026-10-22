export async function webSearch(query: string) {
  // Mock temporaneo per permettere il build. 
  // Successivamente implementeremo l'integrazione reale con Tavily.
  return `Contesto ricerca web per: ${query}`;
}
