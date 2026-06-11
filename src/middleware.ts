import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/shop(.*)',
  '/sobre-nosotros(.*)',
  '/product/(.*)',
  '/categoria/(.*)',
  '/comunidad(.*)',
  '/contacto(.*)',
  '/noticias(.*)',
  '/aplicar-negocio(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isRestauranteRoute = createRouteMatcher(['/restaurante(.*)']);
const isMicromercadoRoute = createRouteMatcher(['/micromercado(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl;

  // Public routes — no auth required
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // All other routes require authentication
  const session = await auth.protect();

  // Admin routes — require admin role in metadata
  if (isAdminRoute(request)) {
    const metadata = session.sessionClaims?.publicMetadata as Record<string, string> | undefined;
    const tier = metadata?.tier;
    if (tier !== 'admin' && tier !== 'SUPER_ADMIN') {
      // Non-admins get redirected to their dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Restaurante routes — require Restaurantes role
  if (isRestauranteRoute(request)) {
    const metadata = session.sessionClaims?.publicMetadata as Record<string, string> | undefined;
    const tier = metadata?.tier;
    if (tier !== 'Restaurantes' && tier !== 'admin' && tier !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/?error=access_denied_b2b', request.url));
    }
  }

  // Micromercado routes — require Micromercados role
  if (isMicromercadoRoute(request)) {
    const metadata = session.sessionClaims?.publicMetadata as Record<string, string> | undefined;
    const tier = metadata?.tier;
    if (tier !== 'Micromercados' && tier !== 'admin' && tier !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/?error=access_denied_b2b', request.url));
    }
  }

  // /dashboard — redirect to the correct portal based on role
  if (url.pathname === '/dashboard') {
    const metadata = session.sessionClaims?.publicMetadata as Record<string, string> | undefined;
    const tier = metadata?.tier || 'Personas Naturales';

    let targetPath = '/retail';
    if (tier === 'Micromercados') targetPath = '/micromercado';
    if (tier === 'Restaurantes') targetPath = '/restaurante';
    if (tier === 'admin' || tier === 'SUPER_ADMIN') targetPath = '/admin';

    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
