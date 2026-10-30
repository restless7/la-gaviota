const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const ts = require('typescript');
const { execSync } = require('node:child_process');

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
  assertStagingSafety,
  sanitizeUrlForLogging,
  PROD_SUPABASE_PROJECT_ID,
  PROD_SUPABASE_BLOCKLIST,
  STAGING_SUPABASE_PROJECT_ID,
  STAGING_SUPABASE_ALLOWLIST
} = loadTS('src/lib/safetyGuard.ts');

test('GUARD-PROD-REFUSAL: assertStagingSafety rejects production Supabase in staging mode', () => {
  assert.throws(() => {
    assertStagingSafety({
      appEnv: 'staging',
      supabaseUrl: `https://${PROD_SUPABASE_PROJECT_ID}.supabase.co`,
      clerkPublishableKey: 'pk_test_123',
      wompiPubKey: 'pub_test_123'
    });
  }, (err) => {
    return err instanceof Error &&
      err.message.includes('STAGING_SAFETY_VIOLATION') &&
      err.message.includes(PROD_SUPABASE_PROJECT_ID);
  });
});

test('GUARD-ALLOWLIST-ENFORCEMENT: assertStagingSafety rejects unapproved Supabase projects in staging', () => {
  assert.throws(() => {
    assertStagingSafety({
      appEnv: 'staging',
      supabaseUrl: 'https://unauthorized-project-12345.supabase.co',
      clerkPublishableKey: 'pk_test_123',
      clerkSecretKey: 'sk_test_123',
      wompiPubKey: 'pub_test_123',
      wompiPrvKey: 'prv_test_123'
    });
  }, (err) => {
    return err instanceof Error &&
      err.message.includes('STAGING_SAFETY_VIOLATION') &&
      err.message.includes('not in the authorized staging allowlist');
  });
});

test('GUARD-SUPABASE-ALLOW: assertStagingSafety allows authorized staging Supabase project', () => {
  assert.doesNotThrow(() => {
    assertStagingSafety({
      appEnv: 'staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_ID}.supabase.co`,
      databaseUrl: `postgresql://postgres.${STAGING_SUPABASE_PROJECT_ID}:mypassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
      clerkPublishableKey: 'pk_test_123',
      clerkSecretKey: 'sk_test_123',
      wompiPubKey: 'pub_test_123',
      wompiPrvKey: 'prv_test_123'
    });
  });
});

test('GUARD-MULTI-VECTOR: assertStagingSafety detects production project across all connection vectors', () => {
  // Test DATABASE_URL vector
  assert.throws(() => {
    assertStagingSafety({
      appEnv: 'staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_ID}.supabase.co`,
      databaseUrl: `postgresql://postgres:secret@db.${PROD_SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`
    });
  }, (err) => err.message.includes(PROD_SUPABASE_PROJECT_ID));

  // Test DIRECT_URL vector
  assert.throws(() => {
    assertStagingSafety({
      appEnv: 'staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_ID}.supabase.co`,
      directUrl: `postgresql://postgres.${PROD_SUPABASE_PROJECT_ID}:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
    });
  }, (err) => err.message.includes(PROD_SUPABASE_PROJECT_ID));
});

test('GUARD-SECRET-REDACTION: assertStagingSafety redacts credentials and never logs passwords', () => {
  const rawUrl = 'postgresql://postgres:SuperSecretPassword123!@aws-0-us-east-1.pooler.supabase.com:5432/postgres';
  const sanitized = sanitizeUrlForLogging(rawUrl);
  assert.ok(!sanitized.includes('SuperSecretPassword123!'), 'Sanitized URL must not contain the raw password');
  assert.ok(sanitized.includes('***'), 'Sanitized URL must replace password with ***');

  // Verify that when throwing, the error message does not contain the password
  try {
    assertStagingSafety({
      appEnv: 'staging',
      databaseUrl: `postgresql://postgres:SuperSecretPassword123!@db.${PROD_SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`
    });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(!err.message.includes('SuperSecretPassword123!'), 'Error message must not leak password');
    assert.ok(err.message.includes('***'), 'Error message must contain redacted mask');
  }
});

test('GUARD-CLERK-REFUSAL: assertStagingSafety rejects live Clerk keys in staging mode', () => {
  // pk_live check
  assert.throws(() => {
    assertStagingSafety({
      appEnv: 'staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_ID}.supabase.co`,
      clerkPublishableKey: 'pk_live_example123',
      wompiPubKey: 'pub_test_123'
    });
  }, (err) => {
    return err instanceof Error &&
      err.message.includes('STAGING_SAFETY_VIOLATION') &&
      err.message.includes('Clerk');
  });

  // sk_live check
  assert.throws(() => {
    assertStagingSafety({
      appEnv: 'staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_ID}.supabase.co`,
      clerkPublishableKey: 'pk_test_example123',
      clerkSecretKey: 'sk_live_example123',
      wompiPubKey: 'pub_test_123'
    });
  }, (err) => {
    return err instanceof Error &&
      err.message.includes('STAGING_SAFETY_VIOLATION') &&
      err.message.includes('Clerk');
  });
});

test('GUARD-WOMPI-REFUSAL: assertStagingSafety rejects live Wompi credentials in staging mode', () => {
  // pub_prod check
  assert.throws(() => {
    assertStagingSafety({
      appEnv: 'staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_ID}.supabase.co`,
      clerkPublishableKey: 'pk_test_123',
      wompiPubKey: 'pub_prod_realcredentials'
    });
  }, (err) => {
    return err instanceof Error &&
      err.message.includes('STAGING_SAFETY_VIOLATION') &&
      err.message.includes('Wompi');
  });

  // prv_prod check
  assert.throws(() => {
    assertStagingSafety({
      appEnv: 'staging',
      supabaseUrl: `https://${STAGING_SUPABASE_PROJECT_ID}.supabase.co`,
      clerkPublishableKey: 'pk_test_123',
      wompiPubKey: 'pub_test_123',
      wompiPrvKey: 'prv_prod_secretcredentials'
    });
  }, (err) => {
    return err instanceof Error &&
      err.message.includes('STAGING_SAFETY_VIOLATION') &&
      err.message.includes('Wompi');
  });
});

test('GUARD-LOCAL-PASS: assertStagingSafety allows local/dev without staging constraints', () => {
  assert.doesNotThrow(() => {
    assertStagingSafety({
      appEnv: 'development',
      supabaseUrl: 'http://localhost:54321',
      databaseUrl: 'postgresql://postgres:postgres@localhost:54329/postgres'
    });
  });
});

test('GUARD-CLI-REFUSAL: script execution halts with error when staging environment targets production', () => {
  const env = {
    ...process.env,
    APP_ENV: 'staging',
    NEXT_PUBLIC_APP_ENV: 'staging',
    NEXT_PUBLIC_SUPABASE_URL: `https://${PROD_SUPABASE_PROJECT_ID}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  };

  assert.throws(() => {
    execSync('npx tsx scripts/seed-supabase.ts', {
      cwd: path.resolve(__dirname, '..'),
      env,
      stdio: 'pipe'
    });
  }, (err) => {
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';
    const combined = stderr + stdout;
    return combined.includes('STAGING_SAFETY_VIOLATION') && combined.includes(PROD_SUPABASE_PROJECT_ID);
  });
});
