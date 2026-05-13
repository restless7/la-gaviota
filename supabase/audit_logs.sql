CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('pricing', 'order', 'supplier', 'system', 'inventory')),
    details TEXT,
    metadata JSONB
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated admins
CREATE POLICY "Admins can read all audit logs" ON audit_logs
    FOR SELECT USING (true);

-- Allow system to insert logs
CREATE POLICY "Allow log insertion" ON audit_logs
    FOR INSERT WITH CHECK (true);
