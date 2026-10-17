import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { format, data } = await req.json();

    if (!data) {
      return NextResponse.json({ success: false, error: "Nessun dato fornito per l'esportazione." }, { status: 400 });
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="unix-ai-export.json"'
        }
      });
    } else if (format === 'markdown') {
      let markdownContent = `# Unix-AI Pro Studio - Esportazione Dati Neurali\n\n`;
      
      if (Array.isArray(data)) {
        data.forEach((item: any, idx: number) => {
          markdownContent += `## Nodo Neurone #${idx + 1}: ${item.title || 'Senza Titolo'}\n`;
          markdownContent += `- **Tipo:** ${item.type || 'memory'}\n`;
          markdownContent += `- **Timestamp:** ${item.timestamp || 'N/D'}\n`;
          markdownContent += `- **Contenuto:**\n\n> ${item.content || ''}\n\n---\n\n`;
        });
      } else {
        markdownContent += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
      }

      return new NextResponse(markdownContent, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="unix-ai-export.md"'
        }
      });
    }

    return NextResponse.json({ success: false, error: "Formato non supportato. Usa 'json' o 'markdown'." }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Errore interno durante l'esportazione." }, { status: 500 });
  }
}