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
    }
    return require(id);
  };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', compiled);
  fn(mod, mod.exports, customRequire, path.dirname(fullPath), fullPath);
  return mod.exports;
}

test('fetchProducts maps kit_items ingredients onto active kits and tags isKit=true', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

  const mockProducts = [
    {
      id: 'prd_0001',
      name: 'Tomate chonto',
      category: 'VERDURAS Y HORTALIZAS',
      subcategory: null,
      unit: 'Kg',
      price_retail: 5000,
      previous_price_retail: null,
      stock_quantity: 50,
      is_active: true,
      is_in_season: true,
      image_url: null,
      description: 'Tomate fresco',
    },
    {
      id: 'prd_0255',
      name: 'Kit Chévere de la Semana',
      category: 'KITS NEGOCIOS',
      subcategory: null,
      unit: 'Combo',
      price_retail: 160000,
      previous_price_retail: null,
      stock_quantity: 99,
      is_active: true,
      is_in_season: true,
      image_url: null,
      description: 'Legacy product',
    },
  ];

  const mockKits = [
    {
      id: 'kit-uuid-1',
      name: 'Kit Semanal',
      fixed_price: 160000,
      banner_url: '/IMAGES/kit-chevere-semana.jpg',
      status: 'active',
      kit_items: [
        {
          product_id: 'prd_0001',
          quantity: 2,
          products: { id: 'prd_0001', name: 'Tomate chonto', unit: 'Kg', image_url: null },
        },
        {
          product_id: 'prd_0002',
          quantity: 1,
          products: { id: 'prd_0002', name: 'Acelga', unit: '250 GR', image_url: '/IMAGES/acelga.jpg' },
        },
      ],
    },
  ];

  const supabaseStub = {
    createClient: () => ({
      from: (table) => ({
        select: () => ({
          eq: (_col, _val) => {
            if (table === 'products') {
              return Promise.resolve({ data: mockProducts, error: null });
            }
            return {
              order: () => Promise.resolve({ data: mockKits, error: null }),
            };
          },
        }),
      }),
    }),
  };

  const { fetchProducts } = loadTsModule('src/actions/products.ts', {
    '@supabase/supabase-js': supabaseStub,
    '@/src/lib/server/authorization': {
      requireCapability: async () => ({}),
      getActor: async () => ({ userId: null, role: 'GUEST', tier: 'Personas Naturales' }),
      assertTargetId: () => {},
    },
    '@/src/lib/server/database': { getServerDatabase: () => ({}) },
    'next/cache': { revalidatePath: () => {} },
    '@clerk/nextjs/server': { auth: async () => ({}), clerkClient: async () => ({}) },
    '@/src/lib/audit': { logAdminAction: async () => {} },
    '@/src/constants/productConstants': { CATEGORIES: ['KITS NEGOCIOS'] },
    '@/src/lib/catalogImages': { resolveProductImageUrl: (_id, url) => url || null },
  });

  const result = await fetchProducts();
  const kit = result.find((p) => p.id === 'kit-uuid-1');

  assert.ok(kit, 'Active kit from kits table should be returned');
  assert.equal(kit.isKit, true);
  assert.equal(kit.category, 'KITS NEGOCIOS');
  assert.equal(kit.kitItems.length, 2);
  assert.deepEqual(
    kit.kitItems.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
    [
      { name: 'Acelga', quantity: 1, unit: '250 GR' },
      { name: 'Tomate chonto', quantity: 2, unit: 'Kg' },
    ]
  );
  assert.match(kit.description, /Incluye 2 productos frescos: Acelga, Tomate chonto/);
});

test('ShopView collapses sidebar by default, avoids prd_0255 kit duplication, and shows full uncropped banner', () => {
  const shopView = fs.readFileSync(path.join(REPO_ROOT, 'src/components/store/ShopView.tsx'), 'utf8');

  assert.match(shopView, /useState\(false\);\s*\n\s*const \[selectedSubcategory/, 'desktopSidebarOpen must default to false');
  assert.match(shopView, /const dynamicKits = initialProducts\.filter\(p => p\.isKit\)/, 'kitOptions must prioritize dynamic kits');
  assert.match(shopView, /if \(hasDynamicKits && p\.id === 'prd_0255'\) return false/, 'legacy prd_0255 must be hidden from grid when dynamic kits exist');
  assert.match(shopView, /aspect-\[16\/9\][\s\S]*object-contain/, 'kit banner must use 16:9 container with object-contain so image is completely visible');
  assert.match(shopView, /KitIngredientsList/, 'ShopView must render KitIngredientsList for customers');
});

test('ProductCard and ProductDetailClient display kit ingredients to customers', () => {
  const card = fs.readFileSync(path.join(REPO_ROOT, 'src/components/store/ProductCard.tsx'), 'utf8');
  const detail = fs.readFileSync(path.join(REPO_ROOT, 'src/components/store/ProductDetailClient.tsx'), 'utf8');

  assert.match(card, /KitIngredientsList/, 'ProductCard modal must render KitIngredientsList');
  assert.match(detail, /KitIngredientsList/, 'ProductDetailClient must render KitIngredientsList');
});

