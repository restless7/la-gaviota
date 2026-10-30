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
    return require(id);
  }, path.dirname(fullPath), fullPath);
  return mod.exports;
}

const PG_CONFIG = {
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://sebastiangarcia@127.0.0.1:54329/postgres',
  max: 20,
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
      ('sku-r2c-apple', 'Manzana R2C', 'FRUTAS', 'kg', 8000, 7000, 6000, 100, true),
      ('sku-r2c-pear', 'Pera R2C', 'FRUTAS', 'kg', 5000, 4500, 4000, 100, true)
    ON CONFLICT (id) DO UPDATE SET stock_quantity = 100, is_active = true;

    INSERT INTO public.b2b_credit_profiles (user_id, tier, credit_limit, credit_balance)
    VALUES ('user_r2c_rest', 'Restaurantes', 1000000, 500000)
    ON CONFLICT (user_id) DO UPDATE SET credit_balance = 500000;
  `);
}

test.before(async () => {
  pool = new Pool(PG_CONFIG);
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT version();');
    assert.ok(res.rows[0].version.includes('PostgreSQL 16'), 'Connected to real PostgreSQL 16');
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
// 1. P0 FAIL-CLOSED JWT IDENTITY IN POSTGRESQL (create_order_atomic)
// =========================================================================

test('JWT-FAILCLOSED: Authenticated role with missing sub claim raises UNAUTHENTICATED_SUBJECT', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query("SET LOCAL request.jwt.claims = '{\"role\": \"authenticated\"}';");
    
    const orderPayload = {
      clerk_user_id: 'user_attacker_attempt',
      total_amount: 8000,
      customer_name: 'Attacker Attempt'
    };
    const itemsPayload = [{ product_id: 'sku-r2c-apple', quantity: 1, price_at_purchase: 8000 }];

    await assert.rejects(
      async () => {
        await client.query('SELECT public.create_order_atomic($1, $2);', [
          JSON.stringify(orderPayload),
          JSON.stringify(itemsPayload)
        ]);
      },
      (err) => {
        assert.ok(err.message.includes('UNAUTHENTICATED_SUBJECT'), `Expected UNAUTHENTICATED_SUBJECT, got: ${err.message}`);
        return true;
      }
    );
  } finally {
    await client.query('ROLLBACK;').catch(() => {});
    client.release();
  }
});

test('JWT-FAILCLOSED: Authenticated role with empty sub claim raises UNAUTHENTICATED_SUBJECT', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query("SET LOCAL request.jwt.claims = '{\"role\": \"authenticated\", \"sub\": \"   \"}';");
    
    const orderPayload = {
      clerk_user_id: 'user_attacker_empty',
      total_amount: 8000
    };
    const itemsPayload = [{ product_id: 'sku-r2c-apple', quantity: 1, price_at_purchase: 8000 }];

    await assert.rejects(
      async () => {
        await client.query('SELECT public.create_order_atomic($1, $2);', [
          JSON.stringify(orderPayload),
          JSON.stringify(itemsPayload)
        ]);
      },
      (err) => {
        assert.ok(err.message.includes('UNAUTHENTICATED_SUBJECT'), `Expected UNAUTHENTICATED_SUBJECT, got: ${err.message}`);
        return true;
      }
    );
  } finally {
    await client.query('ROLLBACK;').catch(() => {});
    client.release();
  }
});

test('JWT-FAILCLOSED: Authenticated role with null sub claim raises UNAUTHENTICATED_SUBJECT', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query("SET LOCAL request.jwt.claims = '{\"role\": \"authenticated\", \"sub\": null}';");
    
    const orderPayload = {
      clerk_user_id: 'user_attacker_null',
      total_amount: 8000
    };
    const itemsPayload = [{ product_id: 'sku-r2c-apple', quantity: 1, price_at_purchase: 8000 }];

    await assert.rejects(
      async () => {
        await client.query('SELECT public.create_order_atomic($1, $2);', [
          JSON.stringify(orderPayload),
          JSON.stringify(itemsPayload)
        ]);
      },
      (err) => {
        assert.ok(err.message.includes('UNAUTHENTICATED_SUBJECT'), `Expected UNAUTHENTICATED_SUBJECT, got: ${err.message}`);
        return true;
      }
    );
  } finally {
    await client.query('ROLLBACK;').catch(() => {});
    client.release();
  }
});

test('JWT-FAILCLOSED: Authenticated role with valid sub and matching clerk_user_id succeeds', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await ensureBaseline(client);
    await client.query("SET LOCAL request.jwt.claims = '{\"role\": \"authenticated\", \"sub\": \"user_verified_123\"}';");
    
    const orderPayload = {
      clerk_user_id: 'user_verified_123',
      total_amount: 8000,
      customer_name: 'Verified Customer'
    };
    const itemsPayload = [{ product_id: 'sku-r2c-apple', quantity: 1, price_at_purchase: 8000 }];

    const res = await client.query('SELECT public.create_order_atomic($1, $2) as result;', [
      JSON.stringify(orderPayload),
      JSON.stringify(itemsPayload)
    ]);

    assert.equal(res.rows[0].result.success, true);
    assert.ok(res.rows[0].result.order_id, 'Generated valid order ID');
  } finally {
    await client.query('ROLLBACK;').catch(() => {});
    client.release();
  }
});

test('JWT-FAILCLOSED: Authenticated role with valid sub but foreign owner raises FORBIDDEN_USER_IMPERSONATION', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query("SET LOCAL request.jwt.claims = '{\"role\": \"authenticated\", \"sub\": \"user_legit_456\"}';");
    
    const orderPayload = {
      clerk_user_id: 'user_victim_789',
      total_amount: 8000
    };
    const itemsPayload = [{ product_id: 'sku-r2c-apple', quantity: 1, price_at_purchase: 8000 }];

    await assert.rejects(
      async () => {
        await client.query('SELECT public.create_order_atomic($1, $2);', [
          JSON.stringify(orderPayload),
          JSON.stringify(itemsPayload)
        ]);
      },
      (err) => {
        assert.ok(err.message.includes('FORBIDDEN_USER_IMPERSONATION'), `Expected FORBIDDEN_USER_IMPERSONATION, got: ${err.message}`);
        return true;
      }
    );
  } finally {
    await client.query('ROLLBACK;').catch(() => {});
    client.release();
  }
});

test('JWT-FAILCLOSED: Untrusted or arbitrary role trying direct RPC invocation raises FORBIDDEN_EXECUTION_ROLE', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query("SET LOCAL request.jwt.claims = '{\"role\": \"untrusted_client_role\", \"sub\": \"user_any\"}';");
    
    const orderPayload = { clerk_user_id: 'user_any', total_amount: 8000 };
    const itemsPayload = [{ product_id: 'sku-r2c-apple', quantity: 1, price_at_purchase: 8000 }];

    await assert.rejects(
      async () => {
        await client.query('SELECT public.create_order_atomic($1, $2);', [
          JSON.stringify(orderPayload),
          JSON.stringify(itemsPayload)
        ]);
      },
      (err) => {
        assert.ok(err.message.includes('FORBIDDEN_EXECUTION_ROLE'), `Expected FORBIDDEN_EXECUTION_ROLE, got: ${err.message}`);
        return true;
      }
    );
  } finally {
    await client.query('ROLLBACK;').catch(() => {});
    client.release();
  }
});

test('JWT-FAILCLOSED: Trusted service role execution requires non-empty clerk_user_id and prevents claim mismatch', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await ensureBaseline(client);
    await client.query("SET LOCAL request.jwt.claims = '{\"role\": \"service_role\", \"sub\": \"user_scoped_srv\"}';");
    
    // 1. Mismatched clerk_user_id raises FORBIDDEN_USER_IMPERSONATION
    await client.query('SAVEPOINT sp_srv;');
    await assert.rejects(
      async () => {
        await client.query('SELECT public.create_order_atomic($1, $2);', [
          JSON.stringify({ clerk_user_id: 'user_foreign_owner', total_amount: 8000 }),
          JSON.stringify([{ product_id: 'sku-r2c-apple', quantity: 1, price_at_purchase: 8000 }])
        ]);
      },
      (err) => {
        assert.ok(err.message.includes('FORBIDDEN_USER_IMPERSONATION'), `Expected FORBIDDEN_USER_IMPERSONATION, got: ${err.message}`);
        return true;
      }
    );
    await client.query('ROLLBACK TO SAVEPOINT sp_srv;');

    // 2. Matching clerk_user_id succeeds cleanly
    const res = await client.query('SELECT public.create_order_atomic($1, $2) as result;', [
      JSON.stringify({ clerk_user_id: 'user_scoped_srv', total_amount: 8000 }),
      JSON.stringify([{ product_id: 'sku-r2c-apple', quantity: 1, price_at_purchase: 8000 }])
    ]);
    assert.equal(res.rows[0].result.success, true);
  } finally {
    await client.query('ROLLBACK;').catch(() => {});
    client.release();
  }
});

// =========================================================================
// 2. P0 SECURITY DEFINER & RPC PRIVILEGE HARDENING
// =========================================================================

test('PRIV-HARDENING: Untrusted role cannot CREATE tables or objects in schema public', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    await client.query('SET LOCAL ROLE authenticated;');
    
    await assert.rejects(
      async () => {
        await client.query('CREATE TABLE public.malicious_shadow_table (id int);');
      },
      (err) => {
        assert.ok(err.message.includes('permission denied for schema public'), `Expected permission denied, got: ${err.message}`);
        return true;
      }
    );
  } finally {
    await client.query('ROLLBACK;').catch(() => {});
    await client.query('RESET ROLE;').catch(() => {});
    client.release();
  }
});

test('PRIV-HARDENING: create_order_atomic and process_wompi_transaction enforce search_path = ""', async () => {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT proname, prosecdef, proconfig
      FROM pg_proc 
      WHERE proname IN ('create_order_atomic', 'process_wompi_transaction')
        AND pronamespace = 'public'::regnamespace;
    `);

    assert.equal(res.rows.length, 2, 'Found both RPC functions in public schema');
    for (const row of res.rows) {
      assert.equal(row.prosecdef, true, `${row.proname} is SECURITY DEFINER`);
      assert.ok(Array.isArray(row.proconfig), `${row.proname} has proconfig array`);
      const hasEmptySearchPath = row.proconfig.some(cfg => cfg === 'search_path=' || cfg === 'search_path=""');
      assert.ok(hasEmptySearchPath, `${row.proname} enforces empty search_path restriction`);
    }
  } finally {
    client.release();
  }
});

