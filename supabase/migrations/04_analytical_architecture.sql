-- TAREA 1: Arquitectura de Persistencia Analítica

-- 1. Denormalización en orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS purchase_tier TEXT DEFAULT 'RETAIL';

-- 2. Nueva Tabla Core de Mermas
CREATE TABLE IF NOT EXISTS public.agricultural_shrinkage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_kg NUMERIC(10,2) NOT NULL,
    log_type TEXT NOT NULL CHECK (log_type IN ('MERMA_TOTAL', 'RECUPERADO_ORGANICO')),
    loss_reason TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Políticas RLS opcionales para la tabla de mermas
ALTER TABLE public.agricultural_shrinkage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shrinkage read access" ON public.agricultural_shrinkage_logs FOR SELECT USING (true);
CREATE POLICY "Shrinkage insert access" ON public.agricultural_shrinkage_logs FOR INSERT WITH CHECK (true);
