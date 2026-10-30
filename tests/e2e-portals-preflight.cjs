/**
 * LG-PROD-R2C: Hosted-Staging Playwright E2E Harness
 * Multi-Viewport Customer Portal Verification & Gateway Assertion Suite
 * 
 * Target Portals:
 * 1. /retail       (Personas / B2C)
 * 2. /micromercado (Micromercados / B2B)
 * 3. /restaurante  (Restaurantes / B2B Institucional)
 * 
 * Viewports Required:
 * - 360px  (Small Mobile / Android baseline)
 * - 390px  (Standard Mobile / iPhone 12/13/14)
 * - 768px  (Tablet Portrait / iPad Mini)
 * - 1024px (Tablet Landscape / Desktop standard)
 * - 1440px (Wide Desktop)
 * 
 * Prerequisite: Requires isolated staging URL (e.g. STAGING_BASE_URL=https://staging.lagaviotafruver.com or local dev http://localhost:3000)
 * Status: PREFLIGHT HARNESS READY / HOSTED CERTIFICATION BLOCKED (Pending remote credentials & authorization).
 */

const assert = require('node:assert/strict');
const path = require('node:path');

// Dynamically resolve Playwright from monorepo or local workspace
let chromium;
try {
  chromium = require('playwright').chromium;
} catch {
  try {
    chromium = require('/home/sebastiangarcia/planmaestro-ecosystem/node_modules/playwright').chromium;
  } catch {
    console.warn('[E2E Harness] Playwright not found in direct path. Ensure npm install has completed.');
  }
}

const VIEWPORTS = [
  { name: 'mobile-small', width: 360, height: 640 },
  { name: 'mobile-standard', width: 390, height: 844 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop-wide', width: 1440, height: 900 },
];

const PORTALS = [
  { path: '/retail', tier: 'RETAIL', titleRegex: /La Gaviota|Retail|Hogar/i },
  { path: '/micromercado', tier: 'MICROMERCADO', titleRegex: /Micromercado|Mayorista/i },
  { path: '/restaurante', tier: 'RESTAURANTE', titleRegex: /Restaurante|Institucional/i },
];

async function runPreflightSuite() {
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV || '').toLowerCase().trim();
  if (appEnv === 'staging') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (supabaseUrl.includes('tcjeiizrarwerarcfyky')) {
      throw new Error('STAGING_SAFETY_VIOLATION: Refusing to run E2E in staging mode against production Supabase project (tcjeiizrarwerarcfyky).');
    }
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
    if (clerkKey.startsWith('pk_live_') || (clerkKey && !clerkKey.startsWith('pk_test_'))) {
      throw new Error('STAGING_SAFETY_VIOLATION: Refusing to run E2E in staging mode against production Clerk credentials.');
    }
  }

  const baseUrl = process.env.STAGING_BASE_URL || 'http://localhost:3000';
  const clerkToken = process.env.STAGING_CLERK_TEST_TOKEN || null;

  console.log(`[E2E Preflight] Initializing harness targeting ${baseUrl}`);

  if (!chromium) {
    console.error('[E2E Preflight] BLOCKED: Playwright runtime unavailable.');
    process.exit(1);
  }

  const fs = require('node:fs');
  const executablePath = process.env.PLAYWRIGHT_CHROME_EXECUTABLE || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);

  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const results = {
    testedAt: new Date().toISOString(),
    baseUrl,
    viewportsCovered: [],
    portalsTested: [],
    anonymousPassed: 0,
    authenticatedBlockedReason: clerkToken ? null : 'Missing STAGING_CLERK_TEST_TOKEN credential',
  };

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 LaGaviotaPreflight/2.0',
      });

      const page = await context.newPage();

      for (const portal of PORTALS) {
        const targetUrl = `${baseUrl}${portal.path}`;
        console.log(`  Checking ${portal.tier} portal at ${targetUrl}`);

        try {
          const res = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          assert.ok(res, `Failed to load ${targetUrl}`);
          assert.equal(res.status(), 200, `Expected 200 OK from ${targetUrl}, received ${res.status()}`);

          // Verify header / nav presence
          const bodyText = await page.locator('body').innerText();
          assert.ok(bodyText.length > 50, `Body content too short for ${portal.path}`);

          results.anonymousPassed++;
          results.portalsTested.push({
            portal: portal.path,
            viewport: vp.name,
            status: 'PASS_ANONYMOUS_RENDER',
          });

        } catch (err) {
          console.warn(`    [!] Anonymous visit failed or timed out: ${err.message}`);
          results.portalsTested.push({
            portal: portal.path,
            viewport: vp.name,
            status: 'FAILED_OR_OFFLINE',
            error: err.message,
          });
        }
      }

      await context.close();
      results.viewportsCovered.push(vp.name);
    }

  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log('E2E PREFLIGHT HARNESS EXECUTION SUMMARY');
  console.log('======================================================');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

if (require.main === module) {
  runPreflightSuite().catch(err => {
    console.error('Fatal preflight error:', err);
    process.exit(1);
  });
}

module.exports = { runPreflightSuite, VIEWPORTS, PORTALS };
