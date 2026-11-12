const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');

test('Admin Analytics: DB Migration for analytics_page_views exists and is valid SQL', () => {
  const migrationPath = path.join(REPO_ROOT, 'supabase/migrations/20261112_analytics_page_views.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.analytics_page_views/);
  assert.match(sql, /visitor_id/);
  assert.match(sql, /session_id/);
  assert.match(sql, /referrer_channel/);
  assert.match(sql, /device_type/);
});

test('Admin Analytics: Beacon collection route exists and handles telemetry', () => {
  const routePath = path.join(REPO_ROOT, 'app/api/analytics/collect/route.ts');
  assert.ok(fs.existsSync(routePath), 'API route collect must exist');
  const code = fs.readFileSync(routePath, 'utf8');
  assert.match(code, /POST/);
  assert.match(code, /analytics_page_views/);
  assert.match(code, /classifyChannel/);
});

test('Admin Analytics: Client tracker component is integrated into app/layout.tsx', () => {
  const trackerPath = path.join(REPO_ROOT, 'src/components/analytics/AnalyticsTracker.tsx');
  assert.ok(fs.existsSync(trackerPath), 'AnalyticsTracker component must exist');
  const layoutPath = path.join(REPO_ROOT, 'app/layout.tsx');
  const layoutCode = fs.readFileSync(layoutPath, 'utf8');
  assert.match(layoutCode, /AnalyticsTracker/);
});

test('Admin Analytics: Server action siteAnalytics exports getSiteAnalyticsSummary', () => {
  const actionPath = path.join(REPO_ROOT, 'src/actions/siteAnalytics.ts');
  assert.ok(fs.existsSync(actionPath), 'siteAnalytics.ts must exist');
  const code = fs.readFileSync(actionPath, 'utf8');
  assert.match(code, /export async function getSiteAnalyticsSummary/);
});

test('Admin Analytics: Dashboard page and client component exist', () => {
  const pagePath = path.join(REPO_ROOT, 'app/admin/analytics/page.tsx');
  const clientPath = path.join(REPO_ROOT, 'app/admin/analytics/AnalyticsDashboardClient.tsx');
  assert.ok(fs.existsSync(pagePath), 'page.tsx must exist');
  assert.ok(fs.existsSync(clientPath), 'AnalyticsDashboardClient.tsx must exist');

  const clientCode = fs.readFileSync(clientPath, 'utf8');
  assert.match(clientCode, /Recharts/i);
  assert.match(clientCode, /handleExportCSV/);
});

test('Admin Analytics: Sidebar navigation includes Analítica Web & Visitas', () => {
  const layoutPath = path.join(REPO_ROOT, 'app/admin/layout.tsx');
  const code = fs.readFileSync(layoutPath, 'utf8');
  assert.match(code, /\/admin\/analytics/);
  assert.match(code, /Analítica Web & Visitas/);
});

test('Header Navbar: Logo has explicit responsive bounds and does not overlap nav', () => {
  const headerPath = path.join(REPO_ROOT, 'app/components/layout/Header.tsx');
  const code = fs.readFileSync(headerPath, 'utf8');
  // Must NOT have a freestanding "Tienda" link that collides with the logo
  assert.doesNotMatch(code, /<Link href="\/" className="py-3 hover:text-red-700">Tienda<\/Link>/);
  assert.match(code, /href="\/tiendita"/);
  assert.match(code, /La Tiendita/);
});
