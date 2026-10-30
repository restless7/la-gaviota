-- LG-PROD-R2C: Secure Row Level Security (RLS), Fail-Closed RPC Boundaries & Staging Migration Candidate
-- Target: Frutas y Verduras La Gaviota
-- Scope: Least-privilege SECURITY DEFINER, search_path = '', mandatory verified Clerk JWT claims,
--        durable payment reconciliation, and audit preservation.
-- NOTICE: For execution against disposable PostgreSQL / staging environments during release rehearsal.
-- Prohibited against production without separate explicit authorization.

BEGIN;

-- 0. Schema creation privilege lockdown: prevent untrusted users from injecting objects in public
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon, authenticated;

-- 1. Orders table idempotency and payment status enhancements
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_fingerprint TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_fingerprint ON public.orders(idempotency_fingerprint);
CREATE INDEX IF NOT EXISTS idx_orders_clerk_user_id ON public.orders(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 2. Durable Payment Intents Table
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intent_id TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'ORDER_CHECKOUT', -- 'ORDER_CHECKOUT' | 'B2B_BALANCE'
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  provider TEXT NOT NULL DEFAULT 'WOMPI',
  environment TEXT NOT NULL DEFAULT 'sandbox',
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'
  reconciliation_status TEXT DEFAULT 'PENDING', -- 'PENDING' | 'RECONCILED_CALLBACK' | 'RECONCILED_POLL' | 'ESCALATED_UNRESOLVED'
  last_reconciled_at TIMESTAMPTZ,
  reconciliation_notes TEXT,
  provider_transaction_id TEXT,
  provider_reference TEXT UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS reconciliation_status TEXT DEFAULT 'PENDING';
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS last_reconciled_at TIMESTAMPTZ;
ALTER TABLE public.payment_intents ADD COLUMN IF NOT EXISTS reconciliation_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_intents_intent_id ON public.payment_intents(intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_clerk_user_id ON public.payment_intents(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_order_id ON public.payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_reconcile ON public.payment_intents(status, created_at) WHERE status = 'PENDING';

-- 3. Inventory Movement Audit Ledger
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  delta_quantity NUMERIC NOT NULL,
  reason TEXT NOT NULL, -- 'ORDER_CHECKOUT' | 'ORDER_CANCELLED' | 'MANUAL_ADJUSTMENT'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_order ON public.inventory_movements(order_id);

-- 4. Wompi Event Receipts Table for Provider Deduplication
CREATE TABLE IF NOT EXISTS public.wompi_event_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  provider_transaction_id TEXT NOT NULL,
  reference TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_in_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wompi_receipts_tx ON public.wompi_event_receipts(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_wompi_receipts_ref ON public.wompi_event_receipts(reference);

-- Ensure existing duplicate receipts from tests are deduplicated before adding compound constraint
DELETE FROM public.wompi_event_receipts a USING public.wompi_event_receipts b
WHERE a.ctid < b.ctid 
  AND a.provider_transaction_id = b.provider_transaction_id 
  AND a.status = b.status;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wompi_receipts_tx_status ON public.wompi_event_receipts(provider_transaction_id, status);

-- 5. Helper schema and function for Clerk JWT subject and role extraction
CREATE SCHEMA IF NOT EXISTS lg_auth;
REVOKE ALL ON SCHEMA lg_auth FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION lg_auth.clerk_uid() RETURNS TEXT 
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_raw TEXT;
  v_claims JSONB;
BEGIN
  v_raw := NULLIF(pg_catalog.current_setting('request.jwt.claims', true), '');
  IF v_raw IS NOT NULL THEN
    BEGIN
      v_claims := v_raw::jsonb;
      RETURN NULLIF(TRIM(v_claims->>'sub'), '');
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION lg_auth.caller_role() RETURNS TEXT 
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_raw TEXT;
  v_claims JSONB;
  v_role TEXT;
BEGIN
  v_raw := NULLIF(pg_catalog.current_setting('request.jwt.claims', true), '');
  IF v_raw IS NOT NULL THEN
    BEGIN
      v_claims := v_raw::jsonb;
      v_role := NULLIF(TRIM(v_claims->>'role'), '');
      IF v_role IS NOT NULL THEN
        RETURN v_role;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  v_role := NULLIF(pg_catalog.current_setting('role', true), '');
  IF v_role IS NOT NULL AND v_role <> 'none' THEN
    RETURN v_role;
  END IF;

  RETURN session_user::text;
END;
$$;

GRANT USAGE ON SCHEMA lg_auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION lg_auth.clerk_uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION lg_auth.caller_role() TO anon, authenticated, service_role;

-- 6. True ACID Transaction RPC: create_order_atomic
-- Hardened with empty search_path = '', verified Clerk JWT claims, and fail-closed security.
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order jsonb,
  p_items jsonb,
  p_payment_intent jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id UUID;
  v_idempotency_key TEXT;
  v_idempotency_fingerprint TEXT;
  v_clerk_user_id TEXT;
  v_total_amount NUMERIC;
  v_existing_order RECORD;
  v_item RECORD;
  v_prod RECORD;
  v_track_inventory BOOLEAN := false;
  v_caller_role TEXT;
  v_caller_sub TEXT;
BEGIN
  -- 0. Basic input validation
  IF p_order IS NULL THEN
    RAISE EXCEPTION 'NULL_ORDER_PAYLOAD';
  END IF;

  IF p_items IS NULL OR pg_catalog.jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_ORDER_ITEMS';
  END IF;

  v_total_amount := (p_order->>'total_amount')::NUMERIC;
  IF v_total_amount IS NULL OR v_total_amount < 0 THEN
    RAISE EXCEPTION 'INVALID_TOTAL_AMOUNT: %', v_total_amount;
  END IF;

  v_idempotency_key := NULLIF(TRIM(p_order->>'idempotency_key'), '');
  v_idempotency_fingerprint := NULLIF(TRIM(p_order->>'idempotency_fingerprint'), '');
  v_clerk_user_id := NULLIF(TRIM(p_order->>'clerk_user_id'), '');

  -- 1. Anti-Impersonation and Mandatory Caller Identity Verification
  v_caller_role := lg_auth.caller_role();
  v_caller_sub := lg_auth.clerk_uid();

  IF v_caller_role = 'authenticated' THEN
    -- P0: Authenticated customer calls strictly require verified, non-empty Clerk subject claim
    IF v_caller_sub IS NULL OR v_caller_sub = '' THEN
      RAISE EXCEPTION 'UNAUTHENTICATED_SUBJECT: Missing, empty, or invalid Clerk subject claim in authenticated session';
    END IF;
    IF v_clerk_user_id IS NULL OR v_clerk_user_id = '' THEN
      RAISE EXCEPTION 'UNAUTHENTICATED_CHECKOUT: clerk_user_id is required';
    END IF;
    IF v_clerk_user_id IS DISTINCT FROM v_caller_sub THEN
      RAISE EXCEPTION 'FORBIDDEN_USER_IMPERSONATION: Authenticated subject % cannot order as %',
        v_caller_sub, v_clerk_user_id;
    END IF;
  ELSIF v_caller_role = 'service_role' OR (v_caller_role = session_user AND session_user IN ('postgres', 'sebastiangarcia')) THEN
    -- Trusted server-side execution path (e.g. backend private orderWriter with pre-verified session)
    IF v_clerk_user_id IS NULL OR v_clerk_user_id = '' THEN
      RAISE EXCEPTION 'UNAUTHENTICATED_CHECKOUT: clerk_user_id is required';
    END IF;
    -- If a subject claim is attached to the ambient context in service path, ensure consistency
    IF v_caller_sub IS NOT NULL AND v_caller_sub <> '' AND v_clerk_user_id IS DISTINCT FROM v_caller_sub THEN
      RAISE EXCEPTION 'FORBIDDEN_USER_IMPERSONATION: Scoped subject % cannot order as %',
        v_caller_sub, v_clerk_user_id;
    END IF;
  ELSE
    -- Untrusted or anonymous role attempting direct execution must fail closed
    RAISE EXCEPTION 'FORBIDDEN_EXECUTION_ROLE: Role % is not authorized to create orders', v_caller_role;
  END IF;
  
  -- 2. Extract and validate idempotency key and complete payload fingerprint
  IF v_idempotency_key IS NOT NULL AND v_idempotency_key <> '' THEN
    SELECT id, total_amount, status, clerk_user_id, idempotency_fingerprint 
    INTO v_existing_order
    FROM public.orders 
    WHERE idempotency_key = v_idempotency_key;
    
    IF FOUND THEN
      IF v_existing_order.clerk_user_id IS DISTINCT FROM v_clerk_user_id THEN
        RAISE EXCEPTION 'IDEMPOTENCY_OWNER_MISMATCH';
      END IF;

      IF v_existing_order.idempotency_fingerprint IS NOT NULL 
         AND v_idempotency_fingerprint IS NOT NULL 
         AND v_existing_order.idempotency_fingerprint IS DISTINCT FROM v_idempotency_fingerprint THEN
        RAISE EXCEPTION 'IDEMPOTENCY_PAYLOAD_MISMATCH';
      END IF;

      IF v_existing_order.total_amount IS DISTINCT FROM v_total_amount THEN
        RAISE EXCEPTION 'IDEMPOTENCY_PAYLOAD_MISMATCH';
      END IF;
      
      RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'order_id', v_existing_order.id,
        'duplicate', true,
        'status', v_existing_order.status
      );
    END IF;
  END IF;

  -- 3. Verify global inventory tracking flag
  SELECT COALESCE(track_inventory, false) INTO v_track_inventory 
  FROM public.global_settings WHERE id = 'default';
  
  -- 4. Atomic Stock Deduction with DETERMINISTIC ASCENDING FOR UPDATE concurrency locks
  IF v_track_inventory THEN
    FOR v_item IN 
      SELECT product_id, SUM(quantity) AS quantity
      FROM pg_catalog.jsonb_to_recordset(p_items) AS x(product_id TEXT, quantity NUMERIC)
      WHERE product_id IS NOT NULL
      GROUP BY product_id
      ORDER BY product_id ASC
    LOOP
      IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
        RAISE EXCEPTION 'INVALID_ITEM_QUANTITY: product %, quantity %', v_item.product_id, v_item.quantity;
      END IF;

      SELECT id, stock_quantity, is_active 
      INTO v_prod
      FROM public.products
      WHERE id = v_item.product_id
      FOR UPDATE;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'PRODUCT_NOT_FOUND: %', v_item.product_id;
      END IF;

      IF NOT v_prod.is_active THEN
        RAISE EXCEPTION 'PRODUCT_INACTIVE: %', v_item.product_id;
      END IF;
      
      IF v_prod.stock_quantity < v_item.quantity THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK: product %, required %, available %', 
          v_item.product_id, v_item.quantity, v_prod.stock_quantity;
      END IF;
      
      UPDATE public.products
      SET stock_quantity = stock_quantity - v_item.quantity
      WHERE id = v_item.product_id;
      
      INSERT INTO public.inventory_movements(product_id, delta_quantity, reason)
      VALUES (v_item.product_id, -v_item.quantity, 'ORDER_CHECKOUT');
    END LOOP;
  END IF;

  -- 5. Insert order header
  INSERT INTO public.orders (
    clerk_user_id,
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    delivery_municipality,
    total_amount,
    status,
    payment_method,
    payment_status,
    idempotency_key,
    idempotency_fingerprint,
    notes
  ) VALUES (
    v_clerk_user_id,
    COALESCE(p_order->>'customer_name', 'Cliente La Gaviota'),
    COALESCE(p_order->>'customer_email', 'contacto@frutasyverduraslagaviota.com'),
    COALESCE(p_order->>'customer_phone', '3184990826'),
    COALESCE(p_order->>'delivery_address', 'Plaza San Francisco Local 10'),
    COALESCE(p_order->>'delivery_municipality', 'Bucaramanga'),
    v_total_amount,
    COALESCE(p_order->>'status', 'Pendiente'),
    COALESCE(p_order->>'payment_method', 'cash'),
    COALESCE(p_order->>'payment_status', 'pending'),
    v_idempotency_key,
    v_idempotency_fingerprint,
    p_order->>'notes'
  ) RETURNING id INTO v_order_id;

  -- 6. Insert order lines
  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_name,
    quantity,
    price_at_purchase
  )
  SELECT 
    v_order_id,
    x.product_id,
    COALESCE(x.product_name, (SELECT name FROM public.products WHERE id = x.product_id), 'Producto'),
    x.quantity,
    x.price_at_purchase
  FROM pg_catalog.jsonb_to_recordset(p_items) AS x(
    product_id TEXT,
    product_name TEXT,
    quantity NUMERIC,
    price_at_purchase NUMERIC
  );

  -- 7. Insert payment intent if provided
  IF p_payment_intent IS NOT NULL AND p_payment_intent->>'intent_id' IS NOT NULL THEN
    INSERT INTO public.payment_intents (
      intent_id,
      order_id,
      clerk_user_id,
      purpose,
      amount,
      currency,
      provider,
      environment,
      status,
      provider_reference
    ) VALUES (
      p_payment_intent->>'intent_id',
      v_order_id,
      v_clerk_user_id,
      COALESCE(p_payment_intent->>'purpose', 'ORDER_CHECKOUT'),
      v_total_amount,
      COALESCE(p_payment_intent->>'currency', 'COP'),
      COALESCE(p_payment_intent->>'provider', 'WOMPI'),
      COALESCE(p_payment_intent->>'environment', 'sandbox'),
      'PENDING',
      COALESCE(p_payment_intent->>'provider_reference', v_order_id::text)
    );
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'duplicate', false
  );
END;
$$;

-- Least privilege: Revoke execution from PUBLIC and anon.
REVOKE ALL ON FUNCTION public.create_order_atomic(jsonb, jsonb, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_order_atomic(jsonb, jsonb, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(jsonb, jsonb, jsonb) TO authenticated, service_role;

-- 8. Atomic Wompi Webhook Processing RPC
-- Eliminates concurrency race conditions between webhook retries and duplicate callbacks.
CREATE OR REPLACE FUNCTION public.process_wompi_transaction(
  p_event_id TEXT,
  p_transaction jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tx_id TEXT;
  v_reference TEXT;
  v_status TEXT;
  v_amount_cents BIGINT;
  v_currency TEXT;
  v_amount_numeric NUMERIC;
  v_match_user TEXT;
  v_order_id UUID;
  v_receipt_id TEXT;
  v_existing_receipt RECORD;
  v_intent RECORD;
  v_order RECORD;
  v_updated_rows INT;
BEGIN
  -- Strict server-side execution check: only service_role (or superuser) can invoke payment processing
  IF lg_auth.caller_role() <> 'service_role' AND NOT (lg_auth.caller_role() = session_user AND session_user IN ('postgres', 'sebastiangarcia')) THEN
    RAISE EXCEPTION 'FORBIDDEN_EXECUTION_ROLE: Role % is not authorized to process payment callbacks', lg_auth.caller_role();
  END IF;

  v_tx_id := NULLIF(TRIM(p_transaction->>'id'), '');
  v_reference := NULLIF(TRIM(p_transaction->>'reference'), '');
  v_status := NULLIF(TRIM(p_transaction->>'status'), '');
  v_amount_cents := (p_transaction->>'amount_in_cents')::BIGINT;
  v_currency := COALESCE(p_transaction->>'currency', 'COP');
  v_amount_numeric := v_amount_cents / 100.0;

  IF v_tx_id IS NULL OR v_reference IS NULL OR v_status IS NULL THEN
    RAISE EXCEPTION 'INVALID_TRANSACTION_PAYLOAD: Missing transaction id, reference, or status';
  END IF;

  -- Derive canonical receipt identity from verified provider properties
  v_receipt_id := COALESCE(
    NULLIF(TRIM(p_event_id), ''),
    'wompi_tx_' || v_tx_id || '_status_' || v_status
  );

  -- 1. Deduplicate by provider transaction identity and compound status
  BEGIN
    INSERT INTO public.wompi_event_receipts (
      event_id, provider_transaction_id, reference, status, amount_in_cents, currency
    ) VALUES (
      v_receipt_id, v_tx_id, v_reference, v_status, v_amount_cents, v_currency
    )
    ON CONFLICT (provider_transaction_id, status) DO NOTHING;
  EXCEPTION WHEN unique_violation THEN
    RETURN pg_catalog.jsonb_build_object('success', true, 'duplicate', true, 'message', 'Event receipt already processed');
  END;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows = 0 THEN
    RETURN pg_catalog.jsonb_build_object('success', true, 'duplicate', true, 'message', 'Event receipt already processed');
  END IF;

  -- Only APPROVED triggers financial adjustments
  IF v_status <> 'APPROVED' THEN
    -- If this is an order reference, record payment attempt status without hard-cancelling the order
    IF v_reference NOT LIKE 'BAL_%' THEN
      BEGIN
        v_order_id := v_reference::UUID;
        UPDATE public.orders
        SET payment_status = 'declined',
            updated_at = pg_catalog.now()
        WHERE id = v_order_id
          AND payment_status <> 'approved'
          AND status NOT IN ('Cancelado', 'ARCHIVED_CANCELLED');

        UPDATE public.payment_intents
        SET status = v_status,
            reconciliation_status = 'RECONCILED_CALLBACK',
            provider_transaction_id = v_tx_id,
            updated_at = pg_catalog.now(),
            last_reconciled_at = pg_catalog.now()
        WHERE order_id = v_order_id
          AND status <> 'APPROVED';
      EXCEPTION WHEN OTHERS THEN
        -- If v_reference is not a valid UUID, ignore safely
      END;
    END IF;

    RETURN pg_catalog.jsonb_build_object('success', true, 'action', 'status_recorded', 'status', v_status);
  END IF;

  -- 2. Route by Reference: B2B Balance Payment vs Standard Order
  IF v_reference LIKE 'BAL_%' THEN
    v_match_user := (pg_catalog.regexp_match(v_reference, '^BAL_(user_[A-Za-z0-9_]+)_[0-9]+$'))[1];
    IF v_match_user IS NULL THEN
      RAISE EXCEPTION 'INVALID_BALANCE_REFERENCE: %', v_reference;
    END IF;

    -- Row-lock payment intent to prevent concurrent balance deductions
    SELECT * INTO v_intent
    FROM public.payment_intents
    WHERE (intent_id = v_reference OR provider_reference = v_reference)
    FOR UPDATE;

    IF FOUND THEN
      IF v_intent.status = 'APPROVED' THEN
        RETURN pg_catalog.jsonb_build_object('success', true, 'duplicate', true, 'message', 'Payment intent already approved');
      END IF;

      UPDATE public.payment_intents
      SET status = 'APPROVED', 
          reconciliation_status = 'RECONCILED_CALLBACK',
          provider_transaction_id = v_tx_id, 
          updated_at = pg_catalog.now(),
          last_reconciled_at = pg_catalog.now()
      WHERE id = v_intent.id;
    ELSE
      INSERT INTO public.payment_intents (
        intent_id, clerk_user_id, purpose, amount, currency, provider, status, 
        reconciliation_status, provider_transaction_id, provider_reference, last_reconciled_at
      ) VALUES (
        v_reference, v_match_user, 'B2B_BALANCE', v_amount_numeric, v_currency, 'WOMPI', 'APPROVED',
        'RECONCILED_CALLBACK', v_tx_id, v_reference, pg_catalog.now()
      );
    END IF;

    -- Decrement balance atomically: balance moves from e.g. 500,000 to 400,000 after 100,000 payment
    UPDATE public.b2b_credit_profiles
    SET credit_balance = GREATEST(0, credit_balance - v_amount_numeric), updated_at = pg_catalog.now()
    WHERE user_id = v_match_user;

    RETURN pg_catalog.jsonb_build_object('success', true, 'action', 'balance_credited', 'user_id', v_match_user, 'amount', v_amount_numeric);

  ELSE
    -- Standard order reference
    BEGIN
      v_order_id := v_reference::UUID;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'INVALID_ORDER_UUID_REFERENCE: %', v_reference;
    END;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'ORDER_NOT_FOUND: %', v_order_id;
    END IF;

    IF v_order.status = 'Cancelado' OR v_order.status = 'ARCHIVED_CANCELLED' THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'ORDER_ALREADY_CANCELLED', 'message', 'Cannot approve a cancelled order');
    END IF;

    IF v_order.payment_status = 'approved' THEN
      RETURN pg_catalog.jsonb_build_object('success', true, 'duplicate', true, 'message', 'Order already marked approved');
    END IF;

    -- Financial parity check: prevent underpaid order fraud
    IF v_order.total_amount IS DISTINCT FROM v_amount_numeric THEN
      RAISE EXCEPTION 'PAYMENT_AMOUNT_MISMATCH: order requires %, transaction paid %', v_order.total_amount, v_amount_numeric;
    END IF;

    UPDATE public.orders
    SET payment_status = 'approved',
        status = CASE WHEN status = 'Pendiente' THEN 'En Preparación' ELSE status END,
        payment_reference = v_tx_id,
        updated_at = pg_catalog.now()
    WHERE id = v_order_id;

    UPDATE public.payment_intents
    SET status = 'APPROVED', 
        reconciliation_status = 'RECONCILED_CALLBACK',
        provider_transaction_id = v_tx_id, 
        updated_at = pg_catalog.now(),
        last_reconciled_at = pg_catalog.now()
    WHERE order_id = v_order_id;

    RETURN pg_catalog.jsonb_build_object('success', true, 'action', 'order_approved', 'order_id', v_order_id);
  END IF;
END;
$$;

-- Least privilege: strictly restrict execution of payment processing RPC to service_role ONLY.
REVOKE ALL ON FUNCTION public.process_wompi_transaction(TEXT, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_wompi_transaction(TEXT, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_wompi_transaction(TEXT, jsonb) TO service_role;


-- 9. Row Level Security activation
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
ALTER TABLE public.wompi_event_receipts ENABLE ROW LEVEL SECURITY;

-- 10. Catalog Policies (Public Read for Active Products & Kits)
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

-- 11. Customer & Order Isolation Policies (Clerk User ID match)
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

DROP POLICY IF EXISTS "Users can read own credit profile" ON public.b2b_credit_profiles;
CREATE POLICY "Users can read own credit profile" ON public.b2b_credit_profiles
  FOR SELECT TO authenticated
  USING (user_id = lg_auth.clerk_uid());

DROP POLICY IF EXISTS "Users can read own buying templates" ON public.buying_templates;
CREATE POLICY "Users can read own buying templates" ON public.buying_templates
  FOR SELECT TO authenticated
  USING (user_id = lg_auth.clerk_uid());

DROP POLICY IF EXISTS "Users can manage own buying templates" ON public.buying_templates;
CREATE POLICY "Users can manage own buying templates" ON public.buying_templates
  FOR ALL TO authenticated
  USING (user_id = lg_auth.clerk_uid())
  WITH CHECK (user_id = lg_auth.clerk_uid());

DROP POLICY IF EXISTS "Users can read own payment intents" ON public.payment_intents;
CREATE POLICY "Users can read own payment intents" ON public.payment_intents
  FOR SELECT TO authenticated
  USING (clerk_user_id = lg_auth.clerk_uid());

DROP POLICY IF EXISTS "Users can view own business applications" ON public.business_applications;
CREATE POLICY "Users can view own business applications" ON public.business_applications
  FOR SELECT TO authenticated
  USING (clerk_user_id = lg_auth.clerk_uid());

-- 12. Service Role Bypass & Administrative Access
REVOKE INSERT, UPDATE, DELETE ON public.products FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payment_intents FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.wompi_event_receipts FROM anon, authenticated;

COMMIT;
