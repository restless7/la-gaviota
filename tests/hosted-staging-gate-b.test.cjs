const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

function loadTS(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', compiled);
  fn(mod, mod.exports, (id) => {
    if (id === 'server-only') return {};
    if (id === '@supabase/supabase-js') return require('@supabase/supabase-js');
    if (id === 'crypto' || id === 'node:crypto') return require('node:crypto');
    return require(id);
  }, path.dirname(fullPath), fullPath);
  return mod.exports;
}

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { assertStagingSafety } = loadTS('src/lib/safetyGuard.ts');

const STAGING_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sxmpefqlsakknpggtmzl.supabase.co';
const STAGING_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STAGING_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_1DNvVgcyGNiyEPYPERuUng_pCPLaKfH';

const serviceClient = createClient(STAGING_URL, STAGING_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const anonClient = createClient(STAGING_URL, STAGING_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

test('HOSTED-STAGE-SAFETY: Safety guard confirms sxmpefqlsakknpggtmzl is non-production staging', () => {
  assert.doesNotThrow(() => {
    assertStagingSafety({
      appEnv: 'staging',
      supabaseUrl: STAGING_URL,
      clerkPublishableKey: 'pk_test_ZGlzY3JldGUtb3JjYS04Ni5jbGVyay5hY2NvdW50cy5kZXYk',
      clerkSecretKey: 'sk_test_mock',
      wompiPubKey: 'pub_test_mock'
    });
  });
});

test('HOSTED-GATE-B1: Anonymous role catalog read is permitted, but orders table is blocked by RLS', async () => {
  // 1. Read catalog via anon
  const { data: catalog, error: catError } = await anonClient
    .from('products')
    .select('id, name, price_retail, is_active')
    .eq('is_active', true);

  assert.equal(catError, null, 'Anon catalog query must succeed');
  assert.ok(catalog.length >= 12, 'Catalog must return at least 12 synthetic products');

  // 2. Read orders via anon -> RLS must return empty array (0 rows)
  const { data: anonOrders, error: orderError } = await anonClient
    .from('orders')
    .select('id, customer_name, total_amount');

  assert.equal(orderError, null);
  assert.deepEqual(anonOrders, [], 'Anon query on orders must return empty array due to RLS');

  // 3. Direct insert via anon -> database permission denied
  const { error: insertError } = await anonClient
    .from('orders')
    .insert({
      customer_name: 'Attacker Anon',
      customer_email: 'attacker@evil.invalid',
      customer_phone: '1234567890',
      delivery_address: 'Fake 123',
      delivery_municipality: 'Bucaramanga',
      total_amount: 1000,
      payment_method: 'cash_on_delivery'
    });

  assert.ok(insertError, 'Direct insert on orders by anon must fail');
  assert.equal(insertError.code, '42501', 'Must return Postgres 42501 permission denied');
});

test('HOSTED-GATE-B2: Anonymous direct call to create_order_atomic RPC is denied at database permission level', async () => {
  const { data, error } = await anonClient.rpc('create_order_atomic', {
    p_order: { customer_name: 'Attacker' },
    p_items: [],
    p_payment_intent: null
  });

  assert.ok(error, 'Direct RPC by anon must fail');
  assert.equal(error.code, '42501', 'Must return 42501 permission denied for function create_order_atomic');
});

test('HOSTED-GATE-B3: Real Atomic Checkout persists order, decrements stock, and creates inventory movement', async () => {
  const clerkUserId = 'user_3LPW5Hb9Rr6drvmlnCS9sO7SE8p'; // Retail A
  const idempotencyKey = `hosted-order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Read current stock of sku-stag-manzana
  const { data: beforeProduct } = await serviceClient
    .from('products')
    .select('stock_quantity, price_retail')
    .eq('id', 'sku-stag-manzana')
    .single();

  const initialStock = Number(beforeProduct.stock_quantity);
  const unitPrice = Number(beforeProduct.price_retail);
  const qty = 2;
  const expectedTotal = unitPrice * qty; // 7,000 * 2 = 14,000

  const orderPayload = {
    clerk_user_id: clerkUserId,
    customer_name: 'Ana Retail Staging',
    customer_email: 'test-retail-a@staging.lagaviotafruver.com',
    customer_phone: '3001234567',
    delivery_address: 'Calle 36 #21-15 Apto 402',
    delivery_municipality: 'Bucaramanga',
    purchase_tier: 'RETAIL',
    total_amount: expectedTotal,
    payment_method: 'cash_on_delivery',
    idempotency_key: idempotencyKey,
    notes: 'Hosted Staging Integration Gate B'
  };

  const itemsPayload = [
    {
      product_id: 'sku-stag-manzana',
      product_name: 'Manzana Roja Staging',
      quantity: qty,
      price_at_purchase: unitPrice
    }
  ];

  // Invoke RPC via service role with validated customer clerk_user_id
  const { data: rpcResult, error: rpcError } = await serviceClient.rpc('create_order_atomic', {
    p_order: orderPayload,
    p_items: itemsPayload,
    p_payment_intent: null
  });

  assert.equal(rpcError, null, `RPC execution must succeed: ${rpcError?.message}`);
  assert.ok(rpcResult.order_id, 'RPC must return generated order_id');
  assert.equal(rpcResult.duplicate, false, 'First checkout must not be duplicate');

  // Verify stock decremented
  const { data: afterProduct } = await serviceClient
    .from('products')
    .select('stock_quantity')
    .eq('id', 'sku-stag-manzana')
    .single();

  assert.equal(Number(afterProduct.stock_quantity), initialStock - qty, 'Stock must decrement by exactly 2');

  // Verify inventory movement record was written
  const { data: movements } = await serviceClient
    .from('inventory_movements')
    .select('product_id, delta_quantity, reason')
    .eq('product_id', 'sku-stag-manzana')
    .eq('reason', 'ORDER_CHECKOUT');

  assert.ok(movements.length >= 1, 'Inventory movement must be recorded');
  assert.equal(Number(movements[0].delta_quantity), -qty);

  // Idempotent retry with identical key
  const { data: retryResult, error: retryError } = await serviceClient.rpc('create_order_atomic', {
    p_order: orderPayload,
    p_items: itemsPayload,
    p_payment_intent: null
  });

  assert.equal(retryError, null);
  assert.equal(retryResult.order_id, rpcResult.order_id, 'Idempotent retry must return identical order_id');
  assert.equal(retryResult.duplicate, true, 'Idempotent retry must flag duplicate: true');
});

test('HOSTED-GATE-B4: Cross-customer idempotency hijacking fails closed on remote staging database', async () => {
  const victimKey = `victim-key-${Date.now()}`;
  const victimUserId = 'user_3LPW5Hb9Rr6drvmlnCS9sO7SE8p'; // Retail A
  const attackerUserId = 'user_3LPW5LcCorWR0EisyAoepwHBY4D'; // Retail B

  // 1. Customer A creates order
  await serviceClient.rpc('create_order_atomic', {
    p_order: {
      clerk_user_id: victimUserId,
      customer_name: 'Customer A',
      customer_email: 'test-retail-a@staging.lagaviotafruver.com',
      customer_phone: '3001234567',
      delivery_address: 'Calle 1 #2-3',
      delivery_municipality: 'Bucaramanga',
      purchase_tier: 'RETAIL',
      total_amount: 3200,
      payment_method: 'cash_on_delivery',
      idempotency_key: victimKey
    },
    p_items: [{ product_id: 'sku-stag-banano', product_name: 'Banano Urabá Staging', quantity: 1, price_at_purchase: 3200 }],
    p_payment_intent: null
  });

  // 2. Customer B attempts to hijack with Customer A idempotency key
  const { data, error } = await serviceClient.rpc('create_order_atomic', {
    p_order: {
      clerk_user_id: attackerUserId,
      customer_name: 'Attacker B',
      customer_email: 'test-retail-b@staging.lagaviotafruver.com',
      customer_phone: '3009998877',
      delivery_address: 'Calle Evil 666',
      delivery_municipality: 'Bucaramanga',
      purchase_tier: 'RETAIL',
      total_amount: 3200,
      payment_method: 'cash_on_delivery',
      idempotency_key: victimKey
    },
    p_items: [{ product_id: 'sku-stag-banano', product_name: 'Banano Urabá Staging', quantity: 1, price_at_purchase: 3200 }],
    p_payment_intent: null
  });

  assert.ok(error, 'Cross-customer key reuse must be rejected');
  assert.ok(
    error.message.includes('IDEMPOTENCY_OWNER_MISMATCH'),
    `Must throw IDEMPOTENCY_OWNER_MISMATCH, got: ${error.message}`
  );
});

test('HOSTED-GATE-B5: Out of stock assertion prevents negative inventory on remote database', async () => {
  const { data, error } = await serviceClient.rpc('create_order_atomic', {
    p_order: {
      clerk_user_id: 'user_3LPW5Hb9Rr6drvmlnCS9sO7SE8p',
      customer_name: 'Stock Tester',
      customer_email: 'test-retail-a@staging.lagaviotafruver.com',
      customer_phone: '3001234567',
      delivery_address: 'Calle 1',
      delivery_municipality: 'Bucaramanga',
      purchase_tier: 'RETAIL',
      total_amount: 99999999,
      payment_method: 'cash_on_delivery',
      idempotency_key: `overdraw-test-${Date.now()}`
    },
    p_items: [
      { product_id: 'sku-stag-albahaca', product_name: 'Albahaca Fresca Staging', quantity: 999999, price_at_purchase: 1800 }
    ],
    p_payment_intent: null
  });

  assert.ok(error, 'Excessive quantity must fail');
  assert.ok(
    error.message.includes('INSUFFICIENT_STOCK'),
    `Must throw INSUFFICIENT_STOCK, got: ${error.message}`
  );
});
