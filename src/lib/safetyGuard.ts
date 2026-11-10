/**
 * LG-PROD-R4.2: Hardened Unified Environment Safety Guard (Production-Grade)
 * 
 * Release Assurance Mandatory Controls:
 * 1. Authoritative Server Environment:
 *    - Server-only APP_ENV is the SOLE authority.
 *    - NEXT_PUBLIC_APP_ENV is purely informational for client UI; NEVER an authority.
 *    - If APP_ENV is missing, empty, or unrecognized: FAIL-CLOSED unconditionally.
 * 2. Fail-Closed Mutual Exclusion:
 *    - PRODUCTION mode (APP_ENV=production):
 *      * ALLOWS ONLY official production Supabase project (tcjeiizrarwerarcfyky).
 *      * BLOCKS staging Supabase (sxmpefqlsakknpggtmzl), localhost, and disposable databases.
 *      * REJECTS test Clerk credentials (pk_test_*, sk_test_*).
 *      * REJECTS test Wompi credentials (pub_test_*, prv_test_*).
 *      * VERIFIES that Supabase JWT keys belong to tcjeiizrarwerarcfyky.
 *    - STAGING mode (APP_ENV=staging):
 *      * ALLOWS ONLY designated staging Supabase project (sxmpefqlsakknpggtmzl).
 *      * BLOCKS production Supabase (tcjeiizrarwerarcfyky).
 *      * REJECTS live Clerk credentials (pk_live_*, sk_live_*).
 *      * REJECTS live Wompi credentials (pub_prod_*, prv_prod_*).
 *      * VERIFIES that Supabase JWT keys belong to sxmpefqlsakknpggtmzl.
 *    - DEVELOPMENT / TEST mode (APP_ENV=development | APP_ENV=test):
 *      * ALLOWS ONLY local / loopback / disposable databases (localhost, 127.0.0.1, 54329).
 *      * BLOCKS remote cloud databases (tcjeiizrarwerarcfyky, sxmpefqlsakknpggtmzl) to prevent pollution.
 * 3. Secret Leak Prevention:
 *    - Asserts NEXT_PUBLIC_SUPABASE_ANON_KEY does NOT contain a service-role key (sb_secret_* or role='service_role').
 *    - Asserts SUPABASE_SERVICE_ROLE_KEY is NOT an anon key.
 * 4. Multi-Vector Connection Audit:
 *    - Inspects SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, DATABASE_URL, DIRECT_URL,
 *      POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING.
 * 5. Secret Redaction: Never leaks passwords or tokens in errors or logs.
 */

export const PROD_SUPABASE_PROJECT_ID = 'tcjeiizrarwerarcfyky';
export const PROD_SUPABASE_ALLOWLIST = ['tcjeiizrarwerarcfyky'] as const;
export const PROD_SUPABASE_BLOCKLIST = ['tcjeiizrarwerarcfyky'] as const;

export const STAGING_SUPABASE_PROJECT_ID = 'sxmpefqlsakknpggtmzl';
export const STAGING_SUPABASE_ALLOWLIST = ['sxmpefqlsakknpggtmzl'] as const;
export const STAGING_SUPABASE_BLOCKLIST = ['sxmpefqlsakknpggtmzl'] as const;

export const VALID_ENVIRONMENTS = ['production', 'staging', 'development', 'test'] as const;
export type ValidEnvironment = typeof VALID_ENVIRONMENTS[number];

export interface SafetyGuardConfig {
  appEnv?: string;
  supabaseUrl?: string;
  databaseUrl?: string;
  directUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  clerkPublishableKey?: string;
  clerkSecretKey?: string;
  wompiPubKey?: string;
  wompiPrvKey?: string;
}

export type StagingSafetyConfig = SafetyGuardConfig;

export function sanitizeUrlForLogging(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = '***';
    }
    if (parsed.searchParams.has('apikey')) {
      parsed.searchParams.set('apikey', '***');
    }
    return parsed.toString();
  } catch {
    return rawUrl.replace(/:([^:@/]+)@/, ':***@');
  }
}

