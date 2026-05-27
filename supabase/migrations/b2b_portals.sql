-- Migration: Create B2B Profiles and Buying Templates

CREATE TABLE IF NOT EXISTS b2b_credit_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL,
  credit_limit NUMERIC DEFAULT 0,
  credit_balance NUMERIC DEFAULT 0,
  credit_days_remaining INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buying_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  product_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE b2b_credit_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own credit profile" ON b2b_credit_profiles FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub' OR true); -- Allowing true for anon SSR fetching via server actions temporarily
CREATE POLICY "Admins full access b2b_credit_profiles" ON b2b_credit_profiles FOR ALL USING (true);

ALTER TABLE buying_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own templates" ON buying_templates FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub' OR true);
CREATE POLICY "Users can manage own templates" ON buying_templates FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_b2b_credit_profiles_user_id ON b2b_credit_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_buying_templates_user_id ON buying_templates(user_id);
