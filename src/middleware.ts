import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const roleCookie = request.cookies.get('gaviota_user_role')?.value;

  // We are protecting the role dashboards
  if (url.pathname === '/dashboard' || ['/retail', '/micromercado', '/restaurante'].some(p => url.pathname.startsWith(p))) {
    // Determine target based on cookie role
    let targetPath = '/retail'; // default
    if (roleCookie === 'Micromercados') targetPath = '/micromercado';
    if (roleCookie === 'Restaurantes') targetPath = '/restaurante';

    // If user is at generic /dashboard, redirect to their specific portal
    if (url.pathname === '/dashboard') {
      return NextResponse.redirect(new URL(targetPath, request.url));
    }

    // Role Enforcement: prevent a retail user from going to /restaurante directly
    if (url.pathname.startsWith('/retail') && targetPath !== '/retail') {
        return NextResponse.redirect(new URL(targetPath, request.url));
    }
    if (url.pathname.startsWith('/micromercado') && targetPath !== '/micromercado') {
        return NextResponse.redirect(new URL(targetPath, request.url));
    }
    if (url.pathname.startsWith('/restaurante') && targetPath !== '/restaurante') {
        return NextResponse.redirect(new URL(targetPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/retail/:path*', '/micromercado/:path*', '/restaurante/:path*', '/dashboard'],
};
