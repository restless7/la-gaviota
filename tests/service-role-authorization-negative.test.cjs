const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadModuleWithAuth(relative, verifiedActor = null, stubs = {}) {
  const filename = path.join(root, relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  const module = { exports: {} };

  const customRequire = (id) => {
    if (Object.hasOwn(stubs, id)) return stubs[id];
    if (id === 'server-only') return {};
    if (id === 'next/cache') return { revalidatePath: () => {} };
    if (id === 'crypto' || id === 'node:crypto') return require('crypto');
    if (id === '@clerk/nextjs/server') {
      return {
        auth: async () => ({ userId: verifiedActor?.userId || null }),
        clerkClient: async () => ({
          users: {
            getUser: async (uid) => {
              if (!verifiedActor || verifiedActor.userId !== uid) return null;
              return {
                id: uid,
                banned: false,
                locked: false,
                publicMetadata: { role: verifiedActor.role, tier: verifiedActor.tier }
              };
            }
          }
        })
      };
    }
    if (id === './safetyGuard' || id.endsWith('safetyGuard')) {
      return { assertEnvironmentSafety: () => {}, assertStagingSafety: () => {} };
    }
    if (id === './authorization' || id.endsWith('authorization')) {
      return loadModuleWithAuth('src/lib/server/authorization.ts', verifiedActor, stubs);
    }
    if (id === './database' || id.endsWith('database')) {
      return {
        getServerDatabase: (actor) => {
          if (!actor || actor.role === 'INVALID') throw new Error('INVALID_ACTOR');
          return {
            from: () => ({
              select: () => ({ eq: () => ({ single: async () => ({ data: {}, error: null }) }) }),
              insert: async () => ({ data: {}, error: null }),
              update: async () => ({ data: {}, error: null }),
              delete: async () => ({ data: {}, error: null })
            })
          };
        },
        readPublicInventoryFlag: async () => ({ track_inventory: false })
      };
    }
    if (id === './checkoutValidation' || id.endsWith('checkoutValidation')) {
      return {
        assertOrderWrite: () => {},
        normalizeCheckoutItems: () => []
      };
    }
    if (id === './idempotency' || id.endsWith('idempotency')) {
      return { computeCheckoutFingerprint: () => 'fake_fp' };
    }
    if (id === './orderWriter' || id.endsWith('orderWriter')) {
      return loadModuleWithAuth('src/lib/server/orderWriter.ts', verifiedActor, stubs);
    }
    throw new Error(`Unmocked dependency in auth test: ${id}`);
  };

  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: customRequire,
    Map, Set, Buffer, FormData, Date, console, process: { env: { APP_ENV: 'production' } }
  }, { filename });

  return module.exports;
}

test('NEGATIVE-AUTH-ANON: anonymous user cannot execute privileged Server Actions', async () => {
  // VerifiedActor is null (unauthenticated visitor)
  const authModule = loadModuleWithAuth('src/lib/server/authorization.ts', null);

  await assert.rejects(async () => {
    await authModule.requireCapability('catalog.manage');
  }, /FORBIDDEN/);

  await assert.rejects(async () => {
    await authModule.requireCapability('orders.manage');
  }, /FORBIDDEN/);

  await assert.rejects(async () => {
    await authModule.requireCapability('audit.read');
  }, /FORBIDDEN/);
});

test('NEGATIVE-AUTH-ROLE: normal customer (USER) rejected for admin capabilities', async () => {
  // Verified regular customer actor
  const clientActor = { userId: 'user_regular_customer', role: 'USER', tier: 'Personas Naturales' };
  const authModule = loadModuleWithAuth('src/lib/server/authorization.ts', clientActor);

  // Assert user has NO staff capabilities
  const actor = await authModule.getActor();
  assert.equal(actor.role, 'USER');
  assert.equal(authModule.hasCapability(actor, 'catalog.manage'), false);
  assert.equal(authModule.hasCapability(actor, 'orders.manage'), false);
  assert.equal(authModule.hasCapability(actor, 'pricing.manage'), false);
  assert.equal(authModule.hasCapability(actor, 'inventory.manage'), false);

  await assert.rejects(async () => {
    await authModule.requireCapability('catalog.manage');
  }, /FORBIDDEN/);

  await assert.rejects(async () => {
    await authModule.requireCapability('orders.manage');
  }, /FORBIDDEN/);
});

test('NEGATIVE-AUTH-IDOR: user cannot create order or access resources of another user', async () => {
  const clientActor = { userId: 'user_alice_123', role: 'USER', tier: 'Personas Naturales' };
  const authModule = loadModuleWithAuth('src/lib/server/authorization.ts', clientActor);

  // Alice tries to act on behalf of Bob
  await assert.rejects(async () => {
    await authModule.requireOwnedSubject('user_bob_456');
  }, /FORBIDDEN_OWNER/);

  // Alice can act on her own subject
  const ownActor = await authModule.requireOwnedSubject('user_alice_123');
  assert.equal(ownActor.userId, 'user_alice_123');
});

test('NEGATIVE-AUTH-ESCALATION: spoofed or unverified role defaults safely to USER or INVALID', async () => {
  // Actor with unapproved role string
  const spoofedActor = { userId: 'user_hacker', role: 'INJECTED_ROLE', tier: 'Personas Naturales' };
  const authModule = loadModuleWithAuth('src/lib/server/authorization.ts', spoofedActor);

  const actor = await authModule.getActor();
  assert.equal(actor.role, 'INVALID');
  assert.equal(authModule.hasCapability(actor, 'catalog.manage'), false);

  await assert.rejects(async () => {
    authModule.assertIssuedActor(actor);
  }, /INVALID_ACTOR/);
});

test('BUNDLE-SECRET-CONFINEMENT: server/database.ts enforces server-only directive', () => {
  const dbFile = fs.readFileSync(path.join(root, 'src/lib/server/database.ts'), 'utf8');
  assert.ok(
    dbFile.includes("import 'server-only'") || dbFile.includes('import "server-only"'),
    'src/lib/server/database.ts MUST include server-only directive to prevent bundling into client code'
  );
});
