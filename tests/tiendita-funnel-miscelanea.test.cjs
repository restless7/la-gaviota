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

test('La Tiendita: CATEGORIES includes MISCELÁNEA and aliases normalize properly', () => {
  const { CATEGORIES, SUBCATEGORIES } = loadTsModule('src/constants/productConstants.ts');
  const { normalizeCategory } = loadTsModule('src/lib/categories.ts');

  assert.ok(CATEGORIES.includes('MISCELÁNEA'), 'CATEGORIES must include MISCELÁNEA');
  assert.ok(SUBCATEGORIES['MISCELÁNEA'].includes('COJINES NAVIDEÑOS'));

  assert.equal(normalizeCategory('miscelanea'), 'MISCELÁNEA');
  assert.equal(normalizeCategory('tiendita'), 'MISCELÁNEA');
  assert.equal(normalizeCategory('la-tiendita'), 'MISCELÁNEA');
  assert.equal(normalizeCategory('navidad'), 'MISCELÁNEA');
  assert.equal(normalizeCategory('MISCELÁNEA'), 'MISCELÁNEA');
});

test('La Tiendita: All 12 Christmas cushion products exist with valid images on disk', () => {
  const { CHRISTMAS_CUSHIONS } = loadTsModule('src/data/christmasProducts.ts');
  const { CATALOG_LOCAL_IMAGES } = loadTsModule('src/lib/catalogImages.ts');

  assert.equal(CHRISTMAS_CUSHIONS.length, 12, 'Must have 12 Christmas products (11 individual + 1 combo x4)');

  for (const item of CHRISTMAS_CUSHIONS) {
    assert.ok(item.id.startsWith('prd_nav_'));
    assert.equal(item.category, 'MISCELÁNEA');
    assert.ok(item.price > 0);
    assert.ok(item.imageUrl, `Product ${item.id} must have imageUrl`);

    // Verify file exists on disk
    const relativeImgPath = item.imageUrl.replace(/^\//, '');
    const diskPath = path.join(REPO_ROOT, 'public', relativeImgPath);
    assert.ok(fs.existsSync(diskPath), `Image file ${diskPath} must exist on disk`);

    // Check catalog local image registry
    assert.equal(CATALOG_LOCAL_IMAGES[item.id], item.imageUrl);
  }
});

test('La Tiendita: Funnel pages /tiendita and /navidad exist and integrate with brand identity and checkout', () => {
  const tienditaPage = fs.readFileSync(path.join(REPO_ROOT, 'app/tiendita/page.tsx'), 'utf8');
  const navidadPage = fs.readFileSync(path.join(REPO_ROOT, 'app/navidad/page.tsx'), 'utf8');
  const funnelClient = fs.readFileSync(path.join(REPO_ROOT, 'src/components/funnel/TienditaFunnelClient.tsx'), 'utf8');
  const header = fs.readFileSync(path.join(REPO_ROOT, 'app/components/layout/Header.tsx'), 'utf8');
  const footer = fs.readFileSync(path.join(REPO_ROOT, 'app/components/layout/Footer.tsx'), 'utf8');
  const shopView = fs.readFileSync(path.join(REPO_ROOT, 'src/components/store/ShopView.tsx'), 'utf8');

  assert.match(tienditaPage, /TienditaFunnelClient/);
  assert.match(navidadPage, /TienditaFunnelClient/);

  // High converting funnel elements
  assert.match(funnelClient, /Viste tu sala de magia/);
  assert.match(funnelClient, /Set Familiar x4 Cojines/);
  assert.match(funnelClient, /119900/);
  assert.match(funnelClient, /handleAddToCart/);
  assert.match(funnelClient, /handleBuyNow/);
  assert.match(funnelClient, /\/checkout/);

  // Integrated in Header, Footer & Storefront
  assert.match(header, /href="\/tiendita"/);
  assert.match(footer, /href="\/tiendita"/);
  assert.match(shopView, /La Tiendita \(Miscelánea\)/);
  assert.match(shopView, /href="\/tiendita"/);
});

test('La Tiendita: SQL migration exists and seeds products table with conflict handling', () => {
  const migrationPath = path.join(REPO_ROOT, 'supabase/migrations/20261112_miscelanea_navidad_products.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /INSERT INTO public\.products/);
  assert.match(sql, /prd_nav_01/);
  assert.match(sql, /prd_nav_combo4/);
  assert.match(sql, /ON CONFLICT \(id\) DO UPDATE/);
});
