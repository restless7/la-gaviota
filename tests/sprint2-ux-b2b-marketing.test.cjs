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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  const customRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith('@/')) {
      const target = id.slice(2);
      if (Object.hasOwn(mocks, target)) return mocks[target];
    }
    return require(id);
  };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', compiled);
  fn(mod, mod.exports, customRequire, path.dirname(fullPath), fullPath);
  return mod.exports;
}

test('Sprint 2 P1: matchesCatalogSearch strips NFD accents and searches description & kit ingredients', () => {
  const { normalizeSearchText, matchesCatalogSearch } = loadTsModule('src/lib/searchUtils.ts');

  assert.equal(normalizeSearchText('Limón Taití ÁÉÍÓÚ ñ'), 'limon taiti aeiou n');

  const limon = { name: 'Limón taití', category: 'FRUTAS', description: 'Cítrico de Santander' };
  const platano = { name: 'Plátano verde', category: 'VERDURAS Y HORTALIZAS', description: 'Para patacones' };
  const kit = {
    name: 'Kit Chévere Semanal',
    category: 'KITS NEGOCIOS',
    kitItems: [{ name: 'Aguacate papelillo' }, { name: 'Tomate chonto' }],
  };

  assert.equal(matchesCatalogSearch(limon, 'limon taiti'), true);
  assert.equal(matchesCatalogSearch(limon, 'citrico'), true);
  assert.equal(matchesCatalogSearch(platano, 'platano'), true);
  assert.equal(matchesCatalogSearch(kit, 'aguacate'), true);
  assert.equal(matchesCatalogSearch(limon, 'maracuya'), false);
});

test('Sprint 2 P1: ProductCard, ProductDetailClient & QuantitySelector wire Agotado and stock capping cleanly', () => {
  const card = fs.readFileSync(path.join(REPO_ROOT, 'src/components/store/ProductCard.tsx'), 'utf8');
  const detail = fs.readFileSync(path.join(REPO_ROOT, 'src/components/store/ProductDetailClient.tsx'), 'utf8');
  const qtySel = fs.readFileSync(path.join(REPO_ROOT, 'src/components/store/QuantitySelector.tsx'), 'utf8');

  assert.match(card, /trackInventory\s*&&\s*!product\.isKit\s*&&\s*product\.stockQuantity\s*<=\s*0/);
  assert.match(card, /Agotado/);
  assert.match(detail, /Agotado/);
  assert.match(qtySel, /maxReached/);
});

test('Sprint 2 P1: getMonthlySpend queries Spanish operational statuses and createBuyingTemplate enforces validation & ownership', async () => {
  const capturedQueries = [];
  const insertedRows = [];
  const deletedFilters = [];
  const revalidated = [];

  const mockDb = {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          in: (_col, statuses) => {
            capturedQueries.push({ table, statuses });
            return {
              gte: async () => ({
                data: [{ total_amount: 180000 }, { total_amount: 220000 }],
                error: null,
              }),
            };
          },
        }),
      }),
      insert: (row) => {
        insertedRows.push({ table, row });
        return {
          select: () => ({
            single: async () => ({
              data: { id: 'tpl-12345678', ...row },
              error: null,
            }),
          }),
        };
      },
      delete: () => ({
        eq: (col1, val1) => {
          deletedFilters.push([col1, val1]);
          return {
            eq: async (col2, val2) => {
              deletedFilters.push([col2, val2]);
              return { error: null };
            },
          };
        },
      }),
    }),
  };

  const b2b = loadTsModule('src/actions/b2b.ts', {
    'next/cache': { revalidatePath: (p) => revalidated.push(p) },
    '@clerk/nextjs/server': { auth: async () => ({ userId: 'user_b2b_1' }) },
    '@/src/lib/server/authorization': {
      getActor: async () => ({ userId: 'user_b2b_1', role: 'USER', tier: 'Restaurantes' }),
      assertIssuedActor: () => {},
    },
    '@/src/lib/server/database': { getServerDatabase: () => mockDb },
  });

  const spend = await b2b.getMonthlySpend();
  assert.equal(spend, 400000);
  assert.deepEqual(capturedQueries[0].statuses, ['Pendiente', 'En Preparación', 'En Ruta', 'Entregado']);

  const badName = await b2b.createBuyingTemplate('A', [{ product_id: 'prd_0001', quantity: 2 }]);
  assert.equal(badName.ok, false);

  const created = await b2b.createBuyingTemplate('  Pedido Cocina Lunes  ', [
    { product_id: 'prd_0001', quantity: 3 },
    { product_id: 'prd_0001', quantity: 2 },
  ]);
  assert.equal(created.ok, true);
  assert.equal(insertedRows[0].row.user_id, 'user_b2b_1');
  assert.equal(insertedRows[0].row.template_name, 'Pedido Cocina Lunes');
  assert.deepEqual(insertedRows[0].row.product_list, [{ product_id: 'prd_0001', quantity: 5 }]);

  const del = await b2b.deleteBuyingTemplate('tpl-12345678');
  assert.equal(del.ok, true);
  assert.deepEqual(deletedFilters, [
    ['id', 'tpl-12345678'],
    ['user_id', 'user_b2b_1'],
  ]);
  assert.ok(revalidated.includes('/restaurante') && revalidated.includes('/micromercado'));
});