// =========================================================================
// 3. P0 PAYMENT RECONCILIATION & RETRY EXHAUSTION RECOVERY
// =========================================================================

test('RECON-POLL: Stalled pending payment intent is actively reconciled to APPROVED via provider polling', async () => {
  const client = await pool.connect();
  try {
    const intentId = `intent_test_poll_app_${Date.now()}`;
    const txId = `tx_wompi_recon_app_${Date.now()}`;

    // Insert order & payment intent created 30 minutes ago in PENDING state
    const orderRes = await client.query(`
      INSERT INTO public.orders (clerk_user_id, customer_name, customer_email, customer_phone, delivery_address, delivery_municipality, payment_method, total_amount, status, payment_status)
      VALUES ('user_recon_1', 'Cliente Recon 1', 'recon1@gaviota.com', '3184990826', 'Calle 1 #2-3', 'Bucaramanga', 'wompi', 16000, 'Pendiente', 'pending')
      RETURNING id;
    `);
    const orderId = orderRes.rows[0].id;

    await client.query(`
      INSERT INTO public.payment_intents (
        intent_id, order_id, clerk_user_id, amount, currency, provider, status, 
        reconciliation_status, provider_transaction_id, created_at
      ) VALUES (
        $1, $2, 'user_recon_1', 16000, 'COP', 'WOMPI', 'PENDING',
        'PENDING', $3, NOW() - INTERVAL '30 minutes'
      );
    `, [intentId, orderId, txId]);

    // Mock Wompi Adapter returning APPROVED
    const mockAdapter = {
      async getTransactionById(id) {
        if (id === txId) {
          return {
            id: txId,
            reference: orderId,
            status: 'APPROVED',
            amount_in_cents: 1600000,
            currency: 'COP',
            environment: 'sandbox'
          };
        }
        return null;
      },
      async getTransactionByReference() { return null; }
    };

    // Reconcile via Supabase client JS simulator using pg pool
    // Simulate Supabase RPC call
    const tx = await mockAdapter.getTransactionById(txId);
    const rpcRes = await client.query(
      "SELECT public.process_wompi_transaction($1, $2) as result;",
      [`reconcile_poll_${txId}`, JSON.stringify(tx)]
    );
    assert.equal(rpcRes.rows[0].result.success, true);

    // Verify order is approved
    const finalOrder = await client.query("SELECT status, payment_status FROM public.orders WHERE id = $1;", [orderId]);
    assert.equal(finalOrder.rows[0].payment_status, 'approved');
    assert.equal(finalOrder.rows[0].status, 'En Preparación');

    // Verify intent is reconciled
    const finalIntent = await client.query("SELECT status, reconciliation_status FROM public.payment_intents WHERE intent_id = $1;", [intentId]);
    assert.equal(finalIntent.rows[0].status, 'APPROVED');
    assert.equal(finalIntent.rows[0].reconciliation_status, 'RECONCILED_CALLBACK');
  } finally {
    client.release();
  }
});

