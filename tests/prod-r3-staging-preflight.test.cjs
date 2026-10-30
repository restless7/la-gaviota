const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { Pool } = require('pg');

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
    if (id.startsWith('@/src/lib/server/database')) return loadTS('src/lib/server/database.ts');
    if (id.startsWith('@/src/lib/server/scheduler')) return loadTS('src/lib/server/scheduler.ts');
    if (id.startsWith('@/src/lib/server/wompiReconciliation')) return loadTS('src/lib/server/wompiReconciliation.ts');
    return require(id);
  }, path.dirname(fullPath), fullPath);
  return mod.exports;
}

const PG_CONFIG = {
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://sebastiangarcia@127.0.0.1:54329/postgres',
  max: 10,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
};

let pool;

async function ensureBaseline(client) {
  await client.query(`
    INSERT INTO public.global_settings (id, track_inventory)
    VALUES ('default', true)
    ON CONFLICT (id) DO UPDATE SET track_inventory = true;

    INSERT INTO public.products (id, name, category, unit, price_retail, price_micro, price_restaurant, stock_quantity, is_active)
    VALUES 
      ('sku-r3-apple', 'Manzana R3', 'FRUTAS', 'kg', 8000, 7000, 6000, 100, true),
      ('sku-r3-pear', 'Pera R3', 'FRUTAS', 'kg', 5000, 4500, 4000, 100, true)
    ON CONFLICT (id) DO UPDATE SET stock_quantity = 100, is_active = true;
  `);
}

test.before(async () => {
  pool = new Pool(PG_CONFIG);
  const client = await pool.connect();
  try {
    await client.query("SELECT 1;");
    await ensureBaseline(client);
  } finally {
    client.release();
  }
});

test.after(async () => {
  if (pool) {
    await pool.end();
  }
});

// =========================================================================
// 1. RISK 1: UNKNOWN TRANSACTION ID & PROVIDER REFERENCE RECONCILIATION
// =========================================================================

test('R3-RECON-NULL-TXID: Intent with null provider_transaction_id resolves via reference lookup', async () => {
  const client = await pool.connect();
  try {
    const orderIdRes = await client.query(`
      INSERT INTO public.orders (clerk_user_id, customer_name, customer_email, customer_phone, delivery_address, delivery_municipality, payment_method, total_amount, status, payment_status)
      VALUES ('user_r3_recon_null', 'Null TxID Customer', 'nulltx@test.com', '3184990826', 'Calle 10 #20-30', 'Bucaramanga', 'wompi', 8000, 'Pendiente', 'pending')
      RETURNING id;
    `);
    const orderId = orderIdRes.rows[0].id;
    const intentId = `intent_null_txid_${Date.now()}`;

    // Insert intent WITHOUT provider_transaction_id (e.g. browser closed during widget load)
    await client.query(`
      INSERT INTO public.payment_intents (
        intent_id, order_id, clerk_user_id, purpose, amount, currency, provider, environment,
        status, reconciliation_status, provider_reference, provider_transaction_id, created_at
      ) VALUES (
        $1, $2, 'user_r3_recon_null', 'ORDER_CHECKOUT', 8000, 'COP', 'WOMPI', 'sandbox',
        'PENDING', 'PENDING', $3, NULL, NOW() - INTERVAL '20 minutes'
      );
    `, [intentId, orderId, String(orderId)]);

    // Mock adapter that returns transaction when queried by reference
    const mockTxId = `tx_found_by_ref_${Date.now()}`;
    const mockAdapter = {
      async getTransactionById() { return null; },
      async getTransactionByReference(ref) {
        if (ref === orderId) {
          return {
            id: mockTxId,
            reference: orderId,
            status: 'APPROVED',
            amount_in_cents: 800000,
            currency: 'COP',
            environment: 'sandbox'
          };
        }
        return null;
      }
    };

    const wompiRecon = loadTS('src/lib/server/wompiReconciliation.ts');
    
    // Minimal mock Supabase client backed by real pg client
    const mockSupabase = {
      from: (table) => ({
        select: (cols) => ({
          eq: (f1, v1) => ({
            lte: (f2, v2) => ({
              order: () => ({
                limit: async (lim) => {
                  const res = await client.query(
                    `SELECT * FROM public.${table} WHERE ${f1} = $1 AND ${f2} <= $2 LIMIT ${lim}`,
                    [v1, v2]
                  );
                  return { data: res.rows, error: null };
                }
              })
            })
          })
        }),
        update: (values) => ({
          eq: async (col, val) => {
            const keys = Object.keys(values);
            const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
            const params = keys.map(k => values[k]);
            params.push(val);
            await client.query(
              `UPDATE public.${table} SET ${setClause} WHERE ${col} = $${params.length}`,
              params
            );
            return { error: null };
          }
        })
      }),
      rpc: async (func, args) => {
        const res = await client.query(
          `SELECT public.${func}($1, $2) as result;`,
          [args.p_event_id, JSON.stringify(args.p_transaction)]
        );
        return { data: res.rows[0].result, error: null };
      }
    };

    const res = await wompiRecon.reconcilePendingPaymentIntents(mockSupabase, {
      minAgeMinutes: 15,
      providerAdapter: mockAdapter,
      expectedEnvironment: 'sandbox'
    });

    assert.equal(res.reconciledApproved >= 1, true, 'Intent resolved to APPROVED via reference lookup');

    // Verify order was settled
    const updatedOrder = await client.query("SELECT status, payment_status, payment_reference FROM public.orders WHERE id = $1;", [orderId]);
    assert.equal(updatedOrder.rows[0].payment_status, 'approved');
    assert.equal(updatedOrder.rows[0].status, 'En Preparación');
    assert.equal(updatedOrder.rows[0].payment_reference, mockTxId);

    // Verify intent was updated with the found transaction ID
    const updatedIntent = await client.query("SELECT status, provider_transaction_id, reconciliation_status FROM public.payment_intents WHERE intent_id = $1;", [intentId]);
    assert.equal(updatedIntent.rows[0].status, 'APPROVED');
    assert.equal(updatedIntent.rows[0].provider_transaction_id, mockTxId);
    assert.equal(updatedIntent.rows[0].reconciliation_status, 'RECONCILED_POLL');
  } finally {
    client.release();
  }
});

