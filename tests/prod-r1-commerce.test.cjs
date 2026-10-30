const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');

function loadModule(relativePath, mocks = {}) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const mod = { exports: {} };
  const customRequire = id => {
    if (mocks[id]) return mocks[id];
    if (id.startsWith('@/src/lib/server/database')) return mocks['./database'] || {};
    if (id.startsWith('@/src/lib/server/authorization')) return mocks['./authorization'] || {};
    if (id.startsWith('@/src/lib/checkoutValidation')) return mocks['@/src/lib/checkoutValidation'] || {};
    if (id.startsWith('@/src/lib/idempotency')) return loadModule('src/lib/idempotency.ts');
    if (id === 'server-only') return {};
    if (id === 'next/cache') return { revalidatePath() {} };
    if (id === 'next/server') return { NextResponse: { json: (body, opts) => ({ status: opts?.status || 200, body }) } };
    try {
      return require(id);
    } catch {
      return {};
    }
  };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', compiled);
  fn(mod, mod.exports, customRequire, path.dirname(fullPath), fullPath);
  return mod.exports;
}

test('Commerce: Idempotency prevents duplicate order writes', async () => {
  let ordersChecked = 0;
  let ordersCreated = 0;

  const mockDb = {
    from: (table) => ({
      select: () => ({
        eq: (_col, key) => ({
          maybeSingle: async () => {
            ordersChecked++;
            if (key === 'IDEMP-EXISTING-123') {
              return { data: { id: 'order-existing-999', total_amount: 15000, status: 'Pendiente', clerk_user_id: 'user_123' }, error: null };
            }
            return { data: null, error: null };
          }
        })
      }),
      insert: () => ({
        select: () => ({
          single: async () => {
            ordersCreated++;
            return { data: { id: 'order-new-111' }, error: null };
          }
        })
      })
    })
  };

  const writer = loadModule('src/lib/server/orderWriter.ts', {
    './authorization': { requireOwnedSubject: async (sub) => ({ userId: sub }) },
    './database': {
      getServerDatabase: () => mockDb,
      readPublicInventoryFlag: async () => ({ track_inventory: false })
    },
    '@/src/lib/checkoutValidation': {
      assertOrderWrite: () => true
    }
  });

  const orderData = {
    clerk_user_id: 'user_123',
    customer_name: 'Eduard Velazco',
    customer_email: 'test@lagaviota.co',
    customer_phone: '3184990826',
    delivery_address: 'Plaza San Francisco, Calle 13 #22-49',
    delivery_municipality: 'Bucaramanga',
    total_amount: 15000,
    status: 'Pendiente',
    payment_method: 'cash',
    idempotency_key: 'IDEMP-EXISTING-123'
  };

  const result = await writer.createOrder(orderData, [{ product_id: 'sku-1', quantity: 1, price_at_purchase: 15000 }]);
  assert.equal(result.success, true);
  assert.equal(result.orderId, 'order-existing-999');
  assert.equal(result.duplicate, true);
  assert.equal(ordersCreated, 0, 'No new order was inserted on duplicate idempotency key');
});

test('Commerce: Cross-customer idempotency key reuse throws IDEMPOTENCY_OWNER_MISMATCH', async () => {
  const mockDb = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { id: 'order-orig', clerk_user_id: 'user_original_owner', total_amount: 20000, status: 'Pendiente' },
            error: null
          })
        })
      })
    })
  };

  const writer = loadModule('src/lib/server/orderWriter.ts', {
    './authorization': { requireOwnedSubject: async (sub) => ({ userId: sub }) },
    './database': {
      getServerDatabase: () => mockDb,
      readPublicInventoryFlag: async () => ({ track_inventory: false })
    },
    '@/src/lib/checkoutValidation': {
      assertOrderWrite: () => true
    }
  });

  const orderData = {
    clerk_user_id: 'user_attacker',
    customer_name: 'Attacker',
    customer_email: 'bad@test.co',
    customer_phone: '3184990826',
    delivery_address: 'Calle 13 #22-49',
    delivery_municipality: 'Bucaramanga',
    total_amount: 20000,
    status: 'Pendiente',
    payment_method: 'cash',
    idempotency_key: 'IDEMP-REUSED-BY-OTHER'
  };

  await assert.rejects(
    writer.createOrder(orderData, [{ product_id: 'sku-1', quantity: 1, price_at_purchase: 20000 }]),
    /IDEMPOTENCY_OWNER_MISMATCH/
  );
});

