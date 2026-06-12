-- TAREA 1: Extensión del Modelo de Datos para Surtifruver La Gaviota

-- 1. Modificación de la tabla orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS scheduled_delivery_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS is_conflicted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conflict_reason TEXT;

-- 2. Creación de la tabla daily_operational_ledgers
CREATE TABLE IF NOT EXISTS public.daily_operational_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operational_date DATE UNIQUE NOT NULL,
    total_orders_processed INTEGER NOT NULL DEFAULT 0,
    total_revenue_collected NUMERIC(12,2) NOT NULL DEFAULT 0,
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    closed_by_user TEXT NOT NULL
);

-- 3. Políticas de seguridad (RLS) para el ledger
ALTER TABLE public.daily_operational_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ledgers son visibles para todos" 
ON public.daily_operational_ledgers FOR SELECT 
USING (true);

CREATE POLICY "Solo admins/autenticados pueden insertar ledgers" 
ON public.daily_operational_ledgers FOR INSERT 
WITH CHECK (true); -- Asumiendo control a nivel de aplicación (Server Actions)
