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

test('Sprint 3 P2: generateRadicadoCode creates standard RAD/CNT codes and action validates required fields', async () => {
  const insertedRows = [];
  const mockDb = {
    from: (table) => ({
      insert: async (row) => {
        insertedRows.push({ table, row });
        return { error: null };
      },
    }),
  };

  const { generateRadicadoCode, submitCustomerInquiryAction } = loadTsModule('src/actions/inquiries.ts', {
    'src/lib/server/database': {
      getGuestCheckoutDatabase: () => mockDb,
    },
  });

  const radCode = await generateRadicadoCode('queja');
  assert.match(radCode, /^RAD-\d{8}-[A-Z0-9]{4}$/);

  const cntCode = await generateRadicadoCode('contacto');
  assert.match(cntCode, /^CNT-\d{8}-[A-Z0-9]{4}$/);

  // Missing fields
  const emptyForm = new FormData();
  const emptyRes = await submitCustomerInquiryAction(emptyForm);
  assert.equal(emptyRes.ok, false);
  assert.match(emptyRes.error, /nombre completo/i);

  // Valid submission
  const validForm = new FormData();
  validForm.append('name', 'María Pérez');
  validForm.append('contact', '3112694676');
  validForm.append('type', 'reclamo');
  validForm.append('orderId', 'ord_test_123');
  validForm.append('message', 'Mi pedido llegó con una papaya madura de más.');

  const validRes = await submitCustomerInquiryAction(validForm);
  assert.equal(validRes.ok, true);
  assert.match(validRes.radicadoCode, /^RAD-\d{8}-[A-Z0-9]{4}$/);
  assert.equal(insertedRows.length, 1);
  assert.equal(insertedRows[0].table, 'customer_inquiries');
  assert.equal(insertedRows[0].row.full_name, 'María Pérez');
  assert.equal(insertedRows[0].row.type, 'reclamo');
  assert.equal(insertedRows[0].row.status, 'Recibido');
});

test('Sprint 3 P2: Guest Order Tracker page exists, links to /pedidos/[id] and footer includes /pedidos link', () => {
  const lookupPage = fs.readFileSync(path.join(REPO_ROOT, 'app/pedidos/page.tsx'), 'utf8');
  const trackingPage = fs.readFileSync(path.join(REPO_ROOT, 'app/pedidos/[id]/page.tsx'), 'utf8');
  const footer = fs.readFileSync(path.join(REPO_ROOT, 'app/components/layout/Footer.tsx'), 'utf8');

  assert.match(lookupPage, /Rastrear Mi Pedido/);
  assert.match(lookupPage, /\/pedidos\/\$\{encodeURIComponent\(clean\)\}/);
  assert.match(lookupPage, /wa\.me\/573112694676/);

  assert.match(trackingPage, /\/pedidos/);
  assert.match(trackingPage, /Rastrear Otro Pedido/);

  assert.match(footer, /href="\/pedidos"/);
  assert.match(footer, /Rastrear Pedido/);
});

test('Sprint 3 P2: 1-Click household reorder hero card renders in OrderHistoryClient and enables reorder on mobile', () => {
  const historyClient = fs.readFileSync(path.join(REPO_ROOT, 'src/components/portals/OrderHistoryClient.tsx'), 'utf8');

  assert.match(historyClient, /Repite tu último mercado en 1 clic/);
  assert.match(historyClient, /Repetir Último Mercado/);
  // Reorder button must not be hidden on mobile
  assert.doesNotMatch(historyClient, /Volver a Pedir[\s\S]*hidden md:block/);
});

test('Sprint 3 P2: PriceDropPopup honors sessionStorage dismissal to avoid route transition harassment', () => {
  const popup = fs.readFileSync(path.join(REPO_ROOT, 'app/components/market/PriceDropPopup.tsx'), 'utf8');

  assert.match(popup, /sessionStorage\.getItem\('lg_price_drop_dismissed'\)/);
  assert.match(popup, /sessionStorage\.setItem\('lg_price_drop_dismissed',\s*'true'\)/);
});

test('Sprint 3 P2: Schema.org areaServed covers full Santander AMB and Bogota, and legal NIT/email unified', () => {
  const layout = fs.readFileSync(path.join(REPO_ROOT, 'app/layout.tsx'), 'utf8');
  const footer = fs.readFileSync(path.join(REPO_ROOT, 'app/components/layout/Footer.tsx'), 'utf8');
  const privacy = fs.readFileSync(path.join(REPO_ROOT, 'app/privacidad/page.tsx'), 'utf8');

  // Schema.org AMB + Bogota
  assert.match(layout, /Bucaramanga/);
  assert.match(layout, /Floridablanca/);
  assert.match(layout, /Girón/);
  assert.match(layout, /Piedecuesta/);
  assert.match(layout, /Bogotá/);
  assert.match(layout, /\/IMAGES\/og-lagaviota\.png/);

  // Legal NIT & Email
  assert.match(footer, /NIT: 1007193202-05/);
  assert.match(footer, /contacto@lagaviotafruver\.com/);
  assert.match(privacy, /NIT 1007193202-05/);
});

test('Sprint 3 P2: ShopView implements visibleCount progressive catalog pagination and batching', () => {
  const shopView = fs.readFileSync(path.join(REPO_ROOT, 'src/components/store/ShopView.tsx'), 'utf8');

  assert.match(shopView, /const \[visibleCount, setVisibleCount\] = useState\(24\);/);
  assert.match(shopView, /filteredProducts\.slice\(0, visibleCount\)/);
  assert.match(shopView, /Cargar más productos/);
  assert.match(shopView, /Ver todos/);
});
