const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTS(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', compiled);
  fn(mod, mod.exports, require, path.dirname(fullPath), fullPath);
  return mod.exports;
}

const { computeCheckoutFingerprint } = loadTS('src/lib/idempotency.ts');
const { Pool } = require('pg');

const PG_CONFIG = {
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://sebastiangarcia@127.0.0.1:54329/postgres',
  max: 30,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
};

let pool;

test.before(async () => {
  pool = new Pool(PG_CONFIG);
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT version();');
    assert.ok(res.rows[0].version.includes('PostgreSQL 16'), 'Connected to real PostgreSQL 16');

    // Clean and seed baseline test products and B2B balances
    await client.query(`
      DELETE FROM public.inventory_movements;
      DELETE FROM public.wompi_event_receipts;
      DELETE FROM public.payment_intents;
      DELETE FROM public.order_items;
      DELETE FROM public.orders;
      DELETE FROM public.products;
      DELETE FROM public.b2b_credit_profiles;

      INSERT INTO public.products (id, name, category, unit, price_retail, price_micro, price_restaurant, stock_quantity, is_active)
      VALUES 
        ('sku-apple', 'Manzana Royal Gala', 'FRUTAS', 'kg', 8500, 7500, 7000, 100, true),
        ('sku-truffle', 'Trufa Negra Simulada', 'GOURMET', 'kg', 8500, 8500, 8500, 50, true),
        ('sku-pear', 'Pera Packham', 'FRUTAS', 'kg', 5000, 4500, 4000, 100, true),
        ('sku-limited', 'Producto Escaso', 'FRUTAS', 'kg', 10000, 9000, 8000, 10, true);

      INSERT INTO public.b2b_credit_profiles (user_id, tier, credit_limit, credit_balance)
      VALUES 
        ('user_b2b_restaurant', 'Restaurantes', 2000000, 500000),
        ('user_b2b_restaurant_2', 'Restaurantes', 2000000, 500000),
        ('user_b2b_micro', 'Micromercados', 1000000, 300000);

      INSERT INTO public.global_settings (id, track_inventory)
      VALUES ('default', true)
      ON CONFLICT (id) DO UPDATE SET track_inventory = true;
    `);
  } finally {
    client.release();
  }
});

test.after(async () => {
  if (pool) {
    await pool.end();
  }
});

// ============================================================================
// GATE SEC-RPC: SECURE POSTGRESQL RPC ENTRY POINTS & LEAST PRIVILEGE
// ============================================================================

test('SEC-RPC: Anonymous role direct call to create_order_atomic is denied at database permission level', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query('SET ROLE anon;');

    const orderPayload = {
      clerk_user_id: 'user_anon_attacker',
      total_amount: 17000,
      customer_name: 'Attacker'
    };
    const itemsPayload = [{ product_id: 'sku-apple', quantity: 2, price_at_purchase: 8500 }];

    await assert.rejects(
      client.query('SELECT public.create_order_atomic($1, $2, NULL);', [
        JSON.stringify(orderPayload),
        JSON.stringify(itemsPayload)
      ]),
      /permission denied for function create_order_atomic/,
      'Anonymous user must have zero execute privileges on create_order_atomic'
    );
  } finally {
    await client.query('ROLLBACK;');
    await client.query('RESET ROLE;');
    client.release();
  }
});

test('SEC-RPC: Direct call to process_wompi_transaction by authenticated or anon role is denied', async () => {
  const client = await pool.connect();
  try {
    // 1. Test as anon
    await client.query('BEGIN;');
    await client.query('SET ROLE anon;');
    await assert.rejects(
      client.query("SELECT public.process_wompi_transaction('evt_fake', '{\"id\":\"tx-fake\"}'::jsonb);"),
      /permission denied for function process_wompi_transaction/,
      'anon must have zero execute privileges on process_wompi_transaction'
    );
    await client.query('ROLLBACK;');

    // 2. Test as authenticated
    await client.query('BEGIN;');
    await client.query('SET ROLE authenticated;');
    await assert.rejects(
      client.query("SELECT public.process_wompi_transaction('evt_fake', '{\"id\":\"tx-fake\"}'::jsonb);"),
      /permission denied for function process_wompi_transaction/,
      'authenticated customer must have zero execute privileges on process_wompi_transaction'
    );
    await client.query('ROLLBACK;');
  } finally {
    await client.query('RESET ROLE;');
    client.release();
  }
});

