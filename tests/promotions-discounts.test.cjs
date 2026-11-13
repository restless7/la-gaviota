const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const REPO_ROOT = path.resolve(__dirname, '..');

function loadTsModule(relativePath, mocks = {}) {
  const fullPath = path.join(REPO_ROOT, relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  const customRequire = (id) => {
    if (mocks[id]) return mocks[id];
    if (id.startsWith('@/')) {
      const target = id.slice(2);
      if (mocks[target]) return mocks[target];
      const candidates = [
        target,
        `${target}.ts`,
        `${target}.tsx`,
        `${target}.js`,
        `${target}/index.ts`,
        `${target}/index.js`,
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(path.join(REPO_ROOT, candidate))) {
          return loadTsModule(candidate, mocks);
        }
      }
    }
    return require(id);
  };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', compiled);
  fn(mod, mod.exports, customRequire, path.dirname(fullPath), fullPath);
  return mod.exports;
}

test('Promotions: Launch posters exist in public/PROMOTIONS', () => {
  const posters = [
    'descuento-15-lanzamiento.jpg',
    'descuento-25-lanzamiento.jpg',
    'descuento-35-lanzamiento.jpg',
    'descuento-15-lanzamiento-v2.jpg',
    'descuento-25-lanzamiento-v2.jpg',
    'descuento-35-lanzamiento-v2.jpg',
  ];
  for (const poster of posters) {
    const full = path.join(REPO_ROOT, 'public/PROMOTIONS', poster);
    assert.ok(fs.existsSync(full), `Poster ${poster} must exist in public/PROMOTIONS`);
    assert.ok(fs.statSync(full).size > 50000, `Poster ${poster} must have valid content`);
  }
});

test('Promotions: calculateDiscount computes 15%, 25%, 35% launch discount tiers', () => {
  const { calculateDiscount } = loadTsModule('src/lib/server/promotions.ts', {
    'server-only': {},
    '@/src/lib/server/authorization': { requireCapability: async () => ({}), getActor: async () => ({}) },
    '@/src/lib/server/database': { getServerDatabase: () => ({}) },
    '@/src/lib/audit': { logAdminAction: async () => {} },
    'next/cache': { revalidatePath: () => {} },
  });

  const launchPromo = {
    id: 'launch-test',
    code: 'LANZAMIENTO_WEB',
    name: 'Gran Lanzamiento',
    headline: 'Descuentos por 1 semana',
    is_active: true,
    starts_at: new Date(Date.now() - 3600000).toISOString(),
    ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    tier_rules: [
      { minSubtotal: 100000, discountPercent: 15, badge: '15% OFF', label: '15% OFF', description: '' },
      { minSubtotal: 200000, discountPercent: 25, badge: '25% OFF', label: '25% OFF', description: '' },
      { minSubtotal: 300000, discountPercent: 35, badge: '35% OFF', label: '35% OFF', description: '' },
    ],
    applicable_tiers: ['Personas Naturales'],
    max_discount_cap: null,
  };

  // 1. Below 100k -> 0% discount, prompts for 100k
  const resBelow = calculateDiscount(80000, 'Personas Naturales', launchPromo);
  assert.equal(resBelow.hasDiscount, false);
  assert.equal(resBelow.discountAmount, 0);
  assert.equal(resBelow.nextTier.needed, 20000);
  assert.equal(resBelow.nextTier.nextPercent, 15);

  // 2. 120k -> 15% discount (18.000), prompts for 200k
  const res15 = calculateDiscount(120000, 'Personas Naturales', launchPromo);
  assert.equal(res15.hasDiscount, true);
  assert.equal(res15.discountPercent, 15);
  assert.equal(res15.discountAmount, 18000);
  assert.equal(res15.finalSubtotal, 102000);
  assert.equal(res15.nextTier.needed, 80000);
  assert.equal(res15.nextTier.nextPercent, 25);

  // 3. 240k -> 25% discount (60.000), prompts for 300k
  const res25 = calculateDiscount(240000, 'Personas Naturales', launchPromo);
  assert.equal(res25.hasDiscount, true);
  assert.equal(res25.discountPercent, 25);
  assert.equal(res25.discountAmount, 60000);
  assert.equal(res25.finalSubtotal, 180000);
  assert.equal(res25.nextTier.needed, 60000);
  assert.equal(res25.nextTier.nextPercent, 35);

  // 4. 350k -> 35% discount (122.500), maximum reached
  const res35 = calculateDiscount(350000, 'Personas Naturales', launchPromo);
  assert.equal(res35.hasDiscount, true);
  assert.equal(res35.discountPercent, 35);
  assert.equal(res35.discountAmount, 122500);
  assert.equal(res35.finalSubtotal, 227500);
  assert.equal(res35.nextTier, null);
});

