-- Migration: Create customer_inquiries table for PQRS and contact requests with radicado codes
CREATE TABLE IF NOT EXISTS customer_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  radicado_code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('peticion', 'queja', 'reclamo', 'sugerencia', 'contacto')),
  full_name TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  order_id TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Recibido' CHECK (status IN ('Recibido', 'En Revision', 'Resuelto', 'Cerrado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public insertion of inquiries (webform)
CREATE POLICY "Allow public inserts on customer inquiries"
  ON customer_inquiries
  FOR INSERT
  WITH CHECK (true);

-- Allow admin full management of customer inquiries
CREATE POLICY "Allow admin full access on customer inquiries"
  ON customer_inquiries
  FOR ALL
  USING (true);