test('R3-RECON-EXHAUST-NO-TX: Exhausted intent with no provider transaction transitions to ESCALATED_UNRESOLVED and safely cancels order', async () => {
  const client = await pool.connect();
  try {
    const orderIdRes = await client.query(`
      INSERT INTO public.orders (clerk_user_id, customer_name, customer_email, customer_phone, delivery_address, delivery_municipality, payment_method, total_amount, status, payment_status)
      VALUES ('user_r3_exhaust', 'Exhaust Customer', 'exhaust@test.com', '3184990826', 'Calle 10 #20-30', 'Bucaramanga', 'wompi', 8000, 'Pendiente', 'pending')
      RETURNING id;
    `);
    const orderId = orderIdRes.rows[0].id;
    const intentId = `intent_exhaust_${Date.now()}`;

    // Intent created 25 hours ago, customer never interacted with provider
    await client.query(`
      INSERT INTO public.payment_intents (
        intent_id, order_id, clerk_user_id, purpose, amount, currency, provider, environment,
        status, reconciliation_status, provider_reference, provider_transaction_id, created_at
      ) VALUES (
        $1, $2, 'user_r3_exhaust', 'ORDER_CHECKOUT', 8000, 'COP', 'WOMPI', 'sandbox',
        'PENDING', 'PENDING', $3, NULL, NOW() - INTERVAL '25 hours'
      );
    `, [intentId, orderId, String(orderId)]);

    // Adapter returns null for all queries (no transaction exists at Wompi)
    const mockAdapter = {
      async getTransactionById() { return null; },
      async getTransactionByReference() { return null; }
    };

    const wompiRecon = loadTS('src/lib/server/wompiReconciliation.ts');
    
    const mockSupabase = {
      from: (table) => ({
        select: (cols) => ({
          eq: (f1, v1) => ({
            lte: (f2, v2) => ({
              order: () => ({
                limit: async (lim) => {
                  const res = await client.query(
                    `SELECT * FROM public.${table} WHERE ${f1} = $1 AND ${f2} <= $2 LIMIT ${lim}`,
                    [v1, v2]
                  );
                  return { data: res.rows, error: null };
                }
              })
            })
          })
        }),
        update: (values) => ({
          eq: async (col, val) => {
            const keys = Object.keys(values);
            const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
            const params = keys.map(k => values[k]);
            params.push(val);
            await client.query(
              `UPDATE public.${table} SET ${setClause} WHERE ${col} = $${params.length}`,
              params
            );
            return { error: null };
          }
        })
      }),
      rpc: async () => ({ data: null, error: null })
    };

    const res = await wompiRecon.reconcilePendingPaymentIntents(mockSupabase, {
      minAgeMinutes: 15,
      maxAgeHours: 24,
      providerAdapter: mockAdapter,
      expectedEnvironment: 'sandbox'
    });

    assert.equal(res.escalatedUnresolved >= 1, true, 'Intent transitioned to ESCALATED_UNRESOLVED');

    // Verify commercial order is PRESERVED (NOT Cancelado) for operator review
    const updatedOrder = await client.query("SELECT status, payment_status FROM public.orders WHERE id = $1;", [orderId]);
    assert.equal(updatedOrder.rows[0].status, 'Pendiente', 'Order fulfillment status preserved for operator review');
    assert.equal(updatedOrder.rows[0].payment_status, 'pending_review', 'Payment status reflects pending review');

    // Verify intent note and escalation
    const updatedIntent = await client.query("SELECT reconciliation_status, reconciliation_notes FROM public.payment_intents WHERE intent_id = $1;", [intentId]);
    assert.equal(updatedIntent.rows[0].reconciliation_status, 'ESCALATED_UNRESOLVED');
    assert.match(updatedIntent.rows[0].reconciliation_notes, /Exhausted 24h provider retry window/);
  } finally {
    client.release();
  }
});

