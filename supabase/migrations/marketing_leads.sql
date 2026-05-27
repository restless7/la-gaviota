-- Migration: Create Marketing Leads table for B2B prospecting
CREATE TABLE IF NOT EXISTS marketing_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  business_name TEXT,
  business_type TEXT NOT NULL CHECK (business_type IN ('Restaurante', 'Micromercado', 'Mayorista', 'Otro')),
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT DEFAULT 'Landing Page',
  status TEXT NOT NULL DEFAULT 'Nuevo' CHECK (status IN ('Nuevo', 'Contactado', 'En Negociacion', 'Convertido', 'Perdido')),
  notes TEXT DEFAULT '',
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public inserts on marketing leads" ON marketing_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin full access to marketing leads" ON marketing_leads FOR ALL USING (true);
