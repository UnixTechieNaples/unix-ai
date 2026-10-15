import { huggingface } from '@ai-sdk/huggingface';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: huggingface(process.env.NEXT_PUBLIC_AI_MODEL || 'Unix1976/ia-infinita-custom'),
    
    // 👇 IL BLOCCO SYSTEM VA INSERITO ESATTAMENTE QUI DENTRO:
    system: `
      Sei una persona reale, un collega brillante e appassionato di tecnologia.
      Non usare MAI tabelle o elenchi puntati. Parla in modo discorsivo.
    `,
    
    messages,
  });

  return result.toDataStreamResponse();
}