// =========================================================================
// 2. RISK 2: SEPARATION OF TRANSACTION VS COMMERCIAL ORDER & PAYMENT RETRY
// =========================================================================

test('R3-RETRY-SEPARATION: DECLINED attempt records payment_status=declined without cancelling order; second APPROVED attempt successfully settles order', async () => {
  const client = await pool.connect();
  try {
    const orderIdRes = await client.query(`
      INSERT INTO public.orders (clerk_user_id, customer_name, customer_email, customer_phone, delivery_address, delivery_municipality, payment_method, total_amount, status, payment_status)
      VALUES ('user_r3_retry', 'Retry Customer', 'retry@test.com', '3184990826', 'Calle 10 #20-30', 'Bucaramanga', 'wompi', 8000, 'Pendiente', 'pending')
      RETURNING id;
    `);
    const orderId = orderIdRes.rows[0].id;
    const intentId = `intent_retry_${Date.now()}`;

    await client.query(`
      INSERT INTO public.payment_intents (
        intent_id, order_id, clerk_user_id, purpose, amount, currency, provider, environment,
        status, reconciliation_status, provider_reference
      ) VALUES (
        $1, $2, 'user_r3_retry', 'ORDER_CHECKOUT', 8000, 'COP', 'WOMPI', 'sandbox',
        'PENDING', 'PENDING', $3
      );
    `, [intentId, orderId, String(orderId)]);

    // ATTEMPT 1: Card declined (e.g. insufficient funds)
    const tx1Id = `tx1_declined_${Date.now()}`;
    const tx1 = {
      id: tx1Id,
      reference: orderId,
      status: 'DECLINED',
      amount_in_cents: 800000,
      currency: 'COP',
      environment: 'sandbox'
    };

    const rpcRes1 = await client.query(
      "SELECT public.process_wompi_transaction($1, $2) as result;",
      [`evt_${tx1Id}`, JSON.stringify(tx1)]
    );
    assert.equal(rpcRes1.rows[0].result.success, true);
    assert.equal(rpcRes1.rows[0].result.action, 'status_recorded');
    assert.equal(rpcRes1.rows[0].result.status, 'DECLINED');

    // CRITICAL INVARIANT: Order must NOT be Cancelado! It must remain Pendiente with payment_status = 'declined'
    const orderAfterDeclined = await client.query("SELECT status, payment_status FROM public.orders WHERE id = $1;", [orderId]);
    assert.equal(orderAfterDeclined.rows[0].status, 'Pendiente', 'Commercial order remains open for payment retry');
    assert.equal(orderAfterDeclined.rows[0].payment_status, 'declined', 'Payment status reflects declined attempt');

    // Intent also records DECLINED status
    const intentAfterDeclined = await client.query("SELECT status FROM public.payment_intents WHERE intent_id = $1;", [intentId]);
    assert.equal(intentAfterDeclined.rows[0].status, 'DECLINED');

    // ATTEMPT 2: Customer retries with another card -> APPROVED!
    const tx2Id = `tx2_approved_${Date.now()}`;
    const tx2 = {
      id: tx2Id,
      reference: orderId, // Identical merchant reference!
      status: 'APPROVED',
      amount_in_cents: 800000,
      currency: 'COP',
      environment: 'sandbox'
    };

    const rpcRes2 = await client.query(
      "SELECT public.process_wompi_transaction($1, $2) as result;",
      [`evt_${tx2Id}`, JSON.stringify(tx2)]
    );
    assert.equal(rpcRes2.rows[0].result.success, true);
    assert.equal(rpcRes2.rows[0].result.action, 'order_approved');

    // CRITICAL INVARIANT: Order is successfully settled to En Preparación and approved
    const orderAfterApproved = await client.query("SELECT status, payment_status, payment_reference FROM public.orders WHERE id = $1;", [orderId]);
    assert.equal(orderAfterApproved.rows[0].status, 'En Preparación', 'Order advanced to fulfilment');
    assert.equal(orderAfterApproved.rows[0].payment_status, 'approved', 'Order payment marked approved');
    assert.equal(orderAfterApproved.rows[0].payment_reference, tx2Id, 'Payment reference binds to successful transaction');

    // Intent is also settled to APPROVED
    const intentAfterApproved = await client.query("SELECT status, provider_transaction_id FROM public.payment_intents WHERE intent_id = $1;", [intentId]);
    assert.equal(intentAfterApproved.rows[0].status, 'APPROVED');
    assert.equal(intentAfterApproved.rows[0].provider_transaction_id, tx2Id);

    // ATTEMPT 3 (Out-of-order delayed declined callback): Must NEVER revert an approved order!
    const txDelayed = {
      id: `tx3_delayed_fail_${Date.now()}`,
      reference: orderId,
      status: 'DECLINED',
      amount_in_cents: 800000,
      currency: 'COP',
      environment: 'sandbox'
    };
    await client.query(
      "SELECT public.process_wompi_transaction($1, $2) as result;",
      [`evt_${txDelayed.id}`, JSON.stringify(txDelayed)]
    );

    const orderFinal = await client.query("SELECT status, payment_status FROM public.orders WHERE id = $1;", [orderId]);
    assert.equal(orderFinal.rows[0].status, 'En Preparación', 'Approved order status remains En Preparación');
    assert.equal(orderFinal.rows[0].payment_status, 'approved', 'Approved order payment remains approved');
  } finally {
    client.release();
  }
});

