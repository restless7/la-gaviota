-- Migration: Enterprise Promotions & Launch Discount Campaign
-- Date: 2026-11-13
-- Purpose: Time-frame sensitive tiered launch discounts (15%, 25%, 35%) and admin promotional engine.

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  tier_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  applicable_tiers TEXT[] NOT NULL DEFAULT ARRAY['Personas Naturales'],
  max_discount_cap NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'Allow public read active promotions'
  ) THEN
    CREATE POLICY "Allow public read active promotions" ON public.promotions
      FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'promotions' AND policyname = 'Allow admin full access to promotions'
  ) THEN
    CREATE POLICY "Allow admin full access to promotions" ON public.promotions
      FOR ALL USING (true);
  END IF;
END $$;

-- Order header discount fields
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_label TEXT DEFAULT NULL;

-- Seed / Upsert the 1-Week Launch Campaign
INSERT INTO public.promotions (
  code,
  name,
  headline,
  description,
  banner_url,
  is_active,
  starts_at,
  ends_at,
  tier_rules,
  applicable_tiers,
  max_discount_cap
) VALUES (
  'LANZAMIENTO_WEB',
  '¡Gran Lanzamiento Web La Gaviota!',
  '¡Descuentos de Lanzamiento por 1 Semana!',
  'Aprovecha nuestra semana inaugural con descuentos escalonados automáticos: 15% en compras >$100k, 25% en compras >$200k y 35% en compras >$300k.',
  '/PROMOTIONS/descuento-35-lanzamiento.jpg',
  true,
  NOW(),
  NOW() + INTERVAL '7 days',
  '[
    {
      "minSubtotal": 100000,
      "discountPercent": 15,
      "badge": "15% OFF",
      "label": "15% de Descuento",
      "description": "En compras superiores a $100.000",
      "posterUrl": "/PROMOTIONS/descuento-15-lanzamiento.jpg"
    },
    {
      "minSubtotal": 200000,
      "discountPercent": 25,
      "badge": "25% OFF",
      "label": "25% de Descuento",
      "description": "En compras superiores a $200.000",
      "posterUrl": "/PROMOTIONS/descuento-25-lanzamiento.jpg"
    },
    {
      "minSubtotal": 300000,
      "discountPercent": 35,
      "badge": "35% OFF",
      "label": "35% de Descuento",
      "description": "En compras superiores a $300.000",
      "posterUrl": "/PROMOTIONS/descuento-35-lanzamiento.jpg"
    }
  ]'::jsonb,
  ARRAY['Personas Naturales'],
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  headline = EXCLUDED.headline,
  description = EXCLUDED.description,
  banner_url = EXCLUDED.banner_url,
  is_active = true,
  starts_at = NOW(),
  ends_at = NOW() + INTERVAL '7 days',
  tier_rules = EXCLUDED.tier_rules,
  updated_at = NOW();