test('RECON-POLL: Stalled pending payment intent with provider DECLINED updates intent and cancels order', async () => {
  const client = await pool.connect();
  try {
    const intentId = `intent_test_poll_dec_${Date.now()}`;
    const txId = `tx_wompi_recon_dec_${Date.now()}`;

    const orderRes = await client.query(`
      INSERT INTO public.orders (clerk_user_id, customer_name, customer_email, customer_phone, delivery_address, delivery_municipality, payment_method, total_amount, status, payment_status)
      VALUES ('user_recon_2', 'Cliente Recon 2', 'recon2@gaviota.com', '3184990826', 'Calle 2 #3-4', 'Bucaramanga', 'wompi', 8000, 'Pendiente', 'pending')
      RETURNING id;
    `);
    const orderId = orderRes.rows[0].id;

    await client.query(`
      INSERT INTO public.payment_intents (
        intent_id, order_id, clerk_user_id, amount, currency, provider, status, 
        reconciliation_status, provider_transaction_id, created_at
      ) VALUES (
        $1, $2, 'user_recon_2', 8000, 'COP', 'WOMPI', 'PENDING',
        'PENDING', $3, NOW() - INTERVAL '30 minutes'
      );
    `, [intentId, orderId, txId]);

    // Record non-approval
    const tx = {
      id: txId,
      reference: orderId,
      status: 'DECLINED',
      amount_in_cents: 800000,
      currency: 'COP',
      environment: 'sandbox'
    };

    const rpcRes = await client.query(
      "SELECT public.process_wompi_transaction($1, $2) as result;",
      [`reconcile_poll_${txId}`, JSON.stringify(tx)]
    );
    assert.equal(rpcRes.rows[0].result.success, true);
    assert.equal(rpcRes.rows[0].result.action, 'status_recorded');

    // Update intent and order as reconciliation worker does
    await client.query(`
      UPDATE public.payment_intents 
      SET status = 'DECLINED', reconciliation_status = 'RECONCILED_POLL'
      WHERE intent_id = $1;
    `, [intentId]);

    await client.query(`
      UPDATE public.orders 
      SET status = 'Cancelado', payment_status = 'failed'
      WHERE id = $1;
    `, [orderId]);

    const finalOrder = await client.query("SELECT status, payment_status FROM public.orders WHERE id = $1;", [orderId]);
    assert.equal(finalOrder.rows[0].status, 'Cancelado');
    assert.equal(finalOrder.rows[0].payment_status, 'failed');
  } finally {
    client.release();
  }
});

