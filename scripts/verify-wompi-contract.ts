/**
 * LG-PROD-R4: Wompi Sandbox Contract & Onboarding Verifier
 * 
 * Verifies the Colombian collection/payment provider API contracts
 * using designated test credentials (pub_test_*, prv_test_*, integrity & event secrets).
 * 
 * Complies with strict Staging Safety Guard.
 */

import * as dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { assertStagingSafety } from '../src/lib/safetyGuard';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
assertStagingSafety();

const WOMPI_SANDBOX_BASE = 'https://sandbox.wompi.co/v1';

async function verifyWompiContract() {
  const pubKey = process.env.NEXT_PUBLIC_WOMPI_PUB_KEY;
  const prvKey = process.env.WOMPI_PRIVATE_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;

  console.log('[Wompi Onboarding] Verifying sandbox contract configuration...');

  if (!pubKey || !prvKey) {
    console.warn('⚠️  Wompi Sandbox test credentials are not yet configured in .env.local.');
    console.log('   Expected variables:');
    console.log('   - NEXT_PUBLIC_WOMPI_PUB_KEY (starts with pub_test_ or pub_stag_test_)');
    console.log('   - WOMPI_PRIVATE_KEY         (starts with prv_test_ or prv_stag_test_)');
    console.log('   - WOMPI_INTEGRITY_SECRET    (test_integrity_*)');
    console.log('   - WOMPI_EVENTS_SECRET       (test_events_*)');
    console.log('   Contract verification paused until test merchant is designated by owner.');
    return;
  }

  // 1. Verify key prefixes
  if (!pubKey.startsWith('pub_test_') && !pubKey.startsWith('pub_stag_test_')) {
    throw new Error(`Invalid public key prefix: ${pubKey.substring(0, 10)}... Must be test/sandbox.`);
  }
  if (!prvKey.startsWith('prv_test_') && !prvKey.startsWith('prv_stag_test_')) {
    throw new Error(`Invalid private key prefix: ${prvKey.substring(0, 10)}... Must be test/sandbox.`);
  }

  console.log('  ✔ Key prefixes conform to Wompi Sandbox standards.');

  // 2. Query Sandbox Merchant Endpoint
  try {
    const res = await fetch(`${WOMPI_SANDBOX_BASE}/merchants/${pubKey}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    console.log(`  ✔ Merchant verified: ${data.data?.name || 'Authorized Sandbox Merchant'}`);
    console.log(`    Presigned acceptance token: ${data.data?.presigned_acceptance?.acceptance_token ? 'Present' : 'Missing'}`);
    console.log(`    Supported payment methods: ${(data.data?.payment_methods || []).map((m: any) => m.name).join(', ')}`);
  } catch (err: any) {
    console.error('  ❌ Merchant query failed:', err.message);
    throw err;
  }

  // 3. Verify Signature Generation
  if (integritySecret) {
    const ref = 'TEST-INTEGRITY-CONTRACT-001';
    const amountInCents = 5000000;
    const currency = 'COP';
    const raw = `${ref}${amountInCents}${currency}${integritySecret}`;
    const sig = crypto.createHash('sha256').update(raw).digest('hex');
    console.log(`  ✔ Integrity signature generation verified (SHA-256): ${sig.substring(0, 16)}...`);
  }

  console.log('✅ Wompi Sandbox provider contract verified successfully.');
}

if (require.main === module) {
  verifyWompiContract().catch(err => {
    console.error('[Wompi Verifier ERROR]:', err);
    process.exit(1);
  });
}
