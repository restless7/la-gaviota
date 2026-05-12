-- La Gaviota: Business Applications Table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

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

-- Enable Row Level Security
ALTER TABLE business_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for the application form)
CREATE POLICY "Allow public inserts" ON business_applications
  FOR INSERT WITH CHECK (true);

-- Policy: Allow public reads (for admin panel)
CREATE POLICY "Allow public reads" ON business_applications
  FOR SELECT USING (true);

-- Policy: Allow public updates (for admin approval/rejection)
CREATE POLICY "Allow public updates" ON business_applications
  FOR UPDATE USING (true);

-- Index for faster filtering
CREATE INDEX idx_applications_status ON business_applications(status);
CREATE INDEX idx_applications_clerk_user ON business_applications(clerk_user_id);