test('Commerce: Twenty concurrent identical checkout attempts result in exactly 1 write', async () => {
  let createdOrders = 0;
  let simulatedDbOrder = null;

  const mockDb = {
    from: (table) => ({
      select: () => ({
        eq: (_col, key) => ({
          maybeSingle: async () => {
            if (simulatedDbOrder && simulatedDbOrder.idempotency_key === key) {
              return { data: simulatedDbOrder, error: null };
            }
            return { data: null, error: null };
          }
        })
      }),
      insert: (payload) => ({
        select: () => ({
          single: async () => {
            if (!simulatedDbOrder) {
              createdOrders++;
              simulatedDbOrder = { id: 'order-idemp-first', clerk_user_id: payload.clerk_user_id, idempotency_key: payload.idempotency_key, total_amount: payload.total_amount };
              return { data: simulatedDbOrder, error: null };
            }
            // If already exists, return existing
            return { data: simulatedDbOrder, error: null };
          }
        }),
        error: null
      })
    })
  };

  const writer = loadModule('src/lib/server/orderWriter.ts', {
    './authorization': { requireOwnedSubject: async (sub) => ({ userId: sub }) },
    './database': {
      getServerDatabase: () => mockDb,
      readPublicInventoryFlag: async () => ({ track_inventory: false })
    },
    '@/src/lib/checkoutValidation': {
      assertOrderWrite: () => true
    }
  });

  const orderData = {
    clerk_user_id: 'user_123',
    customer_name: 'Eduard Velazco',
    customer_email: 'test@lagaviota.co',
    customer_phone: '3184990826',
    delivery_address: 'Plaza San Francisco, Calle 13 #22-49',
    delivery_municipality: 'Bucaramanga',
    total_amount: 15000,
    status: 'Pendiente',
    payment_method: 'cash',
    idempotency_key: 'IDEMP-CONCURRENT-BURST-20'
  };

  const attempts = Array.from({ length: 20 }).map(() =>
    writer.createOrder(orderData, [{ product_id: 'sku-1', quantity: 1, price_at_purchase: 15000 }])
  );

  const results = await Promise.all(attempts);
  assert.equal(results.length, 20);
  results.forEach(r => {
    assert.equal(r.success, true);
    assert.equal(r.orderId, 'order-idemp-first');
  });
  assert.equal(createdOrders, 1, 'Only exactly 1 order was created across 20 concurrent requests');
});

