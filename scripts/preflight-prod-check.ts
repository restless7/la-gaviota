/**
 * LG-PROD-R4.2: Production Pre-Flight Non-Mutating Verification Script
 * 
 * Verifies environment variable presence, structural validity, and safety guard compliance
 * without performing any mutation on production data.
 */

import { assertEnvironmentSafety, PROD_SUPABASE_PROJECT_ID } from '../src/lib/safetyGuard';

console.log('====================================================');
console.log('LG-PROD-R4.2: PRE-FLIGHT PRODUCTION INTEGRITY AUDIT');
console.log('====================================================\n');

// 1. Audit Environment Variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY'
];

let hasErrors = false;

console.log('1. Checking required environment variables:');
for (const v of requiredEnvVars) {
  const val = process.env[v];
  if (!val) {
    console.log(`  [MISSING] ${v}`);
    hasErrors = true;
  } else {
    const masked = val.length > 8 ? `${val.slice(0, 4)}...${val.slice(-4)}` : '***';
    console.log(`  [OK]      ${v} = ${masked}`);
  }
}

// 2. Validate Safety Guard
console.log('\n2. Testing Environment Safety Guard:');
try {
  assertEnvironmentSafety({
    appEnv: process.env.APP_ENV || 'production',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: process.env.CLERK_SECRET_KEY,
    wompiPubKey: process.env.NEXT_PUBLIC_WOMPI_PUB_KEY
  });
  console.log('  [PASS] Safety Guard accepted production configuration.');
} catch (err: any) {
  console.log(`  [FAIL] Safety Guard rejected configuration: ${err.message}`);
  hasErrors = true;
}

// 3. Strict Electronic Payments Deactivation Check
console.log('\n3. Verifying Online Payments Status (Must be Strictly Disabled):');
if (process.env.ENABLE_ONLINE_PAYMENTS === 'true') {
  console.log('  [FAIL] ENABLE_ONLINE_PAYMENTS=true detected! Production launch scope strictly forbids electronic payments.');
  hasErrors = true;
} else {
  console.log('  [PASS] ENABLE_ONLINE_PAYMENTS is not enabled.');
}

if (!process.env.NEXT_PUBLIC_WOMPI_PUB_KEY) {
  console.log('  [PASS] NEXT_PUBLIC_WOMPI_PUB_KEY is absent.');
  console.log('         Checkout is exclusively locked to PAGO CONTRA ENTREGA (Cash/POS).');
} else {
  console.log('  [FAIL] NEXT_PUBLIC_WOMPI_PUB_KEY is present in production scope!');
  console.log('         To guarantee single-channel Contra Entrega, omit Wompi keys entirely.');
  hasErrors = true;
}

console.log('\n====================================================');
if (hasErrors) {
  console.log('PRE-FLIGHT RESULT: BLOCKERS DETECTED (Do not proceed with go-live)');
  process.exit(1);
} else {
  console.log('PRE-FLIGHT RESULT: ALL CHECKS PASSED (Ready for go-live)');
  process.exit(0);
}