test('SEC-RPC: Authenticated customer attempting to forge another customer order raises FORBIDDEN_USER_IMPERSONATION', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query('SET ROLE authenticated;');
    // Simulate JWT claim from Clerk: current authenticated user is user_victim_b
    await client.query(`SET LOCAL "request.jwt.claims" = '{"sub": "user_victim_b", "role": "authenticated"}';`);

    // Attacker tries to place an order in the name of user_victim_a
    const orderPayload = {
      clerk_user_id: 'user_victim_a',
      total_amount: 8500,
      customer_name: 'Victim A',
      idempotency_key: 'key-impersonation-attempt-1'
    };
    const itemsPayload = [{ product_id: 'sku-apple', quantity: 1, price_at_purchase: 8500 }];

    await assert.rejects(
      client.query('SELECT public.create_order_atomic($1, $2, NULL);', [
        JSON.stringify(orderPayload),
        JSON.stringify(itemsPayload)
      ]),
      /FORBIDDEN_USER_IMPERSONATION/,
      'Caller token sub does not match clerk_user_id; order must be rejected'
    );

    await client.query('ROLLBACK;');
    await client.query('RESET ROLE;');

    // Verify zero writes occurred
    const check = await client.query("SELECT count(*) FROM public.orders WHERE idempotency_key = 'key-impersonation-attempt-1';");
    assert.equal(parseInt(check.rows[0].count, 10), 0);
  } finally {
    try { await client.query('ROLLBACK;'); } catch {}
    try { await client.query('RESET ROLE;'); } catch {}
    client.release();
  }
});

test('SEC-RPC: Authenticated customer checkout with matching JWT succeeds cleanly', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query('SET ROLE authenticated;');
    await client.query(`SET LOCAL "request.jwt.claims" = '{"sub": "user_legit_customer_1", "role": "authenticated"}';`);

    const orderPayload = {
      clerk_user_id: 'user_legit_customer_1',
      total_amount: 8500,
      customer_name: 'Legit Customer',
      idempotency_key: 'key-legit-auth-1'
    };
    const itemsPayload = [{ product_id: 'sku-apple', quantity: 1, price_at_purchase: 8500 }];

    const res = await client.query('SELECT public.create_order_atomic($1, $2, NULL) AS result;', [
      JSON.stringify(orderPayload),
      JSON.stringify(itemsPayload)
    ]);

    assert.equal(res.rows[0].result.success, true);
    assert.equal(res.rows[0].result.duplicate, false);
    assert.ok(res.rows[0].result.order_id);
  } finally {
    await client.query('ROLLBACK;');
    await client.query('RESET ROLE;');
    client.release();
  }
});

// ============================================================================
// GATE COM-IDEMP: COMPLETE IDEMPOTENCY PAYLOAD FINGERPRINTING
// ============================================================================