test('Promotions: Time-frame sensitivity enforces exact 1-week window', () => {
  const { calculateDiscount } = loadTsModule('src/lib/server/promotions.ts', {
    'server-only': {},
    '@/src/lib/server/authorization': { requireCapability: async () => ({}), getActor: async () => ({}) },
    '@/src/lib/server/database': { getServerDatabase: () => ({}) },
    '@/src/lib/audit': { logAdminAction: async () => {} },
    'next/cache': { revalidatePath: () => {} },
  });

  // Expired promo (ended yesterday)
  const expiredPromo = {
    id: 'launch-expired',
    is_active: true,
    starts_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    ends_at: new Date(Date.now() - 86400000).toISOString(),
    tier_rules: [{ minSubtotal: 100000, discountPercent: 35, badge: '35% OFF' }],
    applicable_tiers: ['Personas Naturales'],
  };
  const resExpired = calculateDiscount(350000, 'Personas Naturales', expiredPromo);
  assert.equal(resExpired.hasDiscount, false);
  assert.equal(resExpired.discountAmount, 0);

  // Future promo (starts tomorrow)
  const futurePromo = {
    id: 'launch-future',
    is_active: true,
    starts_at: new Date(Date.now() + 86400000).toISOString(),
    ends_at: new Date(Date.now() + 8 * 86400000).toISOString(),
    tier_rules: [{ minSubtotal: 100000, discountPercent: 35, badge: '35% OFF' }],
    applicable_tiers: ['Personas Naturales'],
  };
  const resFuture = calculateDiscount(350000, 'Personas Naturales', futurePromo);
  assert.equal(resFuture.hasDiscount, false);
  assert.equal(resFuture.discountAmount, 0);
});

test('Checkout Integration: quoteCheckout and assertOrderWrite honor promotional discount', () => {
  const { quoteCheckout, assertOrderWrite } = loadTsModule('src/lib/checkoutValidation.ts');

  const products = [
    { id: 'p1', name: 'Manzanas', is_active: true, stock_quantity: 100, price_retail: 10000, price_micro: 8000, price_restaurant: 7000 },
    { id: 'p2', name: 'Aguacates', is_active: true, stock_quantity: 100, price_retail: 20000, price_micro: 18000, price_restaurant: 16000 },
  ];

  // Subtotal: 10 * 10.000 + 10 * 20.000 = 300.000 COP
  const lines = [
    { productId: 'p1', quantity: 10 },
    { productId: 'p2', quantity: 10 },
  ];

  // Apply 35% discount = 105.000 COP discount.
  // Discounted subtotal = 195.000 COP. Delivery in Bucaramanga (>50k) = 0 COP. Total = 195.000 COP.
  const quote = quoteCheckout(lines, products, 'Personas Naturales', 'Bucaramanga', false, 105000, '35% OFF');

  assert.equal(quote.subtotal, 300000);
  assert.equal(quote.discountAmount, 105000);
  assert.equal(quote.deliveryCost, 0);
  assert.equal(quote.totalAmount, 195000);

  // assertOrderWrite must accept discounted total: subtotal(300k) - discount(105k) <= total(195k)
  const items = [
    { product_id: 'p1', quantity: 10, price_at_purchase: 10000 },
    { product_id: 'p2', quantity: 10, price_at_purchase: 20000 },
  ];
  assert.doesNotThrow(() => {
    assertOrderWrite(195000, items, 105000);
  });

  // Reject fraudulent discount mismatch where client tries to pay less than authorized
  assert.throws(() => {
    assertOrderWrite(150000, items, 105000); // 300k - 105k = 195k, but client passed 150k!
  }, /Total inconsistente/);
});