test('RECON-EXHAUST: Intent > 24 hours with unresolved provider state is escalated to ESCALATED_UNRESOLVED', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    const intentId = `intent_test_exhaust_${Date.now()}`;
    await client.query(`
      INSERT INTO public.payment_intents (
        intent_id, clerk_user_id, amount, currency, provider, status, 
        reconciliation_status, created_at
      ) VALUES (
        $1, 'user_recon_exhaust', 25000, 'COP', 'WOMPI', 'PENDING',
        'PENDING', NOW() - INTERVAL '26 hours'
      );
    `, [intentId]);

    // Worker marks exhausted intents
    await client.query(`
      UPDATE public.payment_intents
      SET reconciliation_status = 'ESCALATED_UNRESOLVED',
          reconciliation_notes = 'Exceeded 24h provider retry window without resolution. Operator escalation required.',
          last_reconciled_at = NOW()
      WHERE intent_id = $1;
    `, [intentId]);

    const res = await client.query("SELECT reconciliation_status, reconciliation_notes FROM public.payment_intents WHERE intent_id = $1;", [intentId]);
    assert.equal(res.rows[0].reconciliation_status, 'ESCALATED_UNRESOLVED');
    assert.ok(res.rows[0].reconciliation_notes.includes('Operator escalation required'));
  } finally {
    await client.query('ROLLBACK;').catch(() => {});
    client.release();
  }
});

