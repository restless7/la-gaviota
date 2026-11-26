import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

const NEON_URL =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_Aw84YcTifWXx@ep-quiet-shadow-bbsvjiv3.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString: NEON_URL });

function stripSupabaseOnlySql(sql) {
  return sql
    // Remove RLS policy statements referencing Supabase roles/auth
    .replace(/CREATE POLICY[\s\S]*?;/gi, '')
    .replace(/DROP POLICY[\s\S]*?;/gi, '')
    .replace(/ALTER TABLE[\s\S]*?ENABLE ROW LEVEL SECURITY\s*;/gi, '')
    .replace(/REVOKE ALL ON SCHEMA lg_auth[\s\S]*?;/gi, '')
    .replace(/GRANT USAGE ON SCHEMA lg_auth[\s\S]*?;/gi, '')
    .replace(/GRANT EXECUTE ON FUNCTION[\s\S]*?;/gi, '')
    .replace(/REVOKE ALL ON FUNCTION[\s\S]*?;/gi, '')
    .replace(/REVOKE EXECUTE ON FUNCTION[\s\S]*?;/gi, '');
}

async function run() {
  const client = await pool.connect();
  try {
    console.log('1. Applying Prisma init migration...');
    const initSql = fs.readFileSync(
      path.resolve('prisma/migrations/20261105000000_init/migration.sql'),
      'utf8'
    );
    await client.query(initSql);
    console.log('   ✓ Core 17 tables created.');

    // Additional tables & migrations
    const extraFiles = [
      'supabase/migrations/20261112_analytics_page_views.sql',
      'supabase/migrations/20261112_customer_inquiries_pqrs.sql',
      'supabase/migrations/20261113_promotions_and_launch_discounts.sql',
      'supabase/migrations/20261123_grocery_subscriptions.sql',
    ];

    for (const file of extraFiles) {
      console.log(`2. Applying ${file}...`);
      const raw = fs.readFileSync(path.resolve(file), 'utf8');
      const cleaned = stripSupabaseOnlySql(raw);
      await client.query(cleaned);
      console.log(`   ✓ Applied ${file}`);
    }

    console.log('3. Creating payment_intents, inventory_movements, wompi_event_receipts, lg_auth & RPCs...');
    const rlsSql = fs.readFileSync(
      path.resolve('supabase/migrations/20261027_lg_prod_r1_rls_policies.sql'),
      'utf8'
    );
    // Extract from section 2 (payment_intents) through create_order_atomic, plus lg_auth adjusted for neondb_owner
    const startIdx = rlsSql.indexOf('-- 2. Durable Payment Intents Table');
    const endIdx = rlsSql.indexOf('-- 8. Atomic Wompi Webhook Processing RPC');
    let coreRpcSql = stripSupabaseOnlySql(rlsSql.slice(startIdx, endIdx));
    // Allow neondb_owner in session_user checks
    coreRpcSql = coreRpcSql.replace(
      "session_user IN ('postgres', 'sebastiangarcia')",
      "session_user IN ('postgres', 'sebastiangarcia', 'neondb_owner')"
    );
    await client.query(coreRpcSql);

    // Apply latest process_wompi_transaction from 20261111_wompi_pago_pendiente.sql
    let wompiSql = fs.readFileSync(
      path.resolve('supabase/migrations/20261111_wompi_pago_pendiente.sql'),
      'utf8'
    );
    wompiSql = stripSupabaseOnlySql(wompiSql).replace(
      "session_user IN ('postgres', 'sebastiangarcia')",
      "session_user IN ('postgres', 'sebastiangarcia', 'neondb_owner')"
    );
    await client.query(wompiSql);
    console.log('   ✓ RPCs create_order_atomic and process_wompi_transaction created.');

    // Also ensure columns from 20261111_wompi_pago_pendiente or orders.discount_amount exist
    await client.query(`
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_fingerprint TEXT;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduled_delivery_date TEXT;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_window TEXT;
      ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subscription_id UUID;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
    `);

    // Verify all tables
    const { rows } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log(`\n✅ Neon schema ready! ${rows.length} tables:`, rows.map(r => r.table_name).join(', '));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

