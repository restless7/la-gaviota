-- Migration: Create Abandoned Carts tracking table
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT, -- nullable, can track guests if phone is provided
  customer_phone TEXT,
  customer_email TEXT,
  cart_data JSONB NOT NULL,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'abandoned' CHECK (status IN ('active', 'abandoned', 'recovered', 'lost')),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public inserts on abandoned carts" ON abandoned_carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public updates on own abandoned carts" ON abandoned_carts FOR UPDATE USING (true);
CREATE POLICY "Allow admin full access to abandoned carts" ON abandoned_carts FOR ALL USING (true);
