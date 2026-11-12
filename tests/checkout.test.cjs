/* Run with node --test tests/checkout.test.cjs. No env files, SDK imports or services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
function load(relative, stubs = {}, env = {}) {
  const filename = path.join(root, relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: id => {
    if (Object.hasOwn(stubs, id)) return stubs[id];
    if (id === './safetyGuard' || id.endsWith('safetyGuard')) return load('src/lib/safetyGuard.ts', stubs, env);
    if (id.includes('deliveryCutoff')) return load('src/lib/deliveryCutoff.ts', stubs, env);
    if (id.includes('christmasProducts')) return { CHRISTMAS_CUSHIONS: [] };
    throw Error(`Unapproved dependency ${id}`);
  }, Map, Set, Buffer, FormData, Date, console, process: { env } }, { filename });
  return module.exports;
}
const validation = load('src/lib/checkoutValidation.ts');
const { normalizeCheckoutItems, quoteCheckout, assertOrderWrite, readCheckoutDetails, assertExpectedCheckoutTotal } = validation;
const item = (quantity = 1, id = 'sku-1') => ({ product: { id, price: -999 }, quantity });
const product = { id: 'sku-1', name: 'Fruta', is_active: true, price_retail: 10000, price_micro: 8000, price_restaurant: 7000, stock_quantity: 3 };
function form() { const f = new FormData(); for (const [k, v] of Object.entries({ firstName: 'Ana', lastName: 'Prueba', email: 'ana@example.invalid', phone: '3000000000', address: 'Calle prueba', city: 'Bucaramanga' })) f.set(k, v); return f; }
for (const quantity of [0, -1, 0.5, NaN, Infinity, '2', null, 10001, Number.MAX_SAFE_INTEGER]) test(`reject quantity ${String(quantity)}`, () => assert.throws(() => normalizeCheckoutItems([item(quantity)])));
test('reject empty, non-array and oversized requests', () => { for (const input of [[], null, {}, Array(101).fill(item())]) assert.throws(() => normalizeCheckoutItems(input)); });
test('aggregate duplicate SKU without trusting client price', () => { const lines = normalizeCheckoutItems([item(1), item(2)]); assert.equal(lines.length, 1); assert.equal(lines[0].quantity, 3); const q = quoteCheckout(lines, [product], 'Personas Naturales', 'Bucaramanga', true); assert.equal(q.totalAmount, 35000); assert.equal(q.orderItems[0].price_at_purchase, 10000); });
test('aggregate quantity bound and aggregate stock', () => { assert.throws(() => normalizeCheckoutItems([item(6000), item(6000)])); assert.throws(() => quoteCheckout(normalizeCheckoutItems([item(2), item(2)]), [product], 'Personas Naturales', 'Bucaramanga', true)); });
test('inventory flag false preserves existing replenishment policy', () => assert.equal(quoteCheckout(normalizeCheckoutItems([item(4)]), [product], 'Personas Naturales', 'Bucaramanga', false).subtotal, 40000));
for (const p of [{ ...product, is_active: false }, { ...product, price_retail: NaN }, { ...product, price_retail: -1 }, { ...product, stock_quantity: null }]) test(`reject invalid database product ${JSON.stringify(p)}`, () => assert.throws(() => quoteCheckout(normalizeCheckoutItems([item()]), [p], 'Personas Naturales', 'Bucaramanga', true)));
test('missing and duplicate database products fail', () => { for (const products of [[], [product, product]]) assert.throws(() => quoteCheckout(normalizeCheckoutItems([item()]), products, 'Personas Naturales', 'Bucaramanga', true)); });
test('existing B2B minimums and fresh entitled prices', () => { assert.throws(() => quoteCheckout(normalizeCheckoutItems([item()]), [product], 'Micromercados', 'Girón', false)); const q = quoteCheckout(normalizeCheckoutItems([item(20)]), [product], 'Micromercados', 'Girón', false); assert.equal(q.totalAmount, 160000); });
test('overflow, unknown delivery city and malformed contact fail', () => { assert.throws(() => quoteCheckout(normalizeCheckoutItems([item(10000)]), [{ ...product, price_retail: 2147483647 }], 'Personas Naturales', 'Bucaramanga', false)); assert.throws(() => quoteCheckout(normalizeCheckoutItems([item()]), [product], 'Personas Naturales', 'Unknown', false)); const f = form(); f.set('email', 'not-email'); assert.throws(() => readCheckoutDetails(f)); });
test('changed expected total must be reviewed', () => { assert.throws(() => assertExpectedCheckoutTotal(1, 15000)); assert.throws(() => assertExpectedCheckoutTotal(NaN, 15000)); assertExpectedCheckoutTotal(15000, 15000); });
test('private writer rejects empty, duplicate, invalid and inconsistent lines', () => { for (const lines of [[], [{product_id:'sku-1', quantity:-1, price_at_purchase:100}], [{product_id:'sku-1', quantity:1, price_at_purchase:100}, {product_id:'sku-1', quantity:1, price_at_purchase:100}]]) assert.throws(() => assertOrderWrite(100, lines)); assert.throws(() => assertOrderWrite(10, [{product_id:'sku-1', quantity:1, price_at_purchase:100}])); });
function checkoutHarness(options = {}) {
  let writes = 0, reads = 0, authReads = 0;
  const actor = { userId: 'user_owner', tier: options.tier || 'Personas Naturales' };
  const prep = load('src/lib/server/checkout.ts', {
    'server-only': {}, '@/src/lib/checkoutValidation': validation,
    '@/src/data/christmasProducts': { CHRISTMAS_CUSHIONS: [] },
    './authorization': { getActor: async () => { authReads++; return actor; }, assertIssuedActor: () => { if (options.unauthorized) throw Error('UNAUTHORIZED'); } },
    './database': { getServerDatabase: () => ({ from: () => { reads++; return { select: () => ({ in: async () => ({ data: options.products || [product], error: options.dbError || null }) }) }; } }), readPublicInventoryFlag: async () => { if (options.settingsError) throw Error('SETTINGS_UNAVAILABLE'); return { track_inventory: true }; } }
  });
  let lastOrderData = null;
  const notificationsSent = [];
  const common = {
    '@/src/lib/server/checkout': prep,
    '@/src/lib/server/orderWriter': { createOrder: async (data, items) => { writes++; lastOrderData = data; return { orderId: 'order-1', data, items }; } },
    '@/src/lib/notifications': { triggerOrderNotification: async (...args) => { notificationsSent.push(args); } },
  };
  const cash = load('src/actions/checkoutAction.ts', common);
  const wompi = load('src/actions/wompi.ts', { ...common, '@clerk/nextjs/server': {}, '@/src/lib/server/authorization': {}, '@/src/lib/server/database': { getServerDatabase: () => ({ from: () => ({ insert: async () => ({ error: null }) }) }) }, '@/src/lib/wompi': { assertWompiCheckoutConfigured: () => { if (options.configError) throw Error('NOT_CONFIGURED'); return 'synthetic-key'; }, formatToCents: n => n*100, generateIntegritySignature: () => 'synthetic-signature' } });
  return { cash: cash.submitCheckoutOrder, wompi: wompi.initializeWompiTransaction, counts: () => ({ writes, reads, authReads }), getLastOrder: () => lastOrderData, getNotifications: () => notificationsSent };
}
for (const method of ['cash', 'wompi']) {
  for (const [label, options, items, total] of [ ['negative', {}, [item(-1)], 15000], ['empty', {}, [], 15000], ['out of stock duplicates', {}, [item(2), item(2)], 45000], ['inactive', { products: [{ ...product, is_active: false }] }, [item()], 15000], ['price changed', {}, [item()], 1], ['unauthenticated', { unauthorized: true }, [item()], 15000], ['database failure', { dbError: {} }, [item()], 15000], ['inventory setting outage', { settingsError: true }, [item()], 15000] ]) test(`${method}: ${label} => zero writes`, async () => {
    const h=checkoutHarness(options);
    if (method === 'wompi') {
      const res = await h.wompi(form(), items, total).catch(err => ({ ok: false, error: err.message }));
      assert.equal(res.ok, false);
    } else {
      await assert.rejects(h[method](form(), items, total));
    }
    assert.equal(h.counts().writes, 0);
    if (label === 'empty' || label === 'negative') assert.equal(h.counts().reads, 0);
  });
  test(`${method}: valid fresh server quote creates one order`, async () => {
    const h=checkoutHarness();
    const result=await h[method](form(), [item(2)], 25000);
    assert.equal(h.counts().writes, 1);
    if (method === 'wompi') {
      assert.equal(result.ok, true);
      assert.equal(result.totalAmount, 25000);
      assert.equal(result.orderId, 'order-1');
    } else {
      assert.equal(result.totalAmount, 25000);
      assert.equal(result.orderId, 'order-1');
    }
  });
}
test('Wompi missing configuration cannot insert order', async () => {
  const h=checkoutHarness({ configError: true });
  const res = await h.wompi(form(), [item()], 15000).catch(err => ({ ok: false, error: err.message }));
  assert.equal(res.ok, false);
  assert.equal(h.counts().writes, 0);
});
const payment = load('src/lib/wompi.ts', { crypto, });
// Environment is synthetic and empty unless supplied explicitly; never load real env.
test('payment helper requires configured environment', () => assert.throws(() => payment.assertWompiCheckoutConfigured(), /no está configurado/));

const signedPayment = load('src/lib/wompi.ts', { crypto }, { WOMPI_EVENTS_SECRET: 'fixture-events-secret' });
function eventSignature(transaction, properties, timestamp = '1234567890') {
  const text = properties.map(p => transaction[p.slice('transaction.'.length)]).join('') + timestamp + 'fixture-events-secret';
  return { properties, checksum: crypto.createHash('sha256').update(text).digest('hex') };
}
test('webhook validates supplied property order rather than fixed order', () => {
  const tx = { id: 'tx-1', status: 'APPROVED', amount_in_cents: 1500000, reference: 'order-1' };
  const properties = ['transaction.status', 'transaction.amount_in_cents', 'transaction.id', 'transaction.reference'];
  const sig = eventSignature(tx, properties);
  assert.equal(signedPayment.validateWebhookSignature(sig, tx, '1234567890'), true);
  assert.equal(signedPayment.validateWebhookSignature(sig, { ...tx, reference: 'other' }, '1234567890'), false);
  assert.equal(signedPayment.validateWebhookSignature({ ...sig, checksum: 'xx' }, tx, '1234567890'), false);
  assert.equal(signedPayment.validateWebhookSignature({ properties: ['transaction.reference'], checksum: sig.checksum }, tx, '1234567890'), false);
});
test('default provider checksum does not authenticate reference (documented remaining binding gap)', () => {
  const tx = { id: 'tx-1', status: 'APPROVED', amount_in_cents: 1500000, reference: 'order-1' };
  const props = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const sig = eventSignature(tx, props);
  assert.equal(signedPayment.validateWebhookSignature(sig, { ...tx, reference: 'other' }, '1234567890'), true);
});
test('pending and unknown statuses never unlock fulfilment', () => {
  for (const status of ['PENDING', 'CREATED', 'UNKNOWN', undefined]) assert.equal(payment.orderStatusForWompi(status), null);
  assert.equal(payment.orderStatusForWompi('APPROVED'), 'Pendiente');
  assert.equal(payment.orderStatusForWompi('DECLINED'), 'Cancelado');
});
test('payment cents rejects nonfinite, zero and unsafe totals', () => {
  for (const amount of [NaN, Infinity, -1, 0, Number.MAX_SAFE_INTEGER]) assert.throws(() => payment.formatToCents(amount));
  assert.equal(payment.formatToCents(10000), 1000000);
});

function webhookHarness({ orderStatus = 'Pago Pendiente', paymentMethod = 'wompi', updateError = false } = {}) {
  let rpcCalls = 0;
  const db = {
    rpc: async (name, params) => {
      rpcCalls++;
      if (updateError) {
        return { data: null, error: { message: 'Database transaction processing failed' } };
      }
      if (orderStatus === 'Cancelado' || paymentMethod === 'cash') {
        return { data: null, error: { message: 'ORDER_ALREADY_CANCELLED' } };
      }
      return { data: { success: true, action: 'order_approved', order_id: 'order-1' }, error: null };
    }
  };
  const route = load('app/api/webhooks/wompi/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options.status }) } },
    '@/src/lib/wompi': signedPayment,
    '@supabase/supabase-js': { createClient: () => db },
    '@/src/lib/notifications': { triggerOrderNotification: async () => {} },
  }, { NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic' });
  return { send: async (status) => {
    const transaction = { id: 'tx-1', status, amount_in_cents: 1500000, currency: 'COP', reference: 'order-1' };
    const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
    return route.POST({ json: async () => ({ event: 'transaction.updated', data: { transaction }, signature: eventSignature(transaction, properties), timestamp: 1234567890 }) });
  }, counts: () => ({ rpcCalls }) };
}
test('actual webhook pending/unknown does not read or mutate orders', async () => {
  for (const status of ['PENDING', 'UNKNOWN']) { const h=webhookHarness(); assert.equal((await h.send(status)).status,200); assert.equal(h.counts().rpcCalls,0); }
});
test('actual webhook cannot approve a cash or cancelled order', async () => {
  for (const options of [{ paymentMethod: 'cash' }, { orderStatus: 'Cancelado' }]) { const h=webhookHarness(options); assert.equal((await h.send('APPROVED')).status,409); }
});
test('actual webhook database write failure returns retryable 500', async () => {
  const h=webhookHarness({ updateError: true }); assert.equal((await h.send('APPROVED')).status,500); assert.equal(h.counts().rpcCalls,1);
});
function privateWriterHarness(denyOwner = false) {
  let databaseClients = 0, mutations = 0;
  const writer = load('src/lib/server/orderWriter.ts', {
    'server-only': {}, '@/src/lib/checkoutValidation': validation, 'next/cache': { revalidatePath() {} },
    '@/src/lib/idempotency': { computeCheckoutFingerprint: () => 'synthetic-fingerprint' },
    './authorization': { requireOwnedSubject: async subject => { if (denyOwner || subject !== 'user_owner') throw Error('FORBIDDEN_OWNER'); return { userId: subject }; } },
    './database': {
      readPublicInventoryFlag: async () => ({ track_inventory: false }),
      getServerDatabase: () => { databaseClients++; return { from: () => ({ insert: () => { mutations++; return { select: () => ({ single: async () => ({ data: { id: 'order-1' }, error: null }) }), error: null }; }, delete: () => ({ eq: () => ({}) }) }) }; }
    }
  });
  return { create: writer.createOrder, counts: () => ({ databaseClients, mutations }) };
}
const validOrder = { clerk_user_id: 'user_owner', total_amount: 15000, status: 'Pendiente', payment_method: 'cash' };
const validOrderLines = [{ product_id: 'sku-1', quantity: 1, price_at_purchase: 10000 }];
test('actual private writer rejects invalid items before constructing database client', async () => {
  const h = privateWriterHarness(); await assert.rejects(h.create(validOrder, [])); assert.equal(h.counts().databaseClients, 0); assert.equal(h.counts().mutations, 0);
});
test('actual private writer denies cross-owner before constructing database client', async () => {
  const h = privateWriterHarness(true); await assert.rejects(h.create({ ...validOrder, clerk_user_id: 'user_other' }, validOrderLines)); assert.equal(h.counts().databaseClients, 0); assert.equal(h.counts().mutations, 0);
});
test('actual private writer preserves valid owned order header and lines', async () => {
  const h = privateWriterHarness(); assert.equal((await h.create(validOrder, validOrderLines)).orderId, 'order-1'); assert.equal(h.counts().mutations, 2);
});

test('Sprint 1 P0: Wompi init uses Pago Pendiente and forwards idempotencyKey', async () => {
  const h = checkoutHarness();
  const res = await h.wompi(form(), [item(2)], 25000, 'WOMPI-KEY-123');
  assert.equal(res.ok, true);
  assert.equal(h.getLastOrder().status, 'Pago Pendiente');
  assert.equal(h.getLastOrder().idempotency_key, 'WOMPI-KEY-123');
});

test('Sprint 1 P0: cash checkout triggers WhatsApp order notification with phone and name', async () => {
  const h = checkoutHarness();
  await h.cash(form(), [item(2)], 25000, 'CHK-KEY-123');
  const notifications = h.getNotifications();
  assert.equal(notifications.length, 1);
  assert.deepEqual(notifications[0], ['order-1', '3000000000', 'Ana Prueba', 25000]);
});

test('Sprint 1 P0: CHECKOUT_CITIES & calculateCheckoutDeliveryCost stay aligned across AMB and Bogota', () => {
  assert.equal(validation.CHECKOUT_CITIES.includes('Piedecuesta'), true);
  assert.equal(validation.calculateCheckoutDeliveryCost('Bucaramanga', 20000), 5000);
  assert.equal(validation.calculateCheckoutDeliveryCost('Floridablanca', 20000), 8000);
  assert.equal(validation.calculateCheckoutDeliveryCost('Piedecuesta', 20000), 10000);
  assert.equal(validation.calculateCheckoutDeliveryCost('Piedecuesta', 50000), 0);
});

test('Sprint 1 P0: normalizeColombianWhatsAppPhone rejects empty/short and avoids double 57', () => {
  const notificationsMod = load('src/lib/notifications.ts');
  assert.equal(notificationsMod.normalizeColombianWhatsAppPhone(''), null);
  assert.equal(notificationsMod.normalizeColombianWhatsAppPhone('57'), null);
  assert.equal(notificationsMod.normalizeColombianWhatsAppPhone('311 269 4676'), '573112694676');
  assert.equal(notificationsMod.normalizeColombianWhatsAppPhone('+57 311 269 4676'), '573112694676');
});

test('Sprint 1 P0: Wompi webhook looks up customer phone, promotes Pago Pendiente and triggers notification', async () => {
  const sentNotifications = [];
  const updatedStatuses = [];
  const db = {
    rpc: async () => ({ data: { success: true, action: 'order_approved', order_id: 'order-wompi-1' }, error: null }),
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { customer_phone: '3112694676', customer_name: 'Carlos Gómez', status: 'Pago Pendiente' },
          }),
        }),
      }),
      update: (patch) => {
        updatedStatuses.push(patch);
        return { eq: () => ({ eq: async () => ({ error: null }) }) };
      },
    }),
  };
  const route = load('app/api/webhooks/wompi/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options.status }) } },
    '@/src/lib/wompi': signedPayment,
    '@supabase/supabase-js': { createClient: () => db },
    '@/src/lib/notifications': {
      triggerOrderNotification: async (...args) => { sentNotifications.push(args); },
    },
  }, { NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic' });

  const transaction = { id: 'tx-wompi-1', status: 'APPROVED', amount_in_cents: 5500000, currency: 'COP', reference: 'order-wompi-1' };
  const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const res = await route.POST({
    json: async () => ({ event: 'transaction.updated', data: { transaction }, signature: eventSignature(transaction, properties), timestamp: 1234567890 }),
  });
  assert.equal(res.status, 200);
  assert.equal(updatedStatuses.length, 1);
  assert.equal(updatedStatuses[0].status, 'En Preparación');
  assert.deepEqual(sentNotifications[0], ['order-wompi-1', '3112694676', 'Carlos Gómez', 55000]);
});
