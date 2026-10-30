-- LA GAVIOTA — SYNTHETIC STAGING FIXTURES (LG-PROD-R4)
-- Scope: Independent Supabase Staging Activation
-- Privacy: STRICT ZERO-PRODUCTION-DATA POLICY. Only synthetic entities.

BEGIN;

-- 1. Global Settings
INSERT INTO public.global_settings (id, track_inventory)
VALUES ('default', true)
ON CONFLICT (id) DO UPDATE SET track_inventory = EXCLUDED.track_inventory;

-- 2. Disposable Product Catalog (12 synthetic items across 4 categories)
INSERT INTO public.products (
  id, name, category, subcategory, unit, 
  base_cost, price_retail, price_micro, price_restaurant, 
  stock_quantity, is_active, is_in_season
) VALUES
  ('sku-stag-manzana', 'Manzana Roja Staging', 'FRUTAS', 'Manzanas', 'kg', 4500, 7000, 6200, 5500, 250, true, true),
  ('sku-stag-banano', 'Banano Urabá Staging', 'FRUTAS', 'Bananos', 'kg', 1800, 3200, 2800, 2400, 500, true, true),
  ('sku-stag-aguacate', 'Aguacate Hass Staging', 'FRUTAS', 'Aguacates', 'kg', 5000, 8500, 7500, 6800, 180, true, true),
  ('sku-stag-naranja', 'Naranja Valencia Staging', 'FRUTAS', 'Cítricos', 'kg', 1500, 2800, 2400, 2000, 400, true, true),
  ('sku-stag-tomate', 'Tomate Chonto Staging', 'VERDURAS Y HORTALIZAS', 'Tomates', 'kg', 2200, 4200, 3600, 3100, 350, true, true),
  ('sku-stag-cebolla-cab', 'Cebolla Cabezona Blanca Staging', 'VERDURAS Y HORTALIZAS', 'Cebollas', 'kg', 2000, 3800, 3200, 2800, 300, true, true),
  ('sku-stag-cebolla-jun', 'Cebolla Junca Staging', 'VERDURAS Y HORTALIZAS', 'Cebollas', 'atado', 1200, 2200, 1900, 1600, 200, true, true),
  ('sku-stag-zanahoria', 'Zanahoria San Pedro Staging', 'VERDURAS Y HORTALIZAS', 'Raíces', 'kg', 1600, 3000, 2600, 2200, 400, true, true),
  ('sku-stag-papa-pastusa', 'Papa Pastusa Staging', 'VERDURAS Y HORTALIZAS', 'Tubérculos', 'kg', 1800, 3400, 2900, 2500, 600, true, true),
  ('sku-stag-cilantro', 'Cilantro Patón Staging', 'HIERBAS Y AROMATICAS', 'Hierbas de Cocina', 'atado', 800, 1500, 1300, 1100, 150, true, true),
  ('sku-stag-albahaca', 'Albahaca Fresca Staging', 'HIERBAS Y AROMATICAS', 'Aromáticas', 'atado', 1000, 1800, 1500, 1300, 100, true, true),
  ('sku-stag-kit-familiar', 'Combo Surtido Familiar Staging', 'KITS Y COMBOS', 'Kits', 'unidad', 28000, 45000, 40000, 36000, 50, true, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  unit = EXCLUDED.unit,
  base_cost = EXCLUDED.base_cost,
  price_retail = EXCLUDED.price_retail,
  price_micro = EXCLUDED.price_micro,
  price_restaurant = EXCLUDED.price_restaurant,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  is_in_season = EXCLUDED.is_in_season;

-- 3. Synthetic Customer B2B Applications & Profiles
INSERT INTO public.business_applications (
  id, clerk_user_id, applicant_name, applicant_email,
  business_name, business_type, nit, phone,
  address, municipality, monthly_volume, notes, status
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'user_staging_micro',
    'Carlos Andrés Micromercado',
    'test-micro@staging.lagaviotafruver.com',
    'Minimarket Don Carlos Staging',
    'Micromercados',
    '901234567-1',
    '3101112233',
    'Carrera 27 #34-12, San Alonso',
    'Bucaramanga',
    'COP 4,000,000 / mes',
    'Synthetic Micromercado fixture for Staging testing',
    'approved'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'user_staging_restaurante',
    'Laura Gómez Restaurante',
    'test-restaurante@staging.lagaviotafruver.com',
    'Trattoria La Nonna Staging',
    'Restaurantes',
    '901987654-2',
    '3152223344',
    'Calle 48 #33-21, Cabecera',
    'Bucaramanga',
    'COP 10,000,000 / mes',
    'Synthetic Restaurante fixture for Staging testing',
    'approved'
  )
ON CONFLICT (id) DO UPDATE SET
  applicant_name = EXCLUDED.applicant_name,
  business_name = EXCLUDED.business_name,
  status = EXCLUDED.status;

-- 4. Synthetic Initial Order Fixtures
INSERT INTO public.orders (
  id, clerk_user_id, customer_name, customer_email, customer_phone,
  delivery_address, delivery_municipality, purchase_tier, notes, total_amount,
  status, payment_status, payment_method, idempotency_key
) VALUES
  (
    '00000000-0000-0000-0000-000000000010',
    'user_staging_retail_a',
    'Ana Retail Staging',
    'test-retail-a@staging.lagaviotafruver.com',
    '3001234567',
    'Calle 36 #21-15 Apto 402',
    'Bucaramanga',
    'RETAIL',
    'Dejar en portería por favor',
    35000,
    'Pendiente',
    'pending',
    'cash_on_delivery',
    'idemp-staging-retail-cash-001'
  ),
  (
    '00000000-0000-0000-0000-000000000020',
    'user_staging_micro',
    'Carlos Andrés Micromercado',
    'test-micro@staging.lagaviotafruver.com',
    '3101112233',
    'Carrera 27 #34-12, San Alonso',
    'Bucaramanga',
    'MICROMERCADO',
    'Entrega en rampa de cargue',
    124000,
    'Pendiente',
    'approved',
    'wompi',
    'idemp-staging-micro-wompi-001'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status;

-- 5. Order Items for Synthetic Orders
INSERT INTO public.order_items (
  id, order_id, product_id, product_name, quantity, price_at_purchase
) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', 'sku-stag-manzana', 'Manzana Roja Staging', 2, 7000),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010', 'sku-stag-banano', 'Banano Urabá Staging', 3, 3200),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000010', 'sku-stag-aguacate', 'Aguacate Hass Staging', 1, 8500),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000020', 'sku-stag-tomate', 'Tomate Chonto Staging', 20, 3600),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000020', 'sku-stag-cebolla-cab', 'Cebolla Cabezona Blanca Staging', 15, 3200),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000020', 'sku-stag-cilantro', 'Cilantro Patón Staging', 4, 1000)
ON CONFLICT (id) DO NOTHING;

-- 6. Synthetic Payment Intent & Wompi Event Receipt (for Order GAV-STAG-0001)
INSERT INTO public.payment_intents (
  intent_id, order_id, clerk_user_id, purpose, amount, currency,
  provider, environment, status, reconciliation_status,
  provider_transaction_id, provider_reference
) VALUES (
  'intent_stag_micro_001',
  '00000000-0000-0000-0000-000000000020',
  'user_staging_micro',
  'ORDER_CHECKOUT',
  124000,
  'COP',
  'WOMPI',
  'sandbox',
  'APPROVED',
  'RECONCILED_CALLBACK',
  'tx_stag_mock_999888',
  'GAV-STAG-0001'
)
ON CONFLICT (intent_id) DO UPDATE SET
  status = EXCLUDED.status,
  reconciliation_status = EXCLUDED.reconciliation_status;

INSERT INTO public.wompi_event_receipts (
  event_id, provider_transaction_id, reference, status, amount_in_cents, currency
) VALUES (
  'evt_stag_receipt_001',
  'tx_stag_mock_999888',
  'GAV-STAG-0001',
  'APPROVED',
  12400000,
  'COP'
)
ON CONFLICT (event_id) DO NOTHING;

COMMIT;
