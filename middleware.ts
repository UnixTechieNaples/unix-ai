import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Esempio di protezione delle rotte sotto /studio
  if (url.pathname.startsWith('/studio')) {
    // Qui puoi verificare la presenza di un cookie di sessione o token di autenticazione
    const sessionCookie = req.cookies.get('unix_session_token');
    
    // Per scopi di sviluppo/studio permettiamo l'accesso, ma predisponiamo il controllo
    if (!sessionCookie && process.env.NODE_ENV === 'production') {
      // In produzione potresti reindirizzare al login se manca la sessione
      // url.pathname = '/login';
      // return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*'],
};