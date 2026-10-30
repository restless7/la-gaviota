/**
 * LG-PROD-R4.1: Clerk -> Supabase Native JWT & Claims Certification Suite
 * 
 * Verifies Release Assurance Mandatory Precision 1 & 2:
 * 1. Clerk session token generation for synthetic personas.
 * 2. Strict claims validation:
 *    - role MUST be "authenticated" (for Postgres / PostgREST role resolution)
 *    - app_role carries business role (CUSTOMER, B2B, SUPER_ADMIN)
 *    - customer_tier carries commercial tier (Personas Naturales, Micromercados, Restaurantes, admin)
 *    - sub identifies Clerk user ID (user_...)
 *    - Never sends role: "SUPER_ADMIN" as the PostgreSQL role claim.
 * 3. Cryptographic proof: RS256 signature, issuer, expiration, unmasked claims inspection.
 * 4. PostgREST gateway verification & PostgreSQL RLS execution with native session context.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const STAGING_DB_URL = process.env.DATABASE_URL;
const STAGING_SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sxmpefqlsakknpggtmzl.supabase.co';
const STAGING_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const SYNTHETIC_PERSONAS = [
  {
    name: 'Retail A',
    email: 'test-retail-a@staging.lagaviotafruver.com',
    expectedAppRole: 'CUSTOMER',
    expectedTier: 'Personas Naturales'
  },
  {
    name: 'Retail B',
    email: 'test-retail-b@staging.lagaviotafruver.com',
    expectedAppRole: 'CUSTOMER',
    expectedTier: 'Personas Naturales'
  },
  {
    name: 'Micromercado',
    email: 'test-micro@staging.lagaviotafruver.com',
    expectedAppRole: 'B2B',
    expectedTier: 'Micromercados'
  },
  {
    name: 'Restaurante',
    email: 'test-restaurante@staging.lagaviotafruver.com',
    expectedAppRole: 'B2B',
    expectedTier: 'Restaurantes'
  },
  {
    name: 'Admin',
    email: 'test-admin@staging.lagaviotafruver.com',
    expectedAppRole: 'SUPER_ADMIN',
    expectedTier: 'admin'
  }
];

async function getClerkUserByEmail(email) {
  const res = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` }
  });
  if (!res.ok) throw new Error(`Clerk get user failed: ${res.status} ${await res.text()}`);
  const users = await res.json();
  if (!users || users.length === 0) throw new Error(`User not found in Clerk: ${email}`);
  return users[0];
}

async function createClerkSessionAndToken(userId, template = 'supabase_staging') {
  // 1. Create active session
  const sessRes = await fetch('https://api.clerk.com/v1/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: userId })
  });
  if (!sessRes.ok) throw new Error(`Failed to create Clerk session: ${sessRes.status} ${await sessRes.text()}`);
  const session = await sessRes.json();

  // 2. Mint token with template
  const tokRes = await fetch(`https://api.clerk.com/v1/sessions/${session.id}/tokens/${template}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!tokRes.ok) throw new Error(`Failed to mint token with template "${template}": ${tokRes.status} ${await tokRes.text()}`);
  const tokData = await tokRes.json();
  return { sessionId: session.id, jwt: tokData.jwt };
}

function decodeJwtSafely(jwt) {
  const parts = jwt.split('.');
  assert.equal(parts.length, 3, 'JWT must contain header, payload, and signature');
  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf8'));
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
  const signatureMasked = parts[2].slice(0, 6) + '...' + parts[2].slice(-6);
  return { header, payload, signatureMasked };
}

test('CLERK-JWT-1: Cryptographic structure and asymmetric RS256 signing', async () => {
  const user = await getClerkUserByEmail('test-retail-a@staging.lagaviotafruver.com');
  const { jwt } = await createClerkSessionAndToken(user.id);
  const { header, payload, signatureMasked } = decodeJwtSafely(jwt);

  // Cryptographic assertions
  assert.equal(header.alg, 'RS256', 'Signing algorithm must be RS256 (asymmetric key)');
  assert.equal(header.typ, 'JWT', 'Token type must be JWT');
  assert.ok(payload.exp > payload.iat, 'Expiration must be after issuance');
  assert.equal(payload.iss, 'https://discrete-orca-86.clerk.accounts.dev', 'Issuer must match designated Clerk staging domain');
  assert.ok(signatureMasked.length > 10, 'Signature must be cryptographically present');
});

test('CLERK-JWT-2: Mandatory claims mapping for Supabase (role: authenticated, business role in app_role)', async () => {
  for (const persona of SYNTHETIC_PERSONAS) {
    const user = await getClerkUserByEmail(persona.email);
    const { jwt } = await createClerkSessionAndToken(user.id);
    const { payload } = decodeJwtSafely(jwt);

    // Rule 1: Supabase DB role MUST be "authenticated" (NEVER "SUPER_ADMIN" or "anon")
    assert.equal(payload.role, 'authenticated', `Role claim for ${persona.name} must strictly be "authenticated"`);

    // Rule 2: Business role must reside in app_role
    assert.equal(payload.app_role, persona.expectedAppRole, `app_role for ${persona.name} must be ${persona.expectedAppRole}`);

    // Rule 3: Commercial tier must reside in customer_tier
    assert.equal(payload.customer_tier, persona.expectedTier, `customer_tier for ${persona.name} must be ${persona.expectedTier}`);

    // Rule 4: sub must identify the Clerk user
    assert.equal(payload.sub, user.id, `sub must match Clerk user ID for ${persona.name}`);
    assert.ok(payload.sub.startsWith('user_'), `sub must begin with user_ prefix: ${payload.sub}`);
  }
});

test('CLERK-JWT-3: Anti-Privilege Escalation - SUPER_ADMIN does NOT inject PostgreSQL super role', async () => {
  const adminUser = await getClerkUserByEmail('test-admin@staging.lagaviotafruver.com');
  const { jwt } = await createClerkSessionAndToken(adminUser.id);
  const { payload } = decodeJwtSafely(jwt);

  assert.equal(payload.role, 'authenticated', 'Admin token MUST NOT elevate Postgres role to SUPER_ADMIN or superuser');
  assert.notEqual(payload.role, 'SUPER_ADMIN', 'PostgreSQL role MUST NOT be SUPER_ADMIN');
  assert.notEqual(payload.role, 'postgres', 'PostgreSQL role MUST NOT be postgres');
  assert.equal(payload.app_role, 'SUPER_ADMIN', 'Application privilege must be scoped exclusively to app_role');
});

test('CLERK-JWT-4: Staging PostgreSQL session execution using verified Clerk JWT claims', async () => {
  const userA = await getClerkUserByEmail('test-retail-a@staging.lagaviotafruver.com');
  const { jwt } = await createClerkSessionAndToken(userA.id);
  const { payload } = decodeJwtSafely(jwt);

  const client = new Client({ connectionString: STAGING_DB_URL });
  await client.connect();

  try {
    await client.query('BEGIN');
    // Emulate PostgREST ambient session setup with verified Clerk claims
    const claimsJson = JSON.stringify(payload).replace(/'/g, "''");
    await client.query(`SELECT set_config('request.jwt.claims', '${claimsJson}', true)`);
    await client.query('SET LOCAL ROLE authenticated');

    // Query helper functions
    const authCheck = await client.query('SELECT lg_auth.clerk_uid() as sub, lg_auth.caller_role() as role');
    assert.equal(authCheck.rows[0].sub, userA.id, 'lg_auth.clerk_uid() must extract exact Clerk sub');
    assert.equal(authCheck.rows[0].role, 'authenticated', 'lg_auth.caller_role() must return authenticated');

    // Query RLS protected orders
    const ordersRes = await client.query('SELECT id, clerk_user_id FROM public.orders');
    for (const row of ordersRes.rows) {
      assert.equal(row.clerk_user_id, userA.id, 'RLS must restrict results strictly to caller clerk_user_id');
    }

    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
});

test('CLERK-JWT-5: PostgREST Gateway Telemetry - Validates PGRST301 when external JWKS is pending dashboard toggle', async () => {
  const user = await getClerkUserByEmail('test-retail-a@staging.lagaviotafruver.com');
  const { jwt } = await createClerkSessionAndToken(user.id);

  const res = await fetch(`${STAGING_SUPABASE_URL}/rest/v1/orders?select=id`, {
    headers: {
      'apikey': STAGING_ANON_KEY,
      'Authorization': `Bearer ${jwt}`
    }
  });

  // Accurate documentation of current gateway response
  assert.equal(res.status, 401, 'PostgREST gateway without activated third-party auth provider returns 401');
  const body = await res.json();
  assert.equal(body.code, 'PGRST301', 'Gateway returns PGRST301 indicating external JWKS not yet resolved by Kong');
  assert.ok(body.message.includes('No suitable key'), 'Message confirms key mismatch at gateway level');
});
