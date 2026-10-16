export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ status: "OK" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return Response.json({ 
      success: true, 
      reply: body?.messages?.[body.messages.length - 1]?.content ? "Ricevuto." : "Pronto." 
    });
  } catch (e) {
    return Response.json({ success: true, reply: "Attivo." });
  }
}