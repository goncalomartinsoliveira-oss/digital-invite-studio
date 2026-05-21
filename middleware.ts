import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALES = ['pt', 'en'] as const;
type Locale = typeof LOCALES[number];
const DEFAULT_LOCALE: Locale = 'en';
const COOKIE_NAME = 'NEXT_LOCALE';

function detectLocale(request: NextRequest): Locale {
  // 1. Cookie — escolha manual do utilizador (prioridade máxima)
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie && (LOCALES as readonly string[]).includes(cookie)) {
    return cookie as Locale;
  }

  // 2. Accept-Language header — preferência do browser
  const header = request.headers.get('accept-language') ?? '';
  for (const part of header.split(',')) {
    const lang = part.split(';')[0].trim().toLowerCase();
    if (lang.startsWith('pt')) return 'pt';
    // Futuro: adicionar 'es', 'fr', 'de', etc.
  }

  // 3. Fallback internacional
  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Se já tem um locale válido no URL, não fazer nada
  const hasLocale = LOCALES.some(
    l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );
  if (hasLocale) return NextResponse.next();

  // Detetar locale e redirecionar
  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
