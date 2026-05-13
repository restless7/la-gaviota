-- La Gaviota: Database Schema Setup

-- 1. Business Applications (Already created)
CREATE TABLE IF NOT EXISTS business_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('Micromercados', 'Restaurantes')),
  nit TEXT DEFAULT '',
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  municipality TEXT NOT NULL,
  monthly_volume TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Catalog
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  base_cost INTEGER NOT NULL DEFAULT 0,
  price_retail INTEGER NOT NULL DEFAULT 0,
  price_micro INTEGER NOT NULL DEFAULT 0,
  price_restaurant INTEGER NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_in_season BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public reads for products
CREATE POLICY "Allow public reads on products" ON products
  FOR SELECT USING (true);

-- Policy: Allow public updates for now (admin panels are protected at the route level)
CREATE POLICY "Allow public updates on products" ON products
  FOR UPDATE USING (true);
  
CREATE POLICY "Allow public inserts on products" ON products
  FOR INSERT WITH CHECK (true);

-- 3. Orders and Order Items
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_municipality TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Preparación', 'En Ruta', 'Entregado', 'Cancelado')),
  payment_method TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_at_purchase INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public inserts on order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public reads on orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public reads on order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow public updates on orders" ON orders FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(clerk_user_id);

-- 4. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  farm_location TEXT,
  supplied_categories TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public reads on suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public all on suppliers" ON suppliers FOR ALL USING (true);

-- 5. Customer Profiles (Linked to Clerk)
CREATE TABLE IF NOT EXISTS customers (
  clerk_user_id TEXT PRIMARY KEY,
  full_name TEXT,
  business_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  nit TEXT,
  tier TEXT DEFAULT 'Personas Naturales',
  credit_limit INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  payment_terms TEXT DEFAULT 'Contado',
  assigned_rep TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public reads on customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public updates on customers" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow public inserts on customers" ON customers FOR INSERT WITH CHECK (true);

