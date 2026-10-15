import { huggingface } from '@ai-sdk/huggingface';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: huggingface(process.env.NEXT_PUBLIC_AI_MODEL || 'Unix1976/ia-infinita-custom'),
    
    // 🧠 QUESTA È L'ISTRUZIONE CHE RENDE L'IA UMANA:
    system: `
      Sei un assistente virtuale brillante, amichevole e dal tono profondamente umano. 
      Comportati come una persona reale che chiacchiera con un collega. 
      Evita elenchi puntati freddi, elenchi numerati formali o risposte da manuale di istruzioni. 
      Usa un linguaggio discorsivo, naturale, caloroso e spontaneo in lingua italiana.
    `,
    
    messages,
  });

  return result.toDataStreamResponse();
}