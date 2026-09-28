import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');

  // Check for any Supabase auth cookie
  const allCookies = request.cookies.getAll();
  const hasSession = allCookies.some(
    (c) => c.name.startsWith('sb-') && c.name.includes('auth-token'),
  );

  if (!hasSession && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL('/documents', request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