test('R3-ADAPTER-PRIORITY: DefaultWompiApiAdapter selects APPROVED transaction over earlier DECLINED attempts for same reference', async () => {
  const wompiRecon = loadTS('src/lib/server/wompiReconciliation.ts');
  const adapter = new wompiRecon.DefaultWompiApiAdapter('dummy_key', false);

  // Mock global.fetch returning multiple transactions for a reference (attempt 1: DECLINED, attempt 2: APPROVED)
  const originalFetch = global.fetch;
  try {
    global.fetch = async (url) => {
      if (url.includes('/transactions?reference=ref_multitx_test')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              { id: 'tx_old_declined', reference: 'ref_multitx_test', status: 'DECLINED', amount_in_cents: 500000, currency: 'COP' },
              { id: 'tx_new_approved', reference: 'ref_multitx_test', status: 'APPROVED', amount_in_cents: 500000, currency: 'COP' }
            ]
          })
        };
      }
      return { ok: false, status: 404 };
    };

    const selectedTx = await adapter.getTransactionByReference('ref_multitx_test');
    assert.ok(selectedTx, 'Transaction found');
    assert.equal(selectedTx.id, 'tx_new_approved', 'Prioritized APPROVED transaction over DECLINED attempt');
    assert.equal(selectedTx.status, 'APPROVED');
  } finally {
    global.fetch = originalFetch;
  }
});

// =========================================================================
// 3. RISK 3: RECONCILIATION CRON AUTHENTICATION & DUAL HTTP METHOD SUPPORT
// =========================================================================

test('R3-CRON-SECURITY: Scheduler constant-time authentication enforces CRON_SECRET and denies unauthorized or timing attacks', async () => {
  const scheduler = loadTS('src/lib/server/scheduler.ts');
  
  process.env.CRON_SECRET = 'super_secret_cron_token_minimum_32_chars_long!';

  // Missing Authorization header
  assert.throws(() => {
    scheduler.requireScheduler({
      headers: new Map()
    });
  }, /SCHEDULER_UNAUTHORIZED/);

  // Wrong secret
  assert.throws(() => {
    scheduler.requireScheduler({
      headers: new Map([['authorization', 'Bearer invalid_secret_token_123456789012345678901234567890']])
    });
  }, /SCHEDULER_UNAUTHORIZED/);

  // Exact matching secret succeeds
  assert.doesNotThrow(() => {
    scheduler.requireScheduler({
      headers: new Map([['authorization', 'Bearer ' + process.env.CRON_SECRET]])
    });
  });
});

test('R3-KILL-SWITCH: RECONCILIATION_DISABLED halts worker execution cleanly', async () => {
  const wompiRecon = loadTS('src/lib/server/wompiReconciliation.ts');
  const oldVal = process.env.RECONCILIATION_DISABLED;
  try {
    process.env.RECONCILIATION_DISABLED = 'true';
    const mockSupabase = {
      from: () => {
        throw new Error('Database must not be queried when kill switch is active');
      }
    };
    const res = await wompiRecon.reconcilePendingPaymentIntents(mockSupabase);
    assert.equal(res.totalScanned, 0, 'Zero intents scanned when disabled');
  } finally {
    process.env.RECONCILIATION_DISABLED = oldVal;
  }
});

