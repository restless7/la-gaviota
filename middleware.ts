import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getMiddlewareActor, hasCapability } from '@/src/lib/server/authorization';

const isPublicRoute = createRouteMatcher([
  '/',
  '/shop(.*)',
  '/cart(.*)',
  '/checkout(.*)',
  '/sobre-nosotros(.*)',
  '/nosotros(.*)',
  '/privacidad',
  '/terminos',
  '/pqrs',
  '/robots.txt',
  '/sitemap.xml',
  '/product/(.*)',
  '/categoria/(.*)',
  '/comunidad(.*)',
  '/contacto(.*)',
  '/noticias(.*)',
  '/aplicar-negocio(.*)',
  '/pedidos/(.*)',
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
  const authObj = await auth();
  if (!authObj.userId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes — require admin role in metadata
  if (isAdminRoute(request)) {
    const actor = await getMiddlewareActor(auth);
    const isAdmin = hasCapability(actor, 'catalog.manage');
    
    if (!isAdmin) {
      // Non-admins get redirected to their dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Restaurante routes — require Restaurantes role
  if (isRestauranteRoute(request)) {
    const actor = await getMiddlewareActor(auth);
    const tier = actor.tier;
    const isAdmin = hasCapability(actor, 'catalog.manage');
    
    if (tier !== 'Restaurantes' && !isAdmin) {
      return NextResponse.redirect(new URL('/?error=access_denied_b2b', request.url));
    }
  }

  // Micromercado routes — require Micromercados role
  if (isMicromercadoRoute(request)) {
    const actor = await getMiddlewareActor(auth);
    const tier = actor.tier;
    const isAdmin = hasCapability(actor, 'catalog.manage');
    
    if (tier !== 'Micromercados' && !isAdmin) {
      return NextResponse.redirect(new URL('/?error=access_denied_b2b', request.url));
    }
  }

  // /dashboard — redirect to the correct customer portal based on tier
  if (url.pathname === '/dashboard') {
    const actor = await getMiddlewareActor(auth);
    const tier = actor.tier;

    let targetPath = '/retail';
    if (tier === 'Micromercados') targetPath = '/micromercado';
    if (tier === 'Restaurantes') targetPath = '/restaurante';

    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  const response = NextResponse.next();

  // Enforce HTTP header X-Robots-Tag: noindex, nofollow for all private, administrative and transactional routes
  if (
    isAdminRoute(request) ||
    isRestauranteRoute(request) ||
    isMicromercadoRoute(request) ||
    url.pathname.startsWith('/retail') ||
    url.pathname.startsWith('/checkout') ||
    url.pathname.startsWith('/cart') ||
    url.pathname.startsWith('/dashboard')
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
