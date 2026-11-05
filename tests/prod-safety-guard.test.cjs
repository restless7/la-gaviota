const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');

function loadTS(relativePath) {
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const mod = { exports: {} };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', compiled);
  fn(mod, mod.exports, require, path.dirname(fullPath), fullPath);
  return mod.exports;
}

const {
  assertEnvironmentSafety,
  PROD_SUPABASE_PROJECT_ID,
  PROD_SUPABASE_ALLOWLIST,
  STAGING_SUPABASE_PROJECT_ID
} = loadTS('src/lib/safetyGuard.ts');

function makeFakeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fakesignature`;
}

test('GUARD-FAIL-CLOSED: rejects execution when APP_ENV is unset or empty', () => {
  const savedEnv = process.env.APP_ENV;
  delete process.env.APP_ENV;
  try {
    assert.throws(() => {
      assertEnvironmentSafety({ appEnv: '' });
    }, /ENVIRONMENT_SAFETY_VIOLATION.*unset or empty/);
  } finally {
    if (savedEnv) process.env.APP_ENV = savedEnv;
  }
});

test('GUARD-FAIL-CLOSED: rejects execution when APP_ENV is unrecognized', () => {
  assert.throws(() => {
    assertEnvironmentSafety({ appEnv: 'custom_unrecognized_env' });
  }, /ENVIRONMENT_SAFETY_VIOLATION.*Unrecognized APP_ENV/);
});

test('GUARD-DEV-RESTRICTION: development mode rejects remote production Supabase', () => {
  assert.throws(() => {
    assertEnvironmentSafety({
      appEnv: 'development',
      supabaseUrl: `https://${PROD_SUPABASE_PROJECT_ID}.supabase.co`
    });
  }, /STAGING_SAFETY_VIOLATION.*targets production Supabase project/);
});

test('GUARD-DEV-RESTRICTION: development mode rejects remote staging Supabase', () => {
  assert.throws(() => {
    assertEnvironmentSafety({
      appEnv: 'development',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_ID}.supabase.co`
    });
  }, /DEVELOPMENT_SAFETY_VIOLATION.*targets cloud staging project/);
});

test('GUARD-DEV-RESTRICTION: development mode allows local loopback databases', () => {
  assert.doesNotThrow(() => {
    assertEnvironmentSafety({
      appEnv: 'development',
      supabaseUrl: 'http://localhost:54321',
      databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:54329/postgres'
    });
  });
});

test('GUARD-LEAK-PREVENTION: rejects sb_secret_* in NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
  assert.throws(() => {
    assertEnvironmentSafety({
      appEnv: 'production',
      supabaseUrl: `https://${PROD_SUPABASE_PROJECT_ID}.supabase.co`,
      supabaseAnonKey: 'sb_secret_supercriticalsecretkey123',
      clerkPublishableKey: 'pk_live_realprod',
      clerkSecretKey: 'sk_live_realprod'
    });
  }, /SECURITY_LEAK_VIOLATION.*Critical secret key detected in public client variable/);
});

test('GUARD-LEAK-PREVENTION: rejects JWT with service_role in NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
  const leakedJwt = makeFakeJwt({ ref: PROD_SUPABASE_PROJECT_ID, role: 'service_role' });
  assert.throws(() => {
    assertEnvironmentSafety({
      appEnv: 'production',
      supabaseUrl: `https://${PROD_SUPABASE_PROJECT_ID}.supabase.co`,
      supabaseAnonKey: leakedJwt,
      clerkPublishableKey: 'pk_live_realprod',
      clerkSecretKey: 'sk_live_realprod'
    });
  }, /SECURITY_LEAK_VIOLATION.*Service role JWT detected in public client variable/);
});

test('GUARD-JWT-REF-ALIGNMENT: rejects production Supabase key with wrong project ref', () => {
  const mismatchedJwt = makeFakeJwt({ ref: 'wrong_project_ref', role: 'anon' });
  assert.throws(() => {
    assertEnvironmentSafety({
      appEnv: 'production',
      supabaseUrl: `https://${PROD_SUPABASE_PROJECT_ID}.supabase.co`,
      supabaseAnonKey: mismatchedJwt,
      clerkPublishableKey: 'pk_live_realprod',
      clerkSecretKey: 'sk_live_realprod'
    });
  }, /PRODUCTION_SAFETY_VIOLATION.*does not match production project/);
});

test('PROD-GUARD-ALLOW: allows authorized production Supabase with live keys and matching JWT ref', () => {
  const prodAnonJwt = makeFakeJwt({ ref: PROD_SUPABASE_PROJECT_ID, role: 'anon' });
  const prodSrvJwt = makeFakeJwt({ ref: PROD_SUPABASE_PROJECT_ID, role: 'service_role' });

  assert.doesNotThrow(() => {
    assertEnvironmentSafety({
      appEnv: 'production',
      supabaseUrl: `https://${PROD_SUPABASE_PROJECT_ID}.supabase.co`,
      databaseUrl: `postgresql://postgres.${PROD_SUPABASE_PROJECT_ID}:livepassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
      supabaseAnonKey: prodAnonJwt,
      supabaseServiceKey: prodSrvJwt,
      clerkPublishableKey: 'pk_live_realproductionkey123',
      clerkSecretKey: 'sk_live_realproductionsecret123'
    });
  });
});

test('PROD-GUARD-STAGING-REFUSAL: rejects staging Supabase target when in production mode', () => {
  assert.throws(() => {
    assertEnvironmentSafety({
      appEnv: 'production',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_ID}.supabase.co`,
      clerkPublishableKey: 'pk_live_123',
      clerkSecretKey: 'sk_live_123'
    });
  }, /PRODUCTION_SAFETY_VIOLATION.*targets staging Supabase project/);
});

test('PROD-GUARD-LOOPBACK-REFUSAL: rejects localhost / loopback targets in production mode', () => {
  assert.throws(() => {
    assertEnvironmentSafety({
      appEnv: 'production',
      supabaseUrl: `https://${PROD_SUPABASE_PROJECT_ID}.supabase.co`,
      databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
      clerkPublishableKey: 'pk_live_123',
      clerkSecretKey: 'sk_live_123'
    });
  }, /PRODUCTION_SAFETY_VIOLATION.*local loopback database/);
});

test('PROD-GUARD-CLERK-TEST-REFUSAL: rejects pk_test_* keys in production mode', () => {
  assert.throws(() => {
    assertEnvironmentSafety({
      appEnv: 'production',
      supabaseUrl: `https://${PROD_SUPABASE_PROJECT_ID}.supabase.co`,
      clerkPublishableKey: 'pk_test_samplekey123',
      clerkSecretKey: 'sk_live_secret123'
    });
  }, /PRODUCTION_SAFETY_VIOLATION.*test Clerk credentials/);
});

test('PROD-GUARD-WOMPI-TEST-REFUSAL: rejects pub_test_* in production mode', () => {
  assert.throws(() => {
    assertEnvironmentSafety({
      appEnv: 'production',
      supabaseUrl: `https://${PROD_SUPABASE_PROJECT_ID}.supabase.co`,
      clerkPublishableKey: 'pk_live_123',
      clerkSecretKey: 'sk_live_123',
      wompiPubKey: 'pub_test_somekey'
    });
  }, /PRODUCTION_SAFETY_VIOLATION.*test Wompi credentials/);
});