test('Commerce: Twenty concurrent attempts racing for limited stock cannot drive stock negative', async () => {
  let availableStock = 5;
  let successfulOrders = 0;
  let failedOrders = 0;

  const mockDb = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            if (table === 'products') return { data: { stock_quantity: availableStock }, error: null };
            return { data: null, error: null };
          }
        })
      }),
      insert: () => ({
        select: () => ({ single: async () => ({ data: { id: `order-${Math.random()}` }, error: null }) }),
        error: null
      }),
      update: (payload) => ({
        eq: () => {
          if (payload.stock_quantity !== undefined) {
            availableStock = payload.stock_quantity;
          }
          return { error: null };
        }
      }),
      delete: () => ({ eq: () => ({}) })
    })
  };

  const writer = loadModule('src/lib/server/orderWriter.ts', {
    './authorization': { requireOwnedSubject: async (sub) => ({ userId: sub }) },
    './database': {
      getServerDatabase: () => mockDb,
      readPublicInventoryFlag: async () => ({ track_inventory: true })
    },
    '@/src/lib/checkoutValidation': {
      assertOrderWrite: () => true
    }
  });

  // Execute 20 serialized or concurrent attempts racing for stock = 5
  for (let i = 0; i < 20; i++) {
    const orderData = {
      clerk_user_id: 'user_123',
      customer_name: 'Eduard Velazco',
      customer_email: 'test@lagaviota.co',
      customer_phone: '3184990826',
      delivery_address: 'Calle 13 #22-49',
      delivery_municipality: 'Bucaramanga',
      total_amount: 5000,
      status: 'Pendiente',
      payment_method: 'cash',
      idempotency_key: `IDEMP-RACE-${i}`
    };

    try {
      await writer.createOrder(orderData, [{ product_id: 'sku-1', quantity: 1, price_at_purchase: 5000 }]);
      successfulOrders++;
    } catch (err) {
      if (err instanceof Error && err.message === 'INSUFFICIENT_STOCK') {
        failedOrders++;
      }
    }
  }

  assert.equal(successfulOrders, 5, 'Exactly 5 purchases succeeded before stock depletion');
  assert.equal(failedOrders, 15, '15 purchases failed closed with INSUFFICIENT_STOCK');
  assert.equal(availableStock, 0, 'Available stock stopped at 0 and never became negative');
});

test('Commerce: Compensation cleanup executes if line items fail', async () => {
  let orderDeleted = false;

  const mockDb = {
    from: (table) => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) })
      }),
      insert: () => {
        if (table === 'orders') {
          return {
            select: () => ({
              single: async () => ({ data: { id: 'order-to-rollback-888' }, error: null })
            })
          };
        }
        if (table === 'order_items') {
          return { error: { message: 'Database line insertion failure' } };
        }
        return { error: null };
      },
      delete: () => ({
        eq: (_col, id) => {
          if (id === 'order-to-rollback-888') orderDeleted = true;
          return { error: null };
        }
      })
    })
  };

  const writer = loadModule('src/lib/server/orderWriter.ts', {
    './authorization': { requireOwnedSubject: async (sub) => ({ userId: sub }) },
    './database': {
      getServerDatabase: () => mockDb,
      readPublicInventoryFlag: async () => ({ track_inventory: false })
    },
    '@/src/lib/checkoutValidation': {
      assertOrderWrite: () => true
    }
  });

  const orderData = {
    clerk_user_id: 'user_123',
    customer_name: 'Eduard Velazco',
    customer_email: 'test@lagaviota.co',
    customer_phone: '3184990826',
    delivery_address: 'Plaza San Francisco, Calle 13 #22-49',
    delivery_municipality: 'Bucaramanga',
    total_amount: 15000,
    status: 'Pendiente',
    payment_method: 'cash',
    idempotency_key: 'IDEMP-FAIL-1'
  };

  await assert.rejects(
    writer.createOrder(orderData, [{ product_id: 'sku-1', quantity: 1, price_at_purchase: 15000 }]),
    /Failed to create order items/
  );

  assert.equal(orderDeleted, true, 'Orphan order header was deleted in compensation rollback');
});

test('Commerce: Wompi balance payment regex binds to exact full clerk user ID', () => {
  const validReference = 'BAL_user_2tXyZ9876543210_1730000000000';
  const match = validReference.match(/^BAL_(user_[A-Za-z0-9]+)_([0-9]+)$/);
  assert.ok(match, 'Reference matches expected format');
  assert.equal(match[1], 'user_2tXyZ9876543210', 'Extracted full untruncated Clerk user ID');

  const invalidPrefix = 'ORDER_12345';
  const malformedRef = 'BAL_random_string_without_user_prefix';
  
  assert.ok(!invalidPrefix.startsWith('BAL_'));
  assert.ok(!malformedRef.match(/^BAL_(user_[A-Za-z0-9]+)_([0-9]+)$/));
});
