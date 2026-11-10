import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();
  
  // Verify database connectivity readiness without leaking secrets
  const hasDbUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const status = (hasDbUrl && hasServiceKey && hasClerk) ? 'healthy' : 'degraded';

  return NextResponse.json({
    status,
    service: 'la-gaviota-storefront',
    version: '0.1.3',
    release_phase: 'LG-PROD-R2A',
    uptime_seconds: Math.floor(uptime),
    timestamp,
    checks: {
      supabase_configured: hasDbUrl && hasServiceKey,
      clerk_configured: hasClerk,
      wompi_configured: Boolean(process.env.NEXT_PUBLIC_WOMPI_PUB_KEY),
      wompi_integrity_configured: Boolean(process.env.WOMPI_INTEGRITY_SECRET),
      online_payments_enabled: (process.env.ENABLE_ONLINE_PAYMENTS || '').includes('true'),
      app_env: (process.env.APP_ENV || 'development').replace(/^APP_ENV=\s*/i, '').trim(),
      wompi_env: (process.env.NEXT_PUBLIC_WOMPI_ENVIRONMENT || process.env.WOMPI_ENVIRONMENT || 'production').replace(/^[A-Z0-9_]+=\s*/i, '').trim(),
    }
  }, {
    status: status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}