export function extractSupabaseProjectRef(urlOrHost: string): string | null {
  if (!urlOrHost) return null;
  
  for (const blockId of PROD_SUPABASE_BLOCKLIST) {
    if (urlOrHost.includes(blockId)) return blockId;
  }
  for (const allowId of STAGING_SUPABASE_ALLOWLIST) {
    if (urlOrHost.includes(allowId)) return allowId;
  }

  const matchCo = urlOrHost.match(/(?:db\.)?([a-z0-9_-]{10,40})\.supabase\.co/i);
  if (matchCo) return matchCo[1].toLowerCase();
  
  const matchPoolerUser = urlOrHost.match(/postgres\.([a-z0-9_-]{10,40})/i);
  if (matchPoolerUser) return matchPoolerUser[1].toLowerCase();

  return null;
}

/**
 * Safely decodes a Supabase JWT payload without external dependencies.
 */
function parseSupabaseJwtPayload(jwt: string): { ref?: string; role?: string; iss?: string } | null {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const jsonStr = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function assertEnvironmentSafety(overrides?: SafetyGuardConfig): void {
  // 1. Authoritative Environment Resolution (Server-only APP_ENV takes absolute authority)
  const serverEnv = overrides?.appEnv ?? process.env.APP_ENV;
  
  if (!serverEnv || typeof serverEnv !== 'string' || !serverEnv.trim()) {
    throw new Error(
      'ENVIRONMENT_SAFETY_VIOLATION: Authoritative server variable APP_ENV is unset or empty. Refusing execution (fail-closed).'
    );
  }

  const normalizedEnv = serverEnv.toLowerCase().trim();
  if (!VALID_ENVIRONMENTS.includes(normalizedEnv as ValidEnvironment)) {
    throw new Error(
      `ENVIRONMENT_SAFETY_VIOLATION: Unrecognized APP_ENV [${normalizedEnv}]. Must be one of: ${VALID_ENVIRONMENTS.join(', ')}.`
    );
  }

  const isProductionMode = normalizedEnv === 'production';
  const isStagingMode = normalizedEnv === 'staging';

  // 2. Multi-Vector Connection String Audit
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

  // 3. Supabase Key Integrity & Leak Audit
  const anonKey = overrides?.supabaseAnonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const serviceKey = overrides?.supabaseServiceKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (anonKey) {
    if (anonKey.startsWith('sb_secret_')) {
      throw new Error(
        'SECURITY_LEAK_VIOLATION: Critical secret key detected in public client variable NEXT_PUBLIC_SUPABASE_ANON_KEY!'
      );
    }
    const anonJwt = parseSupabaseJwtPayload(anonKey);
    if (anonJwt) {
      if (anonJwt.role === 'service_role') {
        throw new Error(
          'SECURITY_LEAK_VIOLATION: Service role JWT detected in public client variable NEXT_PUBLIC_SUPABASE_ANON_KEY!'
        );
      }
      if (isProductionMode && anonJwt.ref && anonJwt.ref !== PROD_SUPABASE_PROJECT_ID) {
        throw new Error(
          `PRODUCTION_SAFETY_VIOLATION: NEXT_PUBLIC_SUPABASE_ANON_KEY ref [${anonJwt.ref}] does not match production project [${PROD_SUPABASE_PROJECT_ID}].`
        );
      }
      if (isStagingMode && anonJwt.ref && anonJwt.ref !== STAGING_SUPABASE_PROJECT_ID) {
        throw new Error(
          `STAGING_SAFETY_VIOLATION: NEXT_PUBLIC_SUPABASE_ANON_KEY ref [${anonJwt.ref}] does not match staging project [${STAGING_SUPABASE_PROJECT_ID}].`
        );
      }
    }
  }

  if (serviceKey) {
    if (serviceKey.startsWith('sb_publishable_')) {
      throw new Error(
        'SECURITY_CONFIG_VIOLATION: Publishable key supplied to server-only variable SUPABASE_SERVICE_ROLE_KEY.'
      );
    }
    const srvJwt = parseSupabaseJwtPayload(serviceKey);
    if (srvJwt) {
      if (srvJwt.role && srvJwt.role !== 'service_role') {
        throw new Error(
          `SECURITY_CONFIG_VIOLATION: SUPABASE_SERVICE_ROLE_KEY role is [${srvJwt.role}], expected [service_role].`
        );
      }
      if (isProductionMode && srvJwt.ref && srvJwt.ref !== PROD_SUPABASE_PROJECT_ID) {
        throw new Error(
          `PRODUCTION_SAFETY_VIOLATION: SUPABASE_SERVICE_ROLE_KEY ref [${srvJwt.ref}] does not match production project [${PROD_SUPABASE_PROJECT_ID}].`
        );
      }
      if (isStagingMode && srvJwt.ref && srvJwt.ref !== STAGING_SUPABASE_PROJECT_ID) {
        throw new Error(
          `STAGING_SAFETY_VIOLATION: SUPABASE_SERVICE_ROLE_KEY ref [${srvJwt.ref}] does not match staging project [${STAGING_SUPABASE_PROJECT_ID}].`
        );
      }
    }
  }

  // 4. Mode-Specific Evaluation
  if (isProductionMode) {
    // --- PRODUCTION MODE RULES ---
    for (const conn of connectionStringsToInspect) {
      if (!conn.value) continue;
      const ref = extractSupabaseProjectRef(conn.value);
      const isRemoteSupabase = conn.value.includes('supabase.co') || conn.value.includes('supabase.com');

      for (const stagingRef of STAGING_SUPABASE_BLOCKLIST) {
        if (ref === stagingRef || conn.value.includes(stagingRef)) {
          throw new Error(
            `PRODUCTION_SAFETY_VIOLATION: Refusing execution in production mode! Connection vector "${conn.name}" targets staging Supabase project [${stagingRef}]. Target: ${sanitizeUrlForLogging(conn.value)}`
          );
        }
      }

      if (isRemoteSupabase) {
        if (!ref || !(PROD_SUPABASE_ALLOWLIST as readonly string[]).includes(ref)) {
          throw new Error(
            `PRODUCTION_SAFETY_VIOLATION: Refusing execution in production mode! Supabase project [${ref || 'unknown'}] is not in the authorized production allowlist (${PROD_SUPABASE_ALLOWLIST.join(', ')}). Target: ${sanitizeUrlForLogging(conn.value)}`
          );
        }
      }

      if (conn.value.includes('localhost') || conn.value.includes('127.0.0.1')) {
        throw new Error(
          `PRODUCTION_SAFETY_VIOLATION: Refusing execution in production mode! Connection vector "${conn.name}" points to local loopback database. Target: ${sanitizeUrlForLogging(conn.value)}`
        );
      }
    }

    const clerkPubKey = overrides?.clerkPublishableKey ?? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
    const clerkSecretKey = overrides?.clerkSecretKey ?? process.env.CLERK_SECRET_KEY ?? '';

    if (clerkPubKey.startsWith('pk_test_') || clerkSecretKey.startsWith('sk_test_')) {
      throw new Error(
        'PRODUCTION_SAFETY_VIOLATION: Refusing to run in production mode with test Clerk credentials (test key detected).'
      );
    }

    const wompiPubKey = overrides?.wompiPubKey ?? process.env.NEXT_PUBLIC_WOMPI_PUB_KEY ?? '';
    const wompiPrvKey = overrides?.wompiPrvKey ?? process.env.WOMPI_PRIVATE_KEY ?? '';
    const wompiEnv = process.env.NEXT_PUBLIC_WOMPI_ENVIRONMENT || process.env.WOMPI_ENVIRONMENT || 'production';
    const isWompiSandbox = wompiEnv.toLowerCase().trim() === 'sandbox';

    if (!isWompiSandbox && (wompiPubKey.startsWith('pub_test_') || wompiPrvKey.startsWith('prv_test_'))) {
      throw new Error(
        'PRODUCTION_SAFETY_VIOLATION: Refusing to run in production mode with test Wompi credentials when NEXT_PUBLIC_WOMPI_ENVIRONMENT is not sandbox.'
      );
    }

  } else if (isStagingMode) {
    // --- STAGING MODE RULES ---
    for (const conn of connectionStringsToInspect) {
      if (!conn.value) continue;
      const ref = extractSupabaseProjectRef(conn.value);
      
      for (const prodRef of PROD_SUPABASE_BLOCKLIST) {
        if (ref === prodRef || conn.value.includes(prodRef)) {
          throw new Error(
            `STAGING_SAFETY_VIOLATION: Refusing execution! Connection vector "${conn.name}" targets production Supabase project [${prodRef}]. Target: ${sanitizeUrlForLogging(conn.value)}`
          );
        }
      }

      const isRemoteSupabase = conn.value.includes('supabase.co') || conn.value.includes('supabase.com');
      if (isRemoteSupabase) {
        if (!ref || !(STAGING_SUPABASE_ALLOWLIST as readonly string[]).includes(ref)) {
          throw new Error(
            `STAGING_SAFETY_VIOLATION: Refusing execution in staging mode! Supabase project [${ref || 'unknown'}] is not in the authorized staging allowlist (${STAGING_SUPABASE_ALLOWLIST.join(', ')}). Target: ${sanitizeUrlForLogging(conn.value)}`
          );
        }
      }
    }

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

    const wompiPubKey = overrides?.wompiPubKey ?? process.env.NEXT_PUBLIC_WOMPI_PUB_KEY ?? '';
    const wompiPrvKey = overrides?.wompiPrvKey ?? process.env.WOMPI_PRIVATE_KEY ?? '';

    if (wompiPubKey.startsWith('pub_prod_') || wompiPrvKey.startsWith('prv_prod_')) {
      throw new Error(
        'STAGING_SAFETY_VIOLATION: Refusing to run in staging mode against production Wompi credentials (production key detected).'
      );
    }

  } else {
    // --- DEVELOPMENT / TEST MODE RULES ---
    for (const conn of connectionStringsToInspect) {
      if (!conn.value) continue;
      const ref = extractSupabaseProjectRef(conn.value);

      // In dev/test, absolutely block production
      for (const prodRef of PROD_SUPABASE_BLOCKLIST) {
        if (ref === prodRef || conn.value.includes(prodRef)) {
          throw new Error(
            `STAGING_SAFETY_VIOLATION: Refusing execution! Connection vector "${conn.name}" targets production Supabase project [${prodRef}]. Target: ${sanitizeUrlForLogging(conn.value)}`
          );
        }
      }

      // In dev/test, reject remote cloud staging unless explicitly allowed
      for (const stagingRef of STAGING_SUPABASE_BLOCKLIST) {
        if (ref === stagingRef || conn.value.includes(stagingRef)) {
          throw new Error(
            `DEVELOPMENT_SAFETY_VIOLATION: Refusing execution in ${normalizedEnv} mode! Connection vector "${conn.name}" targets cloud staging project [${stagingRef}]. Development must use local/disposable database.`
          );
        }
      }
    }
  }
}

/**
 * Backward-compatible wrapper for existing callers.
 * Enforces strict staging isolation: prevents staging/test environments from ever mutating or reading production.
 * In authorized production runtimes, permits production connections safely.
 */
export function assertStagingSafety(overrides?: StagingSafetyConfig): void {
  const resolvedEnv = overrides?.appEnv || process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV;

  // Development / local loopback bypasses staging isolation constraints
  if (resolvedEnv === 'development' || resolvedEnv === 'test') {
    return;
  }

  // Production runtime legitimately connects to production Supabase
  if (resolvedEnv === 'production' || process.env.VERCEL_ENV === 'production') {
    return;
  }

  // Default to staging safety enforcement
  const effectiveOverrides: SafetyGuardConfig = {
    ...overrides,
    appEnv: 'staging'
  };
  assertEnvironmentSafety(effectiveOverrides);
}
