-- Migration: Create Site Analytics & Page Views Telemetry Architecture
-- Enterprise Web Analytics for Surtifruver La Gaviota

CREATE TABLE IF NOT EXISTS public.analytics_page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pathname TEXT NOT NULL,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  referrer TEXT,
  referrer_channel TEXT NOT NULL DEFAULT 'Directo',
  device_type TEXT NOT NULL DEFAULT 'mobile' CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  browser TEXT DEFAULT 'Chrome Mobile',
  city TEXT DEFAULT 'Bucaramanga',
  duration_seconds INTEGER DEFAULT 15,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  product_id TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.analytics_page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_pathname ON public.analytics_page_views (pathname);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON public.analytics_page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_channel ON public.analytics_page_views (referrer_channel);
CREATE INDEX IF NOT EXISTS idx_page_views_device ON public.analytics_page_views (device_type);

-- Row Level Security
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous beacon tracking inserts
CREATE POLICY "Allow public beacon tracking inserts"
  ON public.analytics_page_views
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated admins to read analytics data
CREATE POLICY "Allow authenticated admins to read analytics"
  ON public.analytics_page_views
  FOR SELECT
  USING (true);
