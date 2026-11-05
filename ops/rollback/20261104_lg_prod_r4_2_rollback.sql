-- LG-PROD-R4.2: Production Rollback & Emergency Contingency Procedures (Hardened)
-- Target: Frutas y Verduras La Gaviota (tcjeiizrarwerarcfyky)
-- Location: ops/rollback/20261104_lg_prod_r4_2_rollback.sql
-- NOTICE: Isolated in ops/rollback/ to prevent discovery by Supabase CLI migrations.

-- =====================================================================================
-- CRITICAL DATA PRESERVATION & ZERO-EXPOSURE INVARIANT
-- =====================================================================================
-- 1. DISABLING ROW LEVEL SECURITY (RLS) IS STRICTLY PROHIBITED IN PRODUCTION.
--    Disabling RLS exposes tables to unauthorized access vectors.
-- 2. PROCEDURE 1 (Non-Destructive Fail-Closed Mitigation):
--    - KEEPS RLS ENABLED across all tables.
--    - Restores explicit, least-privilege policies.
--    - Revokes direct anonymous/authenticated write access on core tables.
--    - Replaces problematic RPCs with fail-closed stubs without dropping tables or columns.
-- 3. PROCEDURE 2 (Exceptional Cold Pre-Launch Teardown):
--    - BLOCKED if ANY operational records exist across orders, customers,
--      inventory_movements, payment_intents, receipts, or audit logs.
-- =====================================================================================

-- =====================================================================================
-- PROCEDURE 1: NON-DESTRUCTIVE SAFE MITIGATION (COMMERCIAL SAFE - RLS PRESERVED)
-- =====================================================================================
BEGIN;

-- 1. Ensure RLS REMAINS MANDATORILY ENABLED on all core tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_credit_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buying_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wompi_event_receipts ENABLE ROW LEVEL SECURITY;

-- 2. Restore explicit, secure baseline policies
-- Public Catalog: read-only for active items
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Public can view active kits" ON public.kits;
CREATE POLICY "Public can view active kits" ON public.kits
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Public can view kit items" ON public.kit_items;
CREATE POLICY "Public can view kit items" ON public.kit_items
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.kits k WHERE k.id = kit_items.kit_id AND k.status = 'active'));

-- Customer isolation: authenticated users read only their own rows
DROP POLICY IF EXISTS "Users can read own profile" ON public.customers;
CREATE POLICY "Users can read own profile" ON public.customers
  FOR SELECT TO authenticated
  USING (clerk_user_id = lg_auth.clerk_uid());

DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (clerk_user_id = lg_auth.clerk_uid());

DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
CREATE POLICY "Users can read own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
      AND o.clerk_user_id = lg_auth.clerk_uid()
  ));

-- 3. Fail-closed: Strictly revoke direct client writes (Server Actions using service_role remain authoritative)
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payment_intents FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.inventory_movements FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.wompi_event_receipts FROM anon, authenticated;

-- 4. Fail-closed RPC mitigation: replace problematic checkout RPC with explicit fail-closed message if corrupted
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order jsonb,
  p_items jsonb,
  p_payment_intent jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Fail-closed: redirect all orders through secure backend orderWriter
  RAISE EXCEPTION 'CHECKOUT_RPC_MITIGATION_ACTIVE: Order processing redirected through server-side orderWriter.';
END;
$$;

-- 5. Audit Log Entry for Rollback Execution
INSERT INTO public.audit_logs (user_id, action, entity, entity_id, details, created_at)
VALUES (
  'SYSTEM_ROLLBACK_OPERATOR',
  'ROLLBACK_PROCEDURE_1_EXECUTED',
  'system_schema',
  'tcjeiizrarwerarcfyky',
  '{"status": "mitigated", "rls_remains_active": true, "data_loss_prevented": true}'::jsonb,
  NOW()
);

COMMIT;


-- =====================================================================================
-- PROCEDURE 2: EXCEPTIONAL COLD PRE-LAUNCH SCHEMA TEARDOWN (EXCEPTIONAL ADMINISTRATIVE)
-- PROHIBITED TO RUN IN PRODUCTION IF ANY OPERATIONAL DATA EXISTS.
-- Requires comprehensive multi-table inventory check before executing any DDL drop.
-- =====================================================================================
/*
DO $$
DECLARE
  v_orders_count BIGINT;
  v_customers_count BIGINT;
  v_movements_count BIGINT;
  v_intents_count BIGINT;
  v_receipts_count BIGINT;
  v_audit_count BIGINT;
BEGIN
  SELECT count(*) INTO v_orders_count FROM public.orders;
  SELECT count(*) INTO v_customers_count FROM public.customers;
  SELECT count(*) INTO v_movements_count FROM public.inventory_movements;
  SELECT count(*) INTO v_intents_count FROM public.payment_intents;
  SELECT count(*) INTO v_receipts_count FROM public.wompi_event_receipts;
  SELECT count(*) INTO v_audit_count FROM public.audit_logs;

  IF (v_orders_count + v_customers_count + v_movements_count + v_intents_count + v_receipts_count + v_audit_count) > 0 THEN
    RAISE EXCEPTION 'ABORTING_DESTRUCTIVE_ROLLBACK: Operational data detected! (orders=%, customers=%, movements=%, intents=%, receipts=%, audit=%). Hard drops would destroy commercial records.',
      v_orders_count, v_customers_count, v_movements_count, v_intents_count, v_receipts_count, v_audit_count;
  END IF;
END $$;

BEGIN;

DROP POLICY IF EXISTS "Users can view own business applications" ON public.business_applications;
DROP POLICY IF EXISTS "Users can read own payment intents" ON public.payment_intents;
DROP POLICY IF EXISTS "Users can manage own buying templates" ON public.buying_templates;
DROP POLICY IF EXISTS "Users can read own buying templates" ON public.buying_templates;
DROP POLICY IF EXISTS "Users can read own credit profile" ON public.b2b_credit_profiles;
DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own profile" ON public.customers;
DROP POLICY IF EXISTS "Public can view kit items" ON public.kit_items;
DROP POLICY IF EXISTS "Public can view active kits" ON public.kits;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

DROP FUNCTION IF EXISTS public.process_wompi_transaction(TEXT, jsonb);
DROP FUNCTION IF EXISTS public.create_order_atomic(jsonb, jsonb, jsonb);

DROP FUNCTION IF EXISTS lg_auth.caller_role();
DROP FUNCTION IF EXISTS lg_auth.clerk_uid();
DROP SCHEMA IF EXISTS lg_auth CASCADE;

DROP TABLE IF EXISTS public.wompi_event_receipts CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.payment_intents CASCADE;

DROP INDEX IF EXISTS public.idx_orders_idempotency_key;
DROP INDEX IF EXISTS public.idx_orders_idempotency_fingerprint;
DROP INDEX IF EXISTS public.idx_orders_clerk_user_id;
DROP INDEX IF EXISTS public.idx_orders_created_at;
DROP INDEX IF EXISTS public.idx_order_items_order_id;

ALTER TABLE public.orders DROP COLUMN IF EXISTS idempotency_key CASCADE;
ALTER TABLE public.orders DROP COLUMN IF EXISTS idempotency_fingerprint CASCADE;
ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_status CASCADE;
ALTER TABLE public.orders DROP COLUMN IF EXISTS payment_reference CASCADE;
ALTER TABLE public.orders DROP COLUMN IF EXISTS client_metadata CASCADE;

GRANT CREATE ON SCHEMA public TO anon, authenticated;

COMMIT;
*/
