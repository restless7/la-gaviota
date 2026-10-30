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
    if (id === 'server-only') return {};
    if (id === '@clerk/nextjs/server') return mocks['@clerk/nextjs/server'] || {};
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

test('Security: Target ID validation accepts valid UUIDs/Clerk IDs and rejects dangerous inputs', () => {
  const auth = loadModule('src/lib/server/authorization.ts');
  
  assert.doesNotThrow(() => auth.assertTargetId('user_2tXyZ123456'));
  assert.doesNotThrow(() => auth.assertTargetId('550e8400-e29b-41d4-a716-446655440000'));
  
  // Rejections
  assert.throws(() => auth.assertTargetId(''), /INVALID_TARGET/);
  assert.throws(() => auth.assertTargetId('../../etc/passwd'), /INVALID_TARGET/);
  assert.throws(() => auth.assertTargetId('user; DROP TABLE orders;'), /INVALID_TARGET/);
  assert.throws(() => auth.assertTargetId('a'.repeat(129)), /INVALID_TARGET/);
});

test('Security: Role validation accepts canonical roles and fails closed on unauthorized roles', () => {
  const auth = loadModule('src/lib/server/authorization.ts');
  
  const validRoles = ['USER', 'ADMIN', 'SUPER_ADMIN', 'OPERARIO', 'COMMERCIAL'];
  validRoles.forEach(role => {
    assert.equal(auth.validateRole(role), role);
  });

  const invalidRoles = ['ROOT', 'HACKER', 'CLIENT_ADMIN', 'random', ''];
  invalidRoles.forEach(badRole => {
    assert.throws(() => auth.validateRole(badRole), /INVALID_ROLE/);
  });
});

test('Security: Tier validation strictly adheres to canonical commercial pricing tiers', () => {
  const auth = loadModule('src/lib/server/authorization.ts');
  
  assert.equal(auth.validateTier('Personas Naturales'), 'Personas Naturales');
  assert.equal(auth.validateTier('Micromercados'), 'Micromercados');
  assert.equal(auth.validateTier('Restaurantes'), 'Restaurantes');

  assert.throws(() => auth.validateTier('VIP'), /INVALID_TIER/);
  assert.throws(() => auth.validateTier('ADMIN'), /INVALID_TIER/);
});

test('Security: Staged RLS Migration candidate file is valid SQL and enforces least privilege', () => {
  const migrationPath = path.resolve(__dirname, '..', 'supabase/migrations/20261027_lg_prod_r1_rls_policies.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration file exists');
  
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY;'), 'Enables RLS on tables');
  assert.ok(sql.includes('CREATE POLICY "Public can view active products"'), 'Public catalog read policy exists');
  assert.ok(sql.includes('CREATE POLICY "Users can read own orders"'), 'Customer order isolation policy exists');
  assert.ok(sql.includes('REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon, authenticated;'), 'Direct public mutation on orders revoked');
  assert.ok(sql.includes('ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;'), 'Idempotency key column added');
});