test('COM-IDEMP: Same key + same payload produces idempotent duplicate acknowledgment', async () => {
  const client = await pool.connect();
  try {
    const key = 'idemp-exact-match-key-1';
    const intent = {
      clerk_user_id: 'user_customer_idemp',
      purchase_tier: 'retail',
      items: [{ product_id: 'sku-apple', quantity: 2, price_at_purchase: 8500 }],
      delivery_address: 'Calle 13 #22-49',
      delivery_municipality: 'bucaramanga',
      total_amount: 17000,
      payment_method: 'cash'
    };
    const fingerprint = computeCheckoutFingerprint(intent);

    const orderPayload = {
      clerk_user_id: intent.clerk_user_id,
      total_amount: intent.total_amount,
      idempotency_key: key,
      idempotency_fingerprint: fingerprint,
      delivery_address: intent.delivery_address,
      delivery_municipality: intent.delivery_municipality
    };

    // First attempt creates order
    const res1 = await client.query('SELECT public.create_order_atomic($1, $2, NULL) AS result;', [
      JSON.stringify(orderPayload),
      JSON.stringify(intent.items)
    ]);
    assert.equal(res1.rows[0].result.success, true);
    assert.equal(res1.rows[0].result.duplicate, false);
    const orderId = res1.rows[0].result.order_id;

    // Second identical attempt succeeds idempotently
    const res2 = await client.query('SELECT public.create_order_atomic($1, $2, NULL) AS result;', [
      JSON.stringify(orderPayload),
      JSON.stringify(intent.items)
    ]);
    assert.equal(res2.rows[0].result.success, true);
    assert.equal(res2.rows[0].result.duplicate, true);
    assert.equal(res2.rows[0].result.order_id, orderId);
  } finally {
    client.release();
  }
});

test('COM-IDEMP: Same key + changed SKU (same total price: 8,500 COP) is REJECTED', async () => {
  const client = await pool.connect();
  try {
    const key = 'idemp-diff-sku-same-total-key';
    
    // Attempt 1: 1 unit of Apple @ 8,500 = 8,500
    const intent1 = {
      clerk_user_id: 'user_sku_test',
      purchase_tier: 'retail',
      items: [{ product_id: 'sku-apple', quantity: 1, price_at_purchase: 8500 }],
      delivery_address: 'Calle 13 #22-49',
      delivery_municipality: 'bucaramanga',
      total_amount: 8500,
      payment_method: 'cash'
    };
    const fp1 = computeCheckoutFingerprint(intent1);
    const res1 = await client.query('SELECT public.create_order_atomic($1, $2, NULL) AS result;', [
      JSON.stringify({ ...intent1, idempotency_key: key, idempotency_fingerprint: fp1 }),
      JSON.stringify(intent1.items)
    ]);
    assert.equal(res1.rows[0].result.success, true);

    // Attempt 2: Reusing SAME KEY with 1 unit of Truffle @ 8,500 = 8,500 (SAME TOTAL, DIFFERENT SKU!)
    const intent2 = {
      clerk_user_id: 'user_sku_test',
      purchase_tier: 'retail',
      items: [{ product_id: 'sku-truffle', quantity: 1, price_at_purchase: 8500 }],
      delivery_address: 'Calle 13 #22-49',
      delivery_municipality: 'bucaramanga',
      total_amount: 8500,
      payment_method: 'cash'
    };
    const fp2 = computeCheckoutFingerprint(intent2);
    assert.notEqual(fp1, fp2, 'Fingerprints must differ even though total is identical');

    await assert.rejects(
      client.query('SELECT public.create_order_atomic($1, $2, NULL);', [
        JSON.stringify({ ...intent2, idempotency_key: key, idempotency_fingerprint: fp2 }),
        JSON.stringify(intent2.items)
      ]),
      /IDEMPOTENCY_PAYLOAD_MISMATCH/,
      'Must reject reuse of idempotency key when SKU changes even if total is identical'
    );
  } finally {
    client.release();
  }
});

test('COM-IDEMP: Same key + changed delivery address is REJECTED', async () => {
  const client = await pool.connect();
  try {
    const key = 'idemp-diff-address-key';
    const intent1 = {
      clerk_user_id: 'user_addr_test',
      purchase_tier: 'retail',
      items: [{ product_id: 'sku-apple', quantity: 1, price_at_purchase: 8500 }],
      delivery_address: 'Calle 13 #22-49 Local 10',
      delivery_municipality: 'bucaramanga',
      total_amount: 8500,
      payment_method: 'cash'
    };
    const fp1 = computeCheckoutFingerprint(intent1);
    await client.query('SELECT public.create_order_atomic($1, $2, NULL);', [
      JSON.stringify({ ...intent1, idempotency_key: key, idempotency_fingerprint: fp1 }),
      JSON.stringify(intent1.items)
    ]);

    // Same key, changed delivery address to Carrera 27 #36-14
    const intent2 = {
      ...intent1,
      delivery_address: 'Carrera 27 #36-14'
    };
    const fp2 = computeCheckoutFingerprint(intent2);

    await assert.rejects(
      client.query('SELECT public.create_order_atomic($1, $2, NULL);', [
        JSON.stringify({ ...intent2, idempotency_key: key, idempotency_fingerprint: fp2 }),
        JSON.stringify(intent2.items)
      ]),
      /IDEMPOTENCY_PAYLOAD_MISMATCH/,
      'Must reject reuse of idempotency key when delivery address changes'
    );
  } finally {
    client.release();
  }
});

