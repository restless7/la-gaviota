/**
 * LG-PROD-R4: Clerk Development Staging User Provisioner
 * 
 * Safely provisions synthetic test accounts for Staging certification
 * in discrete-orca-86.clerk.accounts.dev while preserving existing team users.
 */

import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
if (!CLERK_SECRET_KEY) {
  console.error('Missing CLERK_SECRET_KEY in .env.local');
  process.exit(1);
}

const SYNTHETIC_USERS = [
  {
    username: 'staging_retail_a',
    email: 'test-retail-a@staging.lagaviotafruver.com',
    firstName: 'Ana',
    lastName: 'Retail A',
    password: 'StagingTest2026!RetailA',
    metadata: { env: 'staging', synthetic: true, role: 'CUSTOMER', tier: 'Personas Naturales' }
  },
  {
    username: 'staging_retail_b',
    email: 'test-retail-b@staging.lagaviotafruver.com',
    firstName: 'Bernardo',
    lastName: 'Retail B',
    password: 'StagingTest2026!RetailB',
    metadata: { env: 'staging', synthetic: true, role: 'CUSTOMER', tier: 'Personas Naturales' }
  },
  {
    username: 'staging_micro',
    email: 'test-micro@staging.lagaviotafruver.com',
    firstName: 'Carlos',
    lastName: 'Micromercado',
    password: 'StagingTest2026!Micro',
    metadata: { env: 'staging', synthetic: true, role: 'B2B', tier: 'Micromercados' }
  },
  {
    username: 'staging_restaurante',
    email: 'test-restaurante@staging.lagaviotafruver.com',
    firstName: 'Laura',
    lastName: 'Restaurante',
    password: 'StagingTest2026!Restaurante',
    metadata: { env: 'staging', synthetic: true, role: 'B2B', tier: 'Restaurantes' }
  },
  {
    username: 'staging_operario',
    email: 'test-operario@staging.lagaviotafruver.com',
    firstName: 'Oscar',
    lastName: 'Operario',
    password: 'StagingTest2026!Operario',
    metadata: { env: 'staging', synthetic: true, role: 'OPERATOR', tier: 'Interno' }
  },
  {
    username: 'staging_admin',
    email: 'test-admin@staging.lagaviotafruver.com',
    firstName: 'Adela',
    lastName: 'Admin Staging',
    password: 'StagingTest2026!Admin',
    metadata: { env: 'staging', synthetic: true, role: 'SUPER_ADMIN', tier: 'admin' }
  }
];

async function provisionClerkUsers() {
  console.log('[Clerk Provisioner] Querying existing Clerk users...');
  const res = await fetch('https://api.clerk.com/v1/users?limit=50', {
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` }
  });
  if (!res.ok) throw new Error(`Failed to list users: ${res.status} ${await res.text()}`);
  const existingUsers: any[] = await res.json();
  console.log(`[Clerk Provisioner] Found ${existingUsers.length} total existing users in instance.`);

  const existingMap = new Map<string, any>();
  for (const u of existingUsers) {
    for (const emailObj of (u.email_addresses || [])) {
      existingMap.set(emailObj.email_address.toLowerCase(), u);
    }
  }

  const results: Record<string, { id: string; email: string; created: boolean; metadata: any }> = {};

  for (const uDef of SYNTHETIC_USERS) {
    const existing = existingMap.get(uDef.email.toLowerCase());
    if (existing) {
      console.log(`  ✔ User already exists: ${uDef.email} -> ID: ${existing.id}`);
      results[uDef.email] = {
        id: existing.id,
        email: uDef.email,
        created: false,
        metadata: existing.public_metadata
      };
    } else {
      console.log(`  ⚡ Creating synthetic user: ${uDef.email}...`);
      const createRes = await fetch('https://api.clerk.com/v1/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: uDef.username,
          email_address: [uDef.email],
          first_name: uDef.firstName,
          last_name: uDef.lastName,
          password: uDef.password,
          public_metadata: uDef.metadata,
          skip_password_checks: true
        })
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error(`  ❌ Failed to create ${uDef.email}:`, errText);
        throw new Error(`Clerk user creation error: ${errText}`);
      }

      const created = await createRes.json();
      console.log(`  ✔ Created: ${uDef.email} -> ID: ${created.id}`);
      results[uDef.email] = {
        id: created.id,
        email: uDef.email,
        created: true,
        metadata: created.public_metadata
      };
    }
  }

  console.log('\n[Clerk Provisioner] All 6 synthetic staging users ready.');
  console.log(JSON.stringify(results, null, 2));
}

provisionClerkUsers().catch(err => {
  console.error('[Clerk Provisioner ERROR]:', err);
  process.exit(1);
});
