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

test('SEO: Robots.txt disallows administrative, portal and transactional routes', () => {
  const robotsMod = loadModule('app/robots.ts');
  const config = robotsMod.default();
  
  assert.equal(config.sitemap, 'https://www.lagaviotafruver.com/sitemap.xml');
  assert.equal(config.rules.userAgent, '*');
  assert.equal(config.rules.allow, '/');
  
  const disallowList = config.rules.disallow;
  const mustDisallow = ['/admin', '/admin/*', '/cart', '/checkout', '/dashboard', '/retail', '/restaurante', '/micromercado'];
  mustDisallow.forEach(route => {
    assert.ok(disallowList.includes(route), `Robots disallows ${route}`);
  });
});

test('SEO: Sitemap includes canonical public routes and excludes private/admin routes', async () => {
  const sitemapMod = loadModule('app/sitemap.ts', {
    '@/src/actions/products': {
      fetchProducts: async () => [
        { id: 'prod-1', name: 'Manzana Royal Gala', isActive: true },
        { id: 'prod-inactive', name: 'Fruta Inactiva', isActive: false },
      ]
    }
  });

  const urls = await sitemapMod.default();
  const urlStrings = urls.map(u => u.url);

  assert.ok(urlStrings.includes('https://www.lagaviotafruver.com'), 'Includes homepage');
  assert.ok(urlStrings.includes('https://www.lagaviotafruver.com/nosotros'), 'Includes nosotros');
  assert.ok(urlStrings.includes('https://www.lagaviotafruver.com/contacto'), 'Includes contacto');
  assert.ok(urlStrings.includes('https://www.lagaviotafruver.com/product/prod-1'), 'Includes active product');
  assert.ok(!urlStrings.includes('https://www.lagaviotafruver.com/product/prod-inactive'), 'Excludes inactive product');
  
  // Ensure no private routes leaked into sitemap
  urlStrings.forEach(u => {
    assert.ok(!u.includes('/admin'), `No admin route in sitemap: ${u}`);
    assert.ok(!u.includes('/dashboard'), `No dashboard route in sitemap: ${u}`);
    assert.ok(!u.includes('/retail'), `No retail portal route in sitemap: ${u}`);
    assert.ok(!u.includes('/restaurante'), `No restaurante portal route in sitemap: ${u}`);
  });
});

test('GEO: LocalBusiness / GroceryStore Schema contains verified Bucaramanga NAP data', () => {
  const layoutSource = fs.readFileSync(path.resolve(__dirname, '..', 'app/layout.tsx'), 'utf8');
  
  // Check verified NAP consistency
  assert.ok(layoutSource.includes('Frutas y Verduras La Gaviota'), 'Official business name declared');
  assert.ok(layoutSource.includes('Eduard Iván Velazco López'), 'Verified owner Eduard Iván Velazco López declared');
  assert.ok(layoutSource.includes('+573184990826'), 'Verified telephone +573184990826 declared');
  assert.ok(layoutSource.includes('Plaza de Mercado San Francisco, Calle 13 #22-49, Local 10'), 'Exact verified physical location declared');
  assert.ok(layoutSource.includes('Bucaramanga'), 'City Bucaramanga declared');
  assert.ok(layoutSource.includes('Santander'), 'Department Santander declared');
  assert.ok(layoutSource.includes('7.1254'), 'Latitude coordinates declared');
  assert.ok(layoutSource.includes('-73.1257'), 'Longitude coordinates declared');
});

test('GEO & AI Discoverability: Crawlable FAQ exists with factual answers to core business queries', () => {
  const nosotrosSource = fs.readFileSync(path.resolve(__dirname, '..', 'app/nosotros/page.tsx'), 'utf8');
  
  // Verify FAQ questions and factual answers
  assert.ok(nosotrosSource.includes('¿Dónde está ubicado Frutas y Verduras La Gaviota?'), 'Location Q&A present');
  assert.ok(nosotrosSource.includes('Plaza de Mercado San Francisco, Calle 13 #22-49, Local 10'), 'Exact physical address referenced');
  assert.ok(nosotrosSource.includes('Eduard Iván Velazco López'), 'Registered owner named in FAQ');
  assert.ok(nosotrosSource.includes('+57 318 499 0826'), 'Verified phone number present in FAQ');
  assert.ok(nosotrosSource.includes('¿Qué tipo de productos comercializamos?'), 'Product catalog Q&A present');
  assert.ok(nosotrosSource.includes('¿Cuáles son las zonas de cobertura y entrega a domicilio?'), 'Coverage Q&A present');
  assert.ok(nosotrosSource.includes('Bucaramanga'), 'Bucaramanga delivery area explicitly stated');
  assert.ok(nosotrosSource.includes('¿En qué se diferencian los clientes de hogar y los clientes de negocio?'), 'Retail vs B2B explained');
});

test('Infrastructure: Health check route responds with operational metrics and checks', async () => {
  const healthMod = loadModule('app/api/health/route.ts');
  const res = await healthMod.GET();
  
  assert.ok(res.body, 'Health response body exists');
  assert.equal(res.body.service, 'la-gaviota-storefront');
  assert.equal(res.body.release_phase, 'LG-PROD-R2A');
  assert.ok(typeof res.body.uptime_seconds === 'number', 'Uptime reported');
  assert.ok(res.body.checks, 'Checks object present');
});

test('SEO: Middleware applies X-Robots-Tag: noindex, nofollow to private routes', () => {
  const middlewareSource = fs.readFileSync(path.resolve(__dirname, '..', 'middleware.ts'), 'utf8');
  assert.ok(middlewareSource.includes("response.headers.set('X-Robots-Tag', 'noindex, nofollow')"), 'X-Robots-Tag set in middleware');
  assert.ok(middlewareSource.includes("isAdminRoute"), 'Protects admin routes');
  assert.ok(middlewareSource.includes("url.pathname.startsWith('/retail')"), 'Protects retail portal');
  assert.ok(middlewareSource.includes("url.pathname.startsWith('/checkout')"), 'Protects checkout routes');
});

