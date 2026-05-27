-- Migration: Create Kits and Audit Logs tables

-- 1. KITS SCHEMA
CREATE TABLE IF NOT EXISTS kits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  fixed_price NUMERIC NOT NULL,
  banner_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kit_id UUID REFERENCES kits(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  UNIQUE(kit_id, product_id)
);

-- Policies
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to active kits" ON kits FOR SELECT USING (status = 'active');
CREATE POLICY "Allow admin full access to kits" ON kits FOR ALL USING (true);
CREATE POLICY "Allow public read access to kit items" ON kit_items FOR SELECT USING (true);
CREATE POLICY "Allow admin full access to kit items" ON kit_items FOR ALL USING (true);

-- Create bucket for kit-banners
-- Note: Requires superuser/service_role to manage storage buckets via SQL directly,
-- Assuming Supabase UI or migrations will handle bucket creation, but we provide policy.
INSERT INTO storage.buckets (id, name, public) VALUES ('kit-banners', 'kit-banners', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Allow public read access to kit-banners" ON storage.objects FOR SELECT USING (bucket_id = 'kit-banners');
CREATE POLICY "Allow admin insert to kit-banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kit-banners');
CREATE POLICY "Allow admin update to kit-banners" ON storage.objects FOR UPDATE USING (bucket_id = 'kit-banners');


-- 2. AUDIT LOGS SCHEMA
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('PRICING', 'KITS', 'SUPPLIER', 'ORDERS', 'SYSTEM')),
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin full access to audit logs" ON audit_logs FOR ALL USING (true);
-- Nobody else can read or write to audit_logs