test('COM-IDEMP: Same request with reordered line items matches canonical fingerprint identically', async () => {
  const client = await pool.connect();
  try {
    const key = 'idemp-reordered-lines-key';
    const lineA = { product_id: 'sku-apple', quantity: 1, price_at_purchase: 8500 };
    const lineB = { product_id: 'sku-pear', quantity: 2, price_at_purchase: 5000 };

    const intentOrder1 = {
      clerk_user_id: 'user_reorder_test',
      purchase_tier: 'retail',
      items: [lineA, lineB],
      delivery_address: 'Calle 13 #22-49',
      delivery_municipality: 'bucaramanga',
      total_amount: 18500,
      payment_method: 'cash'
    };
    const fp1 = computeCheckoutFingerprint(intentOrder1);

    const intentOrder2 = {
      clerk_user_id: 'user_reorder_test',
      purchase_tier: 'retail',
      items: [lineB, lineA], // Reversed order!
      delivery_address: 'Calle 13 #22-49',
      delivery_municipality: 'bucaramanga',
      total_amount: 18500,
      payment_method: 'cash'
    };
    const fp2 = computeCheckoutFingerprint(intentOrder2);

    assert.equal(fp1, fp2, 'Canonical fingerprint must be order-invariant for line items');

    const res1 = await client.query('SELECT public.create_order_atomic($1, $2, NULL) AS result;', [
      JSON.stringify({ ...intentOrder1, idempotency_key: key, idempotency_fingerprint: fp1 }),
      JSON.stringify(intentOrder1.items)
    ]);
    const res2 = await client.query('SELECT public.create_order_atomic($1, $2, NULL) AS result;', [
      JSON.stringify({ ...intentOrder2, idempotency_key: key, idempotency_fingerprint: fp2 }),
      JSON.stringify(intentOrder2.items)
    ]);

    assert.equal(res2.rows[0].result.duplicate, true);
    assert.equal(res2.rows[0].result.order_id, res1.rows[0].result.order_id);
  } finally {
    client.release();
  }
});

// ============================================================================
// GATE PAY-STATE: HARDENED WOMPI PAYMENT STATE TRANSITIONS & LEDGER INTEGRITY
// ============================================================================

test('PAY-STATE: B2B balance deduction strictly moves from COP 500,000 to COP 400,000 after COP 100,000 payment', async () => {
  const client = await pool.connect();
  try {
    const reference = 'BAL_user_b2b_restaurant_1730000000';
    const amountInCents = 10000000; // 100,000 COP

    // Check balance before
    const bBefore = await client.query("SELECT credit_balance FROM public.b2b_credit_profiles WHERE user_id = 'user_b2b_restaurant';");
    assert.equal(parseFloat(bBefore.rows[0].credit_balance), 500000);

    const txPayload = {
      id: 'tx_wompi_balance_100k',
      reference: reference,
      status: 'APPROVED',
      amount_in_cents: amountInCents,
      currency: 'COP'
    };

    const res = await client.query("SELECT public.process_wompi_transaction('evt_bal_1', $1) AS result;", [
      JSON.stringify(txPayload)
    ]);

    assert.equal(res.rows[0].result.success, true);
    assert.equal(res.rows[0].result.action, 'balance_credited');
    assert.equal(res.rows[0].result.amount, 100000);

    // Check balance after: strictly 400,000 COP
    const bAfter = await client.query("SELECT credit_balance FROM public.b2b_credit_profiles WHERE user_id = 'user_b2b_restaurant';");
    assert.equal(parseFloat(bAfter.rows[0].credit_balance), 400000);

    // Replay with identical event ID -> duplicate, balance remains 400,000
    const resDup = await client.query("SELECT public.process_wompi_transaction('evt_bal_1', $1) AS result;", [
      JSON.stringify(txPayload)
    ]);
    assert.equal(resDup.rows[0].result.duplicate, true);

    const bAfterDup = await client.query("SELECT credit_balance FROM public.b2b_credit_profiles WHERE user_id = 'user_b2b_restaurant';");
    assert.equal(parseFloat(bAfterDup.rows[0].credit_balance), 400000);
  } finally {
    client.release();
  }
});

