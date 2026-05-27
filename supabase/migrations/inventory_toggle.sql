-- Migration: Create Global Settings Table for Feature Flags
CREATE TABLE IF NOT EXISTS global_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  track_inventory BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row if not exists
INSERT INTO global_settings (id, track_inventory)
VALUES ('default', false)
ON CONFLICT (id) DO NOTHING;

-- Policies
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public reads on global_settings" ON global_settings FOR SELECT USING (true);
CREATE POLICY "Allow updates on global_settings" ON global_settings FOR UPDATE USING (true);
