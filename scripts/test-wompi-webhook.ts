import crypto from 'crypto';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load local environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET;
const LOCAL_WEBHOOK_URL = 'http://localhost:3000/api/webhooks/wompi';

if (!WOMPI_EVENTS_SECRET) {
  console.error('❌ Error: WOMPI_EVENTS_SECRET no está definido en .env.local');
  process.exit(1);
}

// 1. Configure test data
// IMPORTANT: Replace this 'reference' with a REAL Order UUID from your local Supabase database
// otherwise the webhook will return 200 (Wompi compliance) but will log an error failing to find the order.
const TEST_ORDER_UUID = '00000000-0000-0000-0000-000000000000'; // <--- UPDATE THIS
const TEST_TRANSACTION_ID = `test_tx_${Date.now()}`;
const TEST_AMOUNT_CENTS = 15000000; // 150,000 COP
const TEST_STATUS = 'APPROVED';
const TIMESTAMP = Math.floor(Date.now() / 1000).toString();

// 2. Generate legitimate cryptographic checksum
// Wompi Formula: SHA256(id + status + amount_in_cents + timestamp + secret)
const rawString = `${TEST_TRANSACTION_ID}${TEST_STATUS}${TEST_AMOUNT_CENTS}${TIMESTAMP}${WOMPI_EVENTS_SECRET}`;
const checksum = crypto.createHash('sha256').update(rawString).digest('hex');

// 3. Build identical payload structure
const payload = {
  event: 'transaction.updated',
  data: {
    transaction: {
      id: TEST_TRANSACTION_ID,
      amount_in_cents: TEST_AMOUNT_CENTS,
      reference: TEST_ORDER_UUID,
      customer_email: 'qa@lagaviota.com',
      currency: 'COP',
      payment_method_type: 'NEQUI',
      redirect_url: 'https://lagaviota.com/status',
      status: TEST_STATUS,
      shipping_address: null,
      payment_link_id: null,
      payment_source_id: null
    }
  },
  environment: 'test',
  signature: {
    properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
    checksum: checksum
  },
  timestamp: parseInt(TIMESTAMP)
};

async function simulateWebhook(attempt: number) {
  console.log(`\n🚀 [Attempt ${attempt}] Sending mocked webhook to ${LOCAL_WEBHOOK_URL}...`);
  try {
    const response = await fetch(LOCAL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseBody = await response.json();
    console.log(`✅ [Attempt ${attempt}] HTTP Status:`, response.status);
    console.log(`✅ [Attempt ${attempt}] Response Body:`, responseBody);

    if (response.status === 401) {
      console.error('❌ Checksum validation failed. Your WOMPI_EVENTS_SECRET might not match.');
    }

  } catch (err) {
    console.error(`❌ [Attempt ${attempt}] Connection failed. Is Next.js running on localhost:3000?`, err);
  }
}

async function run() {
  console.log('================================================');
  console.log('🤖 LA GAVIOTA: WOMPI WEBHOOK SIMULATOR');
  console.log('================================================');
  console.log(`Transaction ID: ${TEST_TRANSACTION_ID}`);
  console.log(`Reference (Order ID): ${TEST_ORDER_UUID}`);
  console.log(`Generated Checksum: ${checksum}`);
  console.log('------------------------------------------------');

  // Attempt 1: Initial mutation
  await simulateWebhook(1);

  console.log('\n⏳ Waiting 2 seconds before simulating duplicate payload for Idempotency test...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Attempt 2: Idempotency check
  // Backend should return 200 without duplicating business logic.
  await simulateWebhook(2);
}

run();