test('PAY-STATE: Ten callbacks with distinct receipt IDs for one approved payment deduct balance exactly once', async () => {
  const client = await pool.connect();
  try {
    const reference = 'BAL_user_b2b_restaurant_2_1730000000';
    const amountInCents = 10000000; // 100,000 COP

    const txPayload = {
      id: 'tx_wompi_distinct_receipts',
      reference: reference,
      status: 'APPROVED',
      amount_in_cents: amountInCents,
      currency: 'COP'
    };

    // Send 10 callbacks, each with a different event ID (e.g. evt_replay_1 .. evt_replay_10)
    for (let i = 1; i <= 10; i++) {
      const res = await client.query("SELECT public.process_wompi_transaction($1, $2) AS result;", [
        `evt_replay_${i}`,
        JSON.stringify(txPayload)
      ]);
      if (i === 1) {
        assert.equal(res.rows[0].result.action, 'balance_credited');
      } else {
        // Subsequent distinct events recognize payment intent is already APPROVED
        assert.equal(res.rows[0].result.duplicate, true);
      }
    }

    // Balance must be exactly 400,000 COP (deducted once, not 10 times)
    const bFinal = await client.query("SELECT credit_balance FROM public.b2b_credit_profiles WHERE user_id = 'user_b2b_restaurant_2';");
    assert.equal(parseFloat(bFinal.rows[0].credit_balance), 400000);
  } finally {
    client.release();
  }
});

test('PAY-STATE: Payment transaction with altered amount raises PAYMENT_AMOUNT_MISMATCH', async () => {
  const client = await pool.connect();
  try {
    // Create an order for 8,500 COP
    const orderPayload = {
      clerk_user_id: 'user_fraud_test',
      total_amount: 8500,
      customer_name: 'Fraud Test',
      idempotency_key: 'key-fraud-order-1'
    };
    const itemsPayload = [{ product_id: 'sku-apple', quantity: 1, price_at_purchase: 8500 }];

    const orderRes = await client.query('SELECT public.create_order_atomic($1, $2, NULL) AS result;', [
      JSON.stringify(orderPayload),
      JSON.stringify(itemsPayload)
    ]);
    const orderId = orderRes.rows[0].result.order_id;

    // Attacker sends transaction claiming approval, but paid only 1,000 COP (100,000 cents) instead of 8,500 COP
    const txPayload = {
      id: 'tx_fraud_amount',
      reference: orderId,
      status: 'APPROVED',
      amount_in_cents: 100000, // 1,000 COP
      currency: 'COP'
    };

    await assert.rejects(
      client.query("SELECT public.process_wompi_transaction('evt_fraud_1', $1);", [JSON.stringify(txPayload)]),
      /PAYMENT_AMOUNT_MISMATCH/,
      'Underpaid transaction must be rejected by database state invariant'
    );

    // Verify order was NOT marked as approved
    const orderCheck = await client.query('SELECT payment_status FROM public.orders WHERE id = $1;', [orderId]);
    assert.equal(orderCheck.rows[0].payment_status, 'pending');
  } finally {
    client.release();
  }
});

