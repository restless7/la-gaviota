-- Migration: LG-SUB-001 — Recurring Grocery Subscriptions & Scheduled Deliveries
-- Date: 2026-11-23
-- Purpose: Scheduled repeat grocery deliveries (Weekly, 15-day, Monthly) with real-time catalog pricing and zero membership fees.

-- 1. Grocery Subscriptions Table
CREATE TABLE IF NOT EXISTS public.grocery_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT,
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Mi Mercado Recurrente',
  frequency TEXT NOT NULL CHECK (frequency IN ('WEEKLY', 'EVERY_15_DAYS', 'MONTHLY')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELED')),
  timezone TEXT NOT NULL DEFAULT 'America/Bogota',
  anchor_date DATE NOT NULL,
  preferred_delivery_day INT CHECK (preferred_delivery_day BETWEEN 0 AND 6),
  preferred_delivery_window TEXT NOT NULL DEFAULT '08:00 - 12:00',
  delivery_name TEXT NOT NULL,
  delivery_phone TEXT NOT NULL,
  delivery_email TEXT,
  delivery_address TEXT NOT NULL,
  delivery_municipality TEXT NOT NULL DEFAULT 'Bucaramanga',
  delivery_instructions TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  confirmation_policy TEXT NOT NULL DEFAULT 'AUTO' CHECK (confirmation_policy IN ('AUTO', 'MANUAL')),
  maximum_authorized_total INT,
  next_occurrence_date DATE NOT NULL,
  version INT NOT NULL DEFAULT 1,
  paused_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grocery_subscriptions_customer ON public.grocery_subscriptions (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_subscriptions_status ON public.grocery_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_grocery_subscriptions_next_date ON public.grocery_subscriptions (next_occurrence_date);

-- 2. Grocery Subscription Items Table
CREATE TABLE IF NOT EXISTS public.grocery_subscription_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.grocery_subscriptions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0 AND quantity <= 1000),
  unit TEXT NOT NULL DEFAULT 'unidad',
  substitution_preference TEXT NOT NULL DEFAULT 'CALL_CUSTOMER' CHECK (substitution_preference IN ('CALL_CUSTOMER', 'SIMILAR', 'SKIP_ITEM')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grocery_subscription_items_sub ON public.grocery_subscription_items (subscription_id);

-- 3. Grocery Subscription Occurrences Table
CREATE TABLE IF NOT EXISTS public.grocery_subscription_occurrences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.grocery_subscriptions(id) ON DELETE CASCADE,
  scheduled_delivery_date DATE NOT NULL,
  delivery_window TEXT NOT NULL DEFAULT '08:00 - 12:00',
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'PENDING_APPROVAL', 'GENERATING', 'CONFIRMED', 'SKIPPED', 'FAILED', 'CANCELED')),
  source_subscription_version INT NOT NULL DEFAULT 1,
  estimated_subtotal INT NOT NULL DEFAULT 0,
  estimated_delivery_cost INT NOT NULL DEFAULT 0,
  estimated_total INT NOT NULL DEFAULT 0,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  generation_attempts INT NOT NULL DEFAULT 0,
  last_error_code TEXT,
  last_error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grocery_occurrences_sub ON public.grocery_subscription_occurrences (subscription_id);
CREATE INDEX IF NOT EXISTS idx_grocery_occurrences_date_status ON public.grocery_subscription_occurrences (scheduled_delivery_date, status);

-- 4. Grocery Subscription Events Table (Audit Log)
CREATE TABLE IF NOT EXISTS public.grocery_subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.grocery_subscriptions(id) ON DELETE CASCADE,
  occurrence_id UUID REFERENCES public.grocery_subscription_occurrences(id) ON DELETE SET NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('CUSTOMER', 'SYSTEM_SCHEDULER', 'ADMIN')),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'CREATED', 'UPDATED', 'PAUSED', 'RESUMED', 'SKIPPED', 'CANCELED',
    'OCCURRENCE_SCHEDULED', 'ORDER_GENERATED', 'APPROVAL_REQUESTED', 'GENERATION_FAILED'
  )),
  details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grocery_subscription_events_sub ON public.grocery_subscription_events (subscription_id);

-- 5. Link Orders to Subscription Occurrences
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subscription_occurrence_id UUID REFERENCES public.grocery_subscription_occurrences(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_subscription_occurrence ON public.orders (subscription_occurrence_id) WHERE subscription_occurrence_id IS NOT NULL;

-- 6. Row Level Security Policies
ALTER TABLE public.grocery_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_subscription_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_subscription_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Subscriptions: Owner can view/update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grocery_subscriptions' AND policyname = 'Customers can manage own subscriptions'
  ) THEN
    CREATE POLICY "Customers can manage own subscriptions" ON public.grocery_subscriptions
      FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');
  END IF;

  -- Service role / Admin bypass
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grocery_subscriptions' AND policyname = 'Service role full access to subscriptions'
  ) THEN
    CREATE POLICY "Service role full access to subscriptions" ON public.grocery_subscriptions
      FOR ALL USING (true);
  END IF;

  -- Items: Customer access via parent subscription
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grocery_subscription_items' AND policyname = 'Customers can view own subscription items'
  ) THEN
    CREATE POLICY "Customers can view own subscription items" ON public.grocery_subscription_items
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.grocery_subscriptions s
          WHERE s.id = subscription_id AND s.clerk_user_id = auth.jwt() ->> 'sub'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grocery_subscription_items' AND policyname = 'Service role full access to subscription items'
  ) THEN
    CREATE POLICY "Service role full access to subscription items" ON public.grocery_subscription_items
      FOR ALL USING (true);
  END IF;

  -- Occurrences
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grocery_subscription_occurrences' AND policyname = 'Customers can view own occurrences'
  ) THEN
    CREATE POLICY "Customers can view own occurrences" ON public.grocery_subscription_occurrences
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.grocery_subscriptions s
          WHERE s.id = subscription_id AND s.clerk_user_id = auth.jwt() ->> 'sub'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grocery_subscription_occurrences' AND policyname = 'Service role full access to occurrences'
  ) THEN
    CREATE POLICY "Service role full access to occurrences" ON public.grocery_subscription_occurrences
      FOR ALL USING (true);
  END IF;

  -- Events
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grocery_subscription_events' AND policyname = 'Customers can view own subscription events'
  ) THEN
    CREATE POLICY "Customers can view own subscription events" ON public.grocery_subscription_events
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.grocery_subscriptions s
          WHERE s.id = subscription_id AND s.clerk_user_id = auth.jwt() ->> 'sub'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grocery_subscription_events' AND policyname = 'Service role full access to events'
  ) THEN
    CREATE POLICY "Service role full access to events" ON public.grocery_subscription_events
      FOR ALL USING (true);
  END IF;
END $$;