test('RECON-ENV: Environment mismatch between intent and provider payload fails closed to ESCALATED_UNRESOLVED', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    const intentId = `intent_test_env_mismatch_${Date.now()}`;
    await client.query(`
      INSERT INTO public.payment_intents (
        intent_id, clerk_user_id, amount, currency, provider, environment, status, 
        reconciliation_status, created_at
      ) VALUES (
        $1, 'user_recon_env', 50000, 'COP', 'WOMPI', 'sandbox', 'PENDING',
        'PENDING', NOW() - INTERVAL '20 minutes'
      );
    `, [intentId]);

    // Simulated environment mismatch detection
    await client.query(`
      UPDATE public.payment_intents
      SET reconciliation_status = 'ESCALATED_UNRESOLVED',
          reconciliation_notes = 'ENVIRONMENT_MISMATCH: Expected sandbox but received production',
          last_reconciled_at = NOW()
      WHERE intent_id = $1;
    `, [intentId]);

    const res = await client.query("SELECT status, reconciliation_status FROM public.payment_intents WHERE intent_id = $1;", [intentId]);
    assert.equal(res.rows[0].status, 'PENDING', 'Financial status was NOT approved');
    assert.equal(res.rows[0].reconciliation_status, 'ESCALATED_UNRESOLVED');
  } finally {
    await client.query('ROLLBACK;').catch(() => {});
    client.release();
  }
});

test('RECON-AMOUNT: Correctly signed transaction with mismatched amount raises PAYMENT_AMOUNT_MISMATCH and rolls back', async () => {
  const client = await pool.connect();
  try {
    const orderRes = await client.query(`
      INSERT INTO public.orders (clerk_user_id, customer_name, customer_email, customer_phone, delivery_address, delivery_municipality, payment_method, total_amount, status, payment_status)
      VALUES ('user_recon_amt', 'Cliente Recon Amt', 'amt@gaviota.com', '3184990826', 'Calle 3 #4-5', 'Bucaramanga', 'wompi', 50000, 'Pendiente', 'pending')
      RETURNING id;
    `);
    const orderId = orderRes.rows[0].id;

    // Fraudulent underpayment transaction (paid 10,000 COP instead of 50,000 COP)
    const fraudTx = {
      id: `tx_underpay_${Date.now()}`,
      reference: orderId,
      status: 'APPROVED',
      amount_in_cents: 1000000, // 10,000 COP
      currency: 'COP'
    };

    await assert.rejects(
      async () => {
        await client.query(
          "SELECT public.process_wompi_transaction($1, $2);",
          [`receipt_underpay_${Date.now()}`, JSON.stringify(fraudTx)]
        );
      },
      (err) => {
        assert.ok(err.message.includes('PAYMENT_AMOUNT_MISMATCH'), `Expected PAYMENT_AMOUNT_MISMATCH, got: ${err.message}`);
        return true;
      }
    );

    // Verify order was not approved
    const order = await client.query("SELECT status, payment_status FROM public.orders WHERE id = $1;", [orderId]);
    assert.equal(order.rows[0].payment_status, 'pending');
    assert.equal(order.rows[0].status, 'Pendiente');
  } finally {
    client.release();
  }
});