test('PAY-STATE: Incoming APPROVED event for an already Cancelled order produces error without reopening', async () => {
  const client = await pool.connect();
  try {
    const orderPayload = {
      clerk_user_id: 'user_cancel_test',
      total_amount: 8500,
      customer_name: 'Cancel Test',
      status: 'Cancelado',
      idempotency_key: 'key-cancelled-order-1'
    };
    const itemsPayload = [{ product_id: 'sku-apple', quantity: 1, price_at_purchase: 8500 }];

    const orderRes = await client.query('SELECT public.create_order_atomic($1, $2, NULL) AS result;', [
      JSON.stringify(orderPayload),
      JSON.stringify(itemsPayload)
    ]);
    const orderId = orderRes.rows[0].result.order_id;

    const txPayload = {
      id: 'tx_cancel_late_approval',
      reference: orderId,
      status: 'APPROVED',
      amount_in_cents: 850000,
      currency: 'COP'
    };

    const res = await client.query("SELECT public.process_wompi_transaction('evt_cancel_1', $1) AS result;", [
      JSON.stringify(txPayload)
    ]);

    assert.equal(res.rows[0].result.success, false);
    assert.equal(res.rows[0].result.error, 'ORDER_ALREADY_CANCELLED');

    // Confirm status remained Cancelado
    const check = await client.query('SELECT status, payment_status FROM public.orders WHERE id = $1;', [orderId]);
    assert.equal(check.rows[0].status, 'Cancelado');
    assert.equal(check.rows[0].payment_status, 'pending');
  } finally {
    client.release();
  }
});

// ============================================================================
// GATE MIG-SAFE: NON-DESTRUCTIVE MIGRATION & RECOVERY REHEARSAL
// ============================================================================

test('MIG-SAFE: Repeated migration execution against active financial records preserves 100% of data (Zero Data Loss)', async () => {
  const client = await pool.connect();
  try {
    // 1. Snapshot counts of pre-existing records
    const ordersBefore = await client.query('SELECT count(*) FROM public.orders;');
    const movementsBefore = await client.query('SELECT count(*) FROM public.inventory_movements;');
    const receiptsBefore = await client.query('SELECT count(*) FROM public.wompi_event_receipts;');
    const balancesBefore = await client.query('SELECT user_id, credit_balance FROM public.b2b_credit_profiles ORDER BY user_id;');

    const nOrders = parseInt(ordersBefore.rows[0].count, 10);
    const nMovements = parseInt(movementsBefore.rows[0].count, 10);
    assert.ok(nOrders > 0, 'Orders exist prior to migration replay');
    assert.ok(nMovements > 0, 'Inventory movements exist prior to migration replay');

    // 2. Re-execute the candidate migration script SQL
    const migrationSqlPath = path.resolve(__dirname, '../supabase/migrations/20261027_lg_prod_r1_rls_policies.sql');
    const migrationSql = fs.readFileSync(migrationSqlPath, 'utf8');

    // Run migration again against active database
    await client.query(migrationSql);

    // 3. Verify zero records destroyed
    const ordersAfter = await client.query('SELECT count(*) FROM public.orders;');
    const movementsAfter = await client.query('SELECT count(*) FROM public.inventory_movements;');
    const receiptsAfter = await client.query('SELECT count(*) FROM public.wompi_event_receipts;');
    const balancesAfter = await client.query('SELECT user_id, credit_balance FROM public.b2b_credit_profiles ORDER BY user_id;');

    assert.equal(parseInt(ordersAfter.rows[0].count, 10), nOrders, 'Zero orders lost during migration');
    assert.equal(parseInt(movementsAfter.rows[0].count, 10), nMovements, 'Zero inventory movements lost during migration');
    assert.equal(parseInt(receiptsAfter.rows[0].count, 10), parseInt(receiptsBefore.rows[0].count, 10), 'Zero receipts lost during migration');
    assert.deepEqual(balancesAfter.rows, balancesBefore.rows, 'All customer balances strictly preserved');
  } finally {
    client.release();
  }
});

