/**
 * LG-PROD-R4.1: Hardened Staging Safety Guard
 * 
 * Release Assurance Mandatory Controls:
 * 1. Uses server-only APP_ENV as the authoritative server-side boundary (does not trust client NEXT_PUBLIC_APP_ENV alone).
 * 2. Enforces strict ALLOWLIST for designated staging Supabase project (sxmpefqlsakknpggtmzl).
 * 3. Enforces explicit BLOCKLIST against production Supabase project (tcjeiizrarwerarcfyky).
 * 4. Audits ALL connection vectors: DATABASE_URL, DIRECT_URL, SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING.
 * 5. Rejects production Clerk credentials (pk_live_*, sk_live_*).
 * 6. Rejects production Wompi credentials (pub_prod_*, prv_prod_*).
 * 7. Never leaks credentials, passwords, or secrets in exceptions or logs (redaction enforced).
 */

export const PROD_SUPABASE_PROJECT_ID = 'tcjeiizrarwerarcfyky';
export const PROD_SUPABASE_BLOCKLIST = ['tcjeiizrarwerarcfyky'] as const;

export const STAGING_SUPABASE_PROJECT_ID = 'sxmpefqlsakknpggtmzl';
export const STAGING_SUPABASE_ALLOWLIST = ['sxmpefqlsakknpggtmzl'] as const;

export interface StagingSafetyConfig {
  appEnv?: string;
  supabaseUrl?: string;
  databaseUrl?: string;
  directUrl?: string;
  clerkPublishableKey?: string;
  clerkSecretKey?: string;
  wompiPubKey?: string;
  wompiPrvKey?: string;
}

export function sanitizeUrlForLogging(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = '***';
    }
    // Redact apikey query parameter if present
    if (parsed.searchParams.has('apikey')) {
      parsed.searchParams.set('apikey', '***');
    }
    return parsed.toString();
  } catch {
    // If not a standard URL, redact any password or token pattern
    return rawUrl.replace(/:([^:@/]+)@/, ':***@');
  }
}

export function extractSupabaseProjectRef(urlOrHost: string): string | null {
  if (!urlOrHost) return null;
  
  // Direct matching against known constants first
  for (const blockId of PROD_SUPABASE_BLOCKLIST) {
    if (urlOrHost.includes(blockId)) return blockId;
  }
  for (const allowId of STAGING_SUPABASE_ALLOWLIST) {
    if (urlOrHost.includes(allowId)) return allowId;
  }

  // Match *.supabase.co or db.*.supabase.co
  const matchCo = urlOrHost.match(/(?:db\.)?([a-z0-9_-]{10,40})\.supabase\.co/i);
  if (matchCo) return matchCo[1].toLowerCase();
  
  // Match pooler user: postgres.<ref>
  const matchPoolerUser = urlOrHost.match(/postgres\.([a-z0-9_-]{10,40})/i);
  if (matchPoolerUser) return matchPoolerUser[1].toLowerCase();

  return null;
}

export function assertStagingSafety(overrides?: StagingSafetyConfig): void {
  // 1. Resolve environment: Server-only APP_ENV takes precedence over NEXT_PUBLIC_APP_ENV
  const serverEnv = overrides?.appEnv ?? process.env.APP_ENV;
  const publicEnv = process.env.NEXT_PUBLIC_APP_ENV;
  const nodeEnv = process.env.NODE_ENV;

  // Authoritative environment check:
  // If APP_ENV is set, use it. If not set, check NEXT_PUBLIC_APP_ENV.
  const isStagingMode = 
    (serverEnv && serverEnv.toLowerCase().trim() === 'staging') ||
    (!serverEnv && publicEnv && publicEnv.toLowerCase().trim() === 'staging');

  // 2. Multi-vector connection string audit
  const connectionStringsToInspect: Array<{ name: string; value: string }> = [
    { name: 'override.supabaseUrl', value: overrides?.supabaseUrl || '' },
    { name: 'override.databaseUrl', value: overrides?.databaseUrl || '' },
    { name: 'override.directUrl', value: overrides?.directUrl || '' },
    { name: 'SUPABASE_URL', value: process.env.SUPABASE_URL || '' },
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL || '' },
    { name: 'DATABASE_URL', value: process.env.DATABASE_URL || '' },
    { name: 'DIRECT_URL', value: process.env.DIRECT_URL || '' },
    { name: 'POSTGRES_PRISMA_URL', value: process.env.POSTGRES_PRISMA_URL || '' },
    { name: 'POSTGRES_URL_NON_POOLING', value: process.env.POSTGRES_URL_NON_POOLING || '' }
  ];

  for (const conn of connectionStringsToInspect) {
    if (!conn.value) continue;
    const ref = extractSupabaseProjectRef(conn.value);
    
    // Explicit Blocklist check: NEVER allow connection to production Supabase project in any test/staging context
    for (const prodRef of PROD_SUPABASE_BLOCKLIST) {
      if (ref === prodRef || conn.value.includes(prodRef)) {
        throw new Error(
          `STAGING_SAFETY_VIOLATION: Refusing execution! Connection vector "${conn.name}" targets production Supabase project [${prodRef}]. Target: ${sanitizeUrlForLogging(conn.value)}`
        );
      }
    }

    // Strict Allowlist check: In staging mode, ANY remote Supabase target MUST be in the staging allowlist
    if (isStagingMode) {
      const isRemoteSupabase = conn.value.includes('supabase.co') || conn.value.includes('supabase.com');
      if (isRemoteSupabase) {
        if (!ref || !STAGING_SUPABASE_ALLOWLIST.includes(ref as any)) {
          throw new Error(
            `STAGING_SAFETY_VIOLATION: Refusing execution in staging mode! Supabase project [${ref || 'unknown'}] is not in the authorized staging allowlist (${STAGING_SUPABASE_ALLOWLIST.join(', ')}). Target: ${sanitizeUrlForLogging(conn.value)}`
          );
        }
      }
    }
  }

  // 3. Staging-Specific Secret Assertions
  if (isStagingMode) {
    // Clerk Configuration Check: Refuse live keys
    const clerkPubKey = overrides?.clerkPublishableKey ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
    const clerkSecretKey = overrides?.clerkSecretKey ?? process.env.CLERK_SECRET_KEY ?? '';

    if (clerkPubKey.startsWith('pk_live_') || clerkSecretKey.startsWith('sk_live_')) {
      throw new Error(
        'STAGING_SAFETY_VIOLATION: Refusing to run in staging mode against production Clerk credentials (live key detected).'
      );
    }

    if (clerkPubKey && !clerkPubKey.startsWith('pk_test_')) {
      throw new Error(
        'STAGING_SAFETY_VIOLATION: Refusing to run in staging mode against non-test Clerk publishable key.'
      );
    }

    // Wompi Configuration Check: Refuse production keys
    const wompiPubKey = overrides?.wompiPubKey ?? process.env.NEXT_PUBLIC_WOMPI_PUB_KEY ?? '';
    const wompiPrvKey = overrides?.wompiPrvKey ?? process.env.WOMPI_PRIVATE_KEY ?? '';

    if (wompiPubKey.startsWith('pub_prod_') || wompiPrvKey.startsWith('prv_prod_')) {
      throw new Error(
        'STAGING_SAFETY_VIOLATION: Refusing to run in staging mode against production Wompi credentials (production key detected).'
      );
    }
  }
}
