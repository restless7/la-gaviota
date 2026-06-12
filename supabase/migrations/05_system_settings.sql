CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    business_name TEXT DEFAULT 'Surtifruver La Gaviota',
    nit TEXT DEFAULT '900.123.456-7',
    address TEXT DEFAULT 'Centro de Abastos - Bucaramanga',
    phone TEXT DEFAULT '+57 315 XXX XXXX',
    hours TEXT DEFAULT 'Lunes a Sábado: 3:00 AM - 6:00 PM | Domingos: 4:00 AM - 2:00 PM',
    delivery_zones JSONB DEFAULT '[{"name": "Bucaramanga Centro", "enabled": true, "minOrder": 25000}, {"name": "Floridablanca", "enabled": true, "minOrder": 35000}, {"name": "Girón", "enabled": true, "minOrder": 40000}, {"name": "Piedecuesta", "enabled": true, "minOrder": 45000}, {"name": "Lebrija", "enabled": false, "minOrder": 80000}, {"name": "San Gil", "enabled": false, "minOrder": 100000}, {"name": "Socorro", "enabled": false, "minOrder": 120000}, {"name": "Cúcuta", "enabled": false, "minOrder": 200000}]'::jsonb,
    notifications JSONB DEFAULT '{"emailNewOrder": true, "emailLowStock": true, "whatsappNewOrder": false, "whatsappDelivery": true, "dailyReport": true}'::jsonb,
    retail_margin NUMERIC DEFAULT 25,
    micro_margin NUMERIC DEFAULT 15,
    wholesale_margin NUMERIC DEFAULT 5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for all" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow update for authenticated" ON public.system_settings FOR UPDATE USING (true);

-- Insert default row
INSERT INTO public.system_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;