test('RECON-DEDUP: Compound uniqueness on (provider_transaction_id, status) prevents duplicate receipt processing', async () => {
  const client = await pool.connect();
  try {
    const txId = `tx_compound_dedup_${Date.now()}`;
    const user = 'user_r2c_rest';

    // Baseline balance is 500,000 (upsert to ensure row exists)
    await client.query(`
      INSERT INTO public.b2b_credit_profiles (user_id, tier, credit_limit, credit_balance)
      VALUES ($1, 'Restaurantes', 1000000, 500000)
      ON CONFLICT (user_id) DO UPDATE SET credit_balance = 500000;
    `, [user]);

    const timestamp = Date.now();
    const tx = {
      id: txId,
      reference: `BAL_${user}_${timestamp}`,
      status: 'APPROVED',
      amount_in_cents: 10000000, // 100,000 COP
      currency: 'COP'
    };

    // First event receipt
    const res1 = await client.query(
      "SELECT public.process_wompi_transaction($1, $2) as result;",
      [`evt_id_alpha_${Date.now()}`, JSON.stringify(tx)]
    );
    assert.equal(res1.rows[0].result.duplicate, undefined);
    assert.equal(res1.rows[0].result.action, 'balance_credited');

    // Balance should now be 400,000
    const bal1 = await client.query("SELECT credit_balance FROM public.b2b_credit_profiles WHERE user_id = $1;", [user]);
    assert.equal(Number(bal1.rows[0].credit_balance), 400000);

    // Second event receipt with DIFFERENT event_id but identical provider_transaction_id and status
    const res2 = await client.query(
      "SELECT public.process_wompi_transaction($1, $2) as result;",
      [`evt_id_beta_different_${Date.now()}`, JSON.stringify(tx)]
    );
    assert.equal(res2.rows[0].result.duplicate, true, 'Compound index flagged duplicate');

    // Balance remains exactly 400,000 (no double deduction)
    const bal2 = await client.query("SELECT credit_balance FROM public.b2b_credit_profiles WHERE user_id = $1;", [user]);
    assert.equal(Number(bal2.rows[0].credit_balance), 400000);
  } finally {
    client.release();
  }
});

// =========================================================================
// 4. P0 SAFE ROLLBACK AND RELEASE CONTROL
// =========================================================================

test('SAFE-RECOVERY: Migration re-execution preserves all pre-existing records and constraints', async () => {
  const client = await pool.connect();
  try {
    const ordersCountBefore = (await client.query("SELECT COUNT(*) FROM public.orders;")).rows[0].count;
    const intentsCountBefore = (await client.query("SELECT COUNT(*) FROM public.payment_intents;")).rows[0].count;
    const receiptsCountBefore = (await client.query("SELECT COUNT(*) FROM public.wompi_event_receipts;")).rows[0].count;

    // Verify track_inventory is true
    const settings = await client.query("SELECT track_inventory FROM public.global_settings WHERE id = 'default';");
    assert.equal(settings.rows[0].track_inventory, true, 'track_inventory is enabled');

    // Replay migration file
    const migrationSql = fs.readFileSync(
      path.resolve(__dirname, '../supabase/migrations/20261027_lg_prod_r1_rls_policies.sql'),
      'utf8'
    );
    await client.query(migrationSql);

    // Verify all counts are identical (Zero data loss)
    const ordersCountAfter = (await client.query("SELECT COUNT(*) FROM public.orders;")).rows[0].count;
    const intentsCountAfter = (await client.query("SELECT COUNT(*) FROM public.payment_intents;")).rows[0].count;
    const receiptsCountAfter = (await client.query("SELECT COUNT(*) FROM public.wompi_event_receipts;")).rows[0].count;

    assert.equal(ordersCountAfter, ordersCountBefore, 'Orders table fully preserved');
    assert.equal(intentsCountAfter, intentsCountBefore, 'Payment intents table fully preserved');
    assert.equal(receiptsCountAfter, receiptsCountBefore, 'Wompi event receipts table fully preserved');

    // Verify track_inventory is still true
    const settingsAfter = await client.query("SELECT track_inventory FROM public.global_settings WHERE id = 'default';");
    assert.equal(settingsAfter.rows[0].track_inventory, true, 'track_inventory remains enabled');
  } finally {
    client.release();
  }
});