test('Sprint 2 P1: MicromercadoClient uses Spanish delivery statuses and shares B2BTemplatesSection', () => {
  const micro = fs.readFileSync(path.join(REPO_ROOT, 'app/(portals)/micromercado/MicromercadoClient.tsx'), 'utf8');
  const rest = fs.readFileSync(path.join(REPO_ROOT, 'app/(portals)/restaurante/RestauranteClient.tsx'), 'utf8');
  const hist = fs.readFileSync(path.join(REPO_ROOT, 'src/components/portals/OrderHistoryClient.tsx'), 'utf8');

  assert.equal(micro.includes("'SHIPPED'"), false);
  assert.ok(micro.includes("'En Ruta'"));
  assert.ok(micro.includes('B2BTemplatesSection'));
  assert.ok(rest.includes('B2BTemplatesSection'));
  assert.equal(micro.includes('alert('), false);
  assert.equal(rest.includes('alert('), false);
  assert.equal(hist.includes('alert('), false);
});

test('Sprint 2 P1: Marketing WhatsApp triggers send templates & abandoned-cart sync recovers empty completed carts', async () => {
  const sentTemplates = [];
  const nextResponseMock = {
    NextResponse: {
      json: (body, init = { status: 200 }) => ({ body, status: init.status ?? 200 }),
    },
  };

  // 1. Abandoned Cart Trigger
  const abandonedTrigger = loadTsModule('app/api/marketing/abandoned-cart/trigger/route.ts', {
    'next/server': nextResponseMock,
    '@/src/lib/server/scheduler': { requireScheduler: () => {} },
    '@/src/lib/server/database': {
      getSchedulerDatabase: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              lt: async () => ({
                data: [{ id: 'cart-1', customer_phone: '3112694676', total_amount: 85000 }],
                error: null,
              }),
            }),
          }),
          update: () => ({ in: async () => ({ error: null }) }),
        }),
      }),
    },
    '@/src/lib/notifications': {
      sendWhatsAppTemplate: async (...args) => {
        sentTemplates.push(args);
        return { sent: true };
      },
    },
  });

  const triggerRes = await abandonedTrigger.POST({ headers: new Headers() });
  assert.equal(triggerRes.body.processed, 1);
  assert.equal(triggerRes.body.notificationsSent, 1);
  assert.equal(sentTemplates[0][1], 'abandoned_cart_reminder');

  // 2. Loyalty Reorder Trigger
  const loyaltyTrigger = loadTsModule('app/api/marketing/loyalty/reorder/route.ts', {
    'next/server': nextResponseMock,
    '@/src/lib/server/scheduler': { requireScheduler: () => {} },
    '@/src/lib/server/database': {
      getSchedulerDatabase: () => ({
        from: () => ({
          select: () => ({
            in: () => ({
              gt: () => ({
                lt: () => ({
                  gt: async () => ({
                    data: [
                      {
                        clerk_user_id: 'user_rest_1',
                        full_name: 'Chef Ana',
                        business_name: 'Asadero Santander',
                        phone: '3184990826',
                        tier: 'Restaurantes',
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    },
    '@/src/lib/notifications': {
      sendWhatsAppTemplate: async (...args) => {
        sentTemplates.push(args);
        return { sent: true };
      },
    },
  });

  const loyaltyRes = await loyaltyTrigger.POST({ headers: new Headers() });
  assert.equal(loyaltyRes.body.processed_reorders, 1);
  assert.equal(loyaltyRes.body.notificationsSent, 1);
  assert.equal(sentTemplates[1][1], 'b2b_reorder_reminder');

  // 3. Abandoned Cart Sync recovery even with empty items
  const syncUpdates = [];
  const syncRoute = loadTsModule('app/api/marketing/abandoned-cart/sync/route.ts', {
    'next/server': nextResponseMock,
    '@clerk/nextjs/server': {
      clerkClient: async () => ({ users: { getUser: async () => ({}) } }),
    },
    '@/src/lib/server/authorization': {
      getActor: async () => ({ userId: 'user_home_1', role: 'USER', tier: 'Personas Naturales' }),
    },
    '@/src/lib/server/database': {
      getServerDatabase: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              in: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: { id: 'cart-rec-1' } }),
                  }),
                }),
              }),
            }),
          }),
          update: (patch) => ({
            eq: async (col, id) => {
              syncUpdates.push({ patch, col, id });
              return { error: null };
            },
          }),
        }),
      }),
    },
  });

  const syncRes = await syncRoute.POST({
    json: async () => ({ items: [], cartTotal: 60000, phone: '3112694676', isCompleted: true }),
  });
  assert.equal(syncRes.body.success, true);
  assert.equal(syncUpdates.length, 1);
  assert.equal(syncUpdates[0].patch.status, 'recovered');
});

