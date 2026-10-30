const test = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');

const PG_CONFIG = {
  connectionString: process.env.TEST_DATABASE_URL || 'postgresql://sebastiangarcia@127.0.0.1:54329/postgres',
  max: 30, // Pool size sufficient for 20+ concurrent connections
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
};

let pool;

test.before(async () => {
  pool = new Pool(PG_CONFIG);
  const client = await pool.connect();
  try {
    // Verify connection and database version
    const res = await client.query('SELECT version();');
    assert.ok(res.rows[0].version.includes('PostgreSQL 16'), 'Connected to real PostgreSQL 16');

    // Clean and seed baseline test products
    await client.query(`
      DELETE FROM public.inventory_movements;
      DELETE FROM public.wompi_event_receipts;
      DELETE FROM public.payment_intents;
      DELETE FROM public.order_items;
      DELETE FROM public.orders;
      DELETE FROM public.products;
      DELETE FROM public.b2b_credit_profiles;

      INSERT INTO public.products (id, name, category, unit, price_retail, stock_quantity, is_active)
      VALUES 
        ('sku-apple', 'Manzana Royal Gala', 'FRUTAS', 'kg', 8500, 100, true),
        ('sku-banana', 'Plátano Maduro', 'PLATANOS', 'kg', 4000, 5, true),
        ('sku-orange', 'Naranja Valencia', 'CITRICOS', 'kg', 5000, 50, true),
        ('sku-inactive', 'Fruta Fuera de Temporada', 'FRUTAS', 'kg', 12000, 20, false);

      INSERT INTO public.b2b_credit_profiles (user_id, tier, credit_limit, credit_balance)
      VALUES 
        ('user_b2b_restaurant', 'Restaurantes', 2000000, 500000),
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

test('Real PostgreSQL 16: True Transactional Atomicity on Line Failure rolls back header and inventory', async () => {
  const client = await pool.connect();
  try {
    const invalidItems = [
      { product_id: 'sku-apple', product_name: 'Manzana', quantity: 2, price_at_purchase: 8500 },
      { product_id: 'sku-nonexistent', product_name: 'Fantasma', quantity: 1, price_at_purchase: 10000 }
    ];

    let errorCaught = false;
    try {
      await client.query(
        'SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3::jsonb)',
        [
          JSON.stringify({
            clerk_user_id: 'user_cust_fail',
            customer_name: 'Test Failure',
            customer_email: 'fail@test.com',
            customer_phone: '3001234567',
            delivery_address: 'Calle 10 #20-30',
            delivery_municipality: 'Bucaramanga',
            total_amount: 27000,
            idempotency_key: 'key-fail-atomic'
          }),
          JSON.stringify(invalidItems),
          null
        ]
      );
    } catch (err) {
      errorCaught = true;
      assert.ok(err.message.includes('PRODUCT_NOT_FOUND'), `Expected PRODUCT_NOT_FOUND, got: ${err.message}`);
    }

    assert.ok(errorCaught, 'create_order_atomic must raise an exception on missing product');

    // Verify Invariant: ZERO order headers created
    const ordersRes = await client.query("SELECT * FROM public.orders WHERE idempotency_key = 'key-fail-atomic'");
    assert.equal(ordersRes.rows.length, 0, 'No order header must exist in DB');

    // Verify Invariant: ZERO inventory movements created
    const movementsRes = await client.query("SELECT * FROM public.inventory_movements WHERE product_id = 'sku-apple'");
    assert.equal(movementsRes.rows.length, 0, 'No inventory movement must exist');

    // Verify Invariant: Stock untouched
    const stockRes = await client.query("SELECT stock_quantity FROM public.products WHERE id = 'sku-apple'");
    assert.equal(stockRes.rows[0].stock_quantity, 100, 'Stock of sku-apple must remain 100');
  } finally {
    client.release();
  }
});

test('Real PostgreSQL 16: Twenty concurrent identical checkout requests produce exactly 1 order (Durable Idempotency)', async () => {
  const idempotencyKey = 'key-concurrent-20-identical-' + Date.now();
  const orderPayload = {
    clerk_user_id: 'user_concurrent_identical',
    customer_name: 'Carlos Perez',
    customer_email: 'carlos@test.com',
    customer_phone: '3184990826',
    delivery_address: 'Carrera 15 #30-40',
    delivery_municipality: 'Bucaramanga',
    total_amount: 17000,
    idempotency_key: idempotencyKey
  };

  const items = [
    { product_id: 'sku-apple', product_name: 'Manzana Royal Gala', quantity: 2, price_at_purchase: 8500 }
  ];

  // Fire 20 genuine concurrent PostgreSQL connections
  const promises = Array.from({ length: 20 }, async () => {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3::jsonb)',
        [JSON.stringify(orderPayload), JSON.stringify(items), null]
      );
      return res.rows[0].create_order_atomic;
    } finally {
      client.release();
    }
  });

  const results = await Promise.all(promises);

  // All 20 returned success
  for (const r of results) {
    assert.equal(r.success, true);
    assert.ok(r.order_id);
  }

  // Exactly 1 order created, 19 duplicate retries
  const original = results.filter(r => r.duplicate === false);
  const duplicates = results.filter(r => r.duplicate === true);
  assert.equal(original.length, 1, 'Exactly one execution must create the initial order');
  assert.equal(duplicates.length, 19, 'Exactly nineteen executions must be recognized as idempotent duplicates');

  // Verify DB state directly
  const dbOrders = await pool.query('SELECT * FROM public.orders WHERE idempotency_key = $1', [idempotencyKey]);
  assert.equal(dbOrders.rows.length, 1, 'Database must have exactly 1 order row');

  // Stock must have decremented by exactly 2 (from 100 to 98), not 40!
  const stockRes = await pool.query("SELECT stock_quantity FROM public.products WHERE id = 'sku-apple'");
  assert.equal(stockRes.rows[0].stock_quantity, 98, 'Stock must only be decremented once by 2');
});

test('Real PostgreSQL 16: Twenty distinct concurrent checkouts racing for 5 units of stock cannot overdraw (Stock Invariant)', async () => {
  // Initial stock for sku-banana is 5
  const promises = Array.from({ length: 20 }, async (_, idx) => {
    const client = await pool.connect();
    try {
      const key = `key-banana-race-${idx}-${Date.now()}`;
      const res = await client.query(
        'SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3::jsonb)',
        [
          JSON.stringify({
            clerk_user_id: `user_competitor_${idx}`,
            customer_name: `Competitor ${idx}`,
            customer_email: `competitor${idx}@test.com`,
            customer_phone: '3184990826',
            delivery_address: 'Calle Real',
            delivery_municipality: 'Bucaramanga',
            total_amount: 4000,
            idempotency_key: key
          }),
          JSON.stringify([
            { product_id: 'sku-banana', product_name: 'Plátano Maduro', quantity: 1, price_at_purchase: 4000 }
          ]),
          null
        ]
      );
      return { success: true, data: res.rows[0].create_order_atomic };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      client.release();
    }
  });

  const results = await Promise.all(promises);

  const succeeded = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  assert.equal(succeeded.length, 5, 'Exactly 5 orders must succeed for 5 available stock items');
  assert.equal(failed.length, 15, 'Exactly 15 orders must fail closed with INSUFFICIENT_STOCK');

  for (const f of failed) {
    assert.ok(f.error.includes('INSUFFICIENT_STOCK'), `Error must be INSUFFICIENT_STOCK, got: ${f.error}`);
  }

  // Verify stock is exactly 0 in database, never negative
  const stockRes = await pool.query("SELECT stock_quantity FROM public.products WHERE id = 'sku-banana'");
  assert.equal(stockRes.rows[0].stock_quantity, 0, 'Final stock must be exactly 0');
});

test('Real PostgreSQL 16: Cross-customer idempotency key hijacking throws IDEMPOTENCY_OWNER_MISMATCH', async () => {
  const client = await pool.connect();
  try {
    const sharedKey = 'shared-key-cust-a-' + Date.now();

    // Customer A creates legitimate order
    await client.query(
      'SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3::jsonb)',
      [
        JSON.stringify({
          clerk_user_id: 'user_legitimate_a',
          customer_name: 'User A',
          customer_email: 'usera@test.com',
          customer_phone: '3184990826',
          delivery_address: 'Calle 10',
          delivery_municipality: 'Bucaramanga',
          total_amount: 5000,
          idempotency_key: sharedKey
        }),
        JSON.stringify([
          { product_id: 'sku-orange', product_name: 'Naranja', quantity: 1, price_at_purchase: 5000 }
        ]),
        null
      ]
    );

    // Customer B attempts to reuse Customer A's key
    await assert.rejects(
      async () => {
        await client.query(
          'SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3::jsonb)',
          [
            JSON.stringify({
              clerk_user_id: 'user_malicious_b',
              customer_name: 'User B',
              customer_email: 'userb@test.com',
              customer_phone: '3184990826',
              delivery_address: 'Calle 20',
              delivery_municipality: 'Bucaramanga',
              total_amount: 5000,
              idempotency_key: sharedKey
            }),
            JSON.stringify([
              { product_id: 'sku-orange', product_name: 'Naranja', quantity: 1, price_at_purchase: 5000 }
            ]),
            null
          ]
        );
      },
      /IDEMPOTENCY_OWNER_MISMATCH/,
      'Must reject cross-customer idempotency reuse'
    );
  } finally {
    client.release();
  }
});

test('Real PostgreSQL 16: Same customer key reuse with altered cart total throws IDEMPOTENCY_PAYLOAD_MISMATCH', async () => {
  const client = await pool.connect();
  try {
    const reuseKey = 'user-reuse-key-' + Date.now();

    // Order 1: Total 5,000 COP
    await client.query(
      'SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3::jsonb)',
      [
        JSON.stringify({
          clerk_user_id: 'user_same_owner',
          customer_name: 'Same Owner',
          customer_email: 'owner@test.com',
          customer_phone: '3184990826',
          delivery_address: 'Calle 10',
          delivery_municipality: 'Bucaramanga',
          total_amount: 5000,
          idempotency_key: reuseKey
        }),
        JSON.stringify([
          { product_id: 'sku-orange', product_name: 'Naranja', quantity: 1, price_at_purchase: 5000 }
        ]),
        null
      ]
    );

    // Order 2: Same customer, same key, but total 10,000 COP (different cart)
    await assert.rejects(
      async () => {
        await client.query(
          'SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3::jsonb)',
          [
            JSON.stringify({
              clerk_user_id: 'user_same_owner',
              customer_name: 'Same Owner',
              customer_email: 'owner@test.com',
              customer_phone: '3184990826',
              delivery_address: 'Calle 10',
              delivery_municipality: 'Bucaramanga',
              total_amount: 10000,
              idempotency_key: reuseKey
            }),
            JSON.stringify([
              { product_id: 'sku-orange', product_name: 'Naranja', quantity: 2, price_at_purchase: 5000 }
            ]),
            null
          ]
        );
      },
      /IDEMPOTENCY_PAYLOAD_MISMATCH/,
      'Must reject reusing key with materially different payload total'
    );
  } finally {
    client.release();
  }
});

test('Real PostgreSQL 16: Deterministic ascending row locking prevents deadlocks on overlapping SKU checkouts', async () => {
  // Order A locks [sku-apple, sku-orange]
  // Order B locks [sku-orange, sku-apple]
  // In un-sorted locking, these can cause PostgreSQL deadlock.
  // Our RPC sorts by product_id ASC ('sku-apple' then 'sku-orange'), guaranteeing zero deadlocks.
  const promises = [];
  for (let i = 0; i < 10; i++) {
    const isEven = i % 2 === 0;
    const items = isEven
      ? [
          { product_id: 'sku-apple', product_name: 'Manzana', quantity: 1, price_at_purchase: 8500 },
          { product_id: 'sku-orange', product_name: 'Naranja', quantity: 1, price_at_purchase: 5000 }
        ]
      : [
          { product_id: 'sku-orange', product_name: 'Naranja', quantity: 1, price_at_purchase: 5000 },
          { product_id: 'sku-apple', product_name: 'Manzana', quantity: 1, price_at_purchase: 8500 }
        ];

    promises.push(
      (async () => {
        const client = await pool.connect();
        try {
          const res = await client.query(
            'SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3::jsonb)',
            [
              JSON.stringify({
                clerk_user_id: `user_overlap_${i}`,
                customer_name: `Overlap ${i}`,
                customer_email: `overlap${i}@test.com`,
                customer_phone: '3184990826',
                delivery_address: 'Calle 10',
                delivery_municipality: 'Bucaramanga',
                total_amount: 13500,
                idempotency_key: `key-overlap-${i}-${Date.now()}`
              }),
              JSON.stringify(items),
              null
            ]
          );
          return res.rows[0].create_order_atomic;
        } finally {
          client.release();
        }
      })()
    );
  }

  const results = await Promise.all(promises);
  assert.equal(results.length, 10);
  for (const r of results) {
    assert.equal(r.success, true);
  }
});

test('Real PostgreSQL 16: Concurrent duplicate Wompi APPROVED callbacks deduct B2B balance exactly once', async () => {
  const reference = 'BAL_user_b2b_restaurant_' + Date.now();
  const txId = 'wompi_tx_' + Date.now();
  const eventId = 'wompi_evt_' + Date.now();
  const amountPaidCents = 10000000; // 100,000 COP

  // Current balance of user_b2b_restaurant is 500,000
  const initialBalanceRes = await pool.query(
    "SELECT credit_balance FROM public.b2b_credit_profiles WHERE user_id = 'user_b2b_restaurant'"
  );
  const initialBalance = Number(initialBalanceRes.rows[0].credit_balance);
  assert.equal(initialBalance, 500000);

  // Fire 10 concurrent webhook executions with the exact same transaction event
  const promises = Array.from({ length: 10 }, async () => {
    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT public.process_wompi_transaction($1, $2::jsonb)',
        [
          eventId,
          JSON.stringify({
            id: txId,
            reference: reference,
            status: 'APPROVED',
            amount_in_cents: amountPaidCents,
            currency: 'COP'
          })
        ]
      );
      return res.rows[0].process_wompi_transaction;
    } finally {
      client.release();
    }
  });

  const results = await Promise.all(promises);
  assert.equal(results.length, 10);

  // Exactly 1 execution performed balance_credited, 9 returned duplicate
  const credited = results.filter(r => r.action === 'balance_credited');
  const duplicates = results.filter(r => r.duplicate === true);

  assert.equal(credited.length, 1, 'Exactly one webhook delivery must credit balance');
  assert.equal(duplicates.length, 9, 'Nine concurrent replay deliveries must be detected as duplicates');

  // Verify balance in database: must be exactly 400,000 (500k - 100k), NOT -500k!
  const finalBalanceRes = await pool.query(
    "SELECT credit_balance FROM public.b2b_credit_profiles WHERE user_id = 'user_b2b_restaurant'"
  );
  const finalBalance = Number(finalBalanceRes.rows[0].credit_balance);
  assert.equal(finalBalance, 400000, 'Balance must be decremented by exactly 100,000 COP once');

  // Verify receipt recorded in wompi_event_receipts
  const receiptRes = await pool.query(
    'SELECT * FROM public.wompi_event_receipts WHERE event_id = $1',
    [eventId]
  );
  assert.equal(receiptRes.rows.length, 1, 'Exactly one receipt must be persisted');
});

test('Real PostgreSQL 16: Out-of-order delayed PENDING webhook never reverts an APPROVED order', async () => {
  const client = await pool.connect();
  try {
    const orderKey = 'order-wompi-pending-test-' + Date.now();
    // 1. Create order
    const orderRes = await client.query(
      'SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3::jsonb)',
      [
        JSON.stringify({
          clerk_user_id: 'user_cust_pending',
          customer_name: 'Pedro Gomez',
          customer_email: 'pedro@test.com',
          customer_phone: '3184990826',
          delivery_address: 'Calle 50',
          delivery_municipality: 'Bucaramanga',
          total_amount: 8500,
          payment_method: 'wompi',
          idempotency_key: orderKey
        }),
        JSON.stringify([
          { product_id: 'sku-apple', product_name: 'Manzana', quantity: 1, price_at_purchase: 8500 }
        ]),
        null
      ]
    );

    const orderId = orderRes.rows[0].create_order_atomic.order_id;
    const txId = 'tx_wompi_order_approve_' + Date.now();

    // 2. Webhook APPROVED arrives first
    await client.query(
      'SELECT public.process_wompi_transaction($1, $2::jsonb)',
      [
        'evt_approve_' + Date.now(),
        JSON.stringify({
          id: txId,
          reference: orderId,
          status: 'APPROVED',
          amount_in_cents: 850000,
          currency: 'COP'
        })
      ]
    );

    // Verify order is approved
    const approvedOrder = await client.query('SELECT status, payment_status FROM public.orders WHERE id = $1', [orderId]);
    assert.equal(approvedOrder.rows[0].payment_status, 'approved');
    assert.equal(approvedOrder.rows[0].status, 'En Preparación');

    // 3. Delayed PENDING webhook arrives later
    const delayedPendingRes = await client.query(
      'SELECT public.process_wompi_transaction($1, $2::jsonb)',
      [
        'evt_delayed_pending_' + Date.now(),
        JSON.stringify({
          id: txId,
          reference: orderId,
          status: 'PENDING',
          amount_in_cents: 850000,
          currency: 'COP'
        })
      ]
    );

    assert.equal(delayedPendingRes.rows[0].process_wompi_transaction.action, 'status_recorded');

    // Verify order remains approved
    const orderCheck = await client.query('SELECT status, payment_status FROM public.orders WHERE id = $1', [orderId]);
    assert.equal(orderCheck.rows[0].payment_status, 'approved', 'Payment status must never revert from approved to pending');
    assert.equal(orderCheck.rows[0].status, 'En Preparación', 'Order status must not revert');
  } finally {
    client.release();
  }
});

test('Real PostgreSQL 16: Unknown order transaction reference throws ORDER_NOT_FOUND', async () => {
  const client = await pool.connect();
  try {
    const unknownOrderUuid = 'a0000000-0000-0000-0000-000000000000';
    await assert.rejects(
      async () => {
        await client.query(
          'SELECT public.process_wompi_transaction($1, $2::jsonb)',
          [
            'evt_unknown_' + Date.now(),
            JSON.stringify({
              id: 'tx_unknown_' + Date.now(),
              reference: unknownOrderUuid,
              status: 'APPROVED',
              amount_in_cents: 500000,
              currency: 'COP'
            })
          ]
        );
      },
      /ORDER_NOT_FOUND/,
      'Must reject unknown order reference'
    );
  } finally {
    client.release();
  }
});

test('Real PostgreSQL 16: Zero or negative order item quantity raises INVALID_ITEM_QUANTITY', async () => {
  const client = await pool.connect();
  try {
    await assert.rejects(
      async () => {
        await client.query(
          'SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3::jsonb)',
          [
            JSON.stringify({
              clerk_user_id: 'user_qty_invalid',
              customer_name: 'Negative Quantity',
              customer_email: 'neg@test.com',
              customer_phone: '3184990826',
              delivery_address: 'Calle 10',
              delivery_municipality: 'Bucaramanga',
              total_amount: 10000,
              idempotency_key: 'key-neg-qty-' + Date.now()
            }),
            JSON.stringify([
              { product_id: 'sku-apple', product_name: 'Manzana', quantity: -3, price_at_purchase: 8500 }
            ]),
            null
          ]
        );
      },
      /INVALID_ITEM_QUANTITY/,
      'Must reject negative or zero item quantities'
    );
  } finally {
    client.release();
  }
});

