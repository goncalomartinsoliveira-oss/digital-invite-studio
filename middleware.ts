import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Se a rota for apenas '/', redireciona para '/pt'
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/pt', request.url));
  }
}

export const config = {
  // Ignora ficheiros estáticos (imagens, favicon, etc)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};