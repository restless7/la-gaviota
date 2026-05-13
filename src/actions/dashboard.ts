'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface DashboardMetrics {
  productCount: number;
  orderCount: number;
  supplierCount: number;
  activeSuppliers: number;
  pendingApplications: number;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    { count: productCount },
    { count: orderCount },
    { count: supplierCount },
    { count: activeSuppliers },
    { count: pendingApplications }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('suppliers').select('*', { count: 'exact', head: true }),
    supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('status', 'Activo'),
    supabase.from('business_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  ]);

  return {
    productCount: productCount || 0,
    orderCount: orderCount || 0,
    supplierCount: supplierCount || 0,
    activeSuppliers: activeSuppliers || 0,
    pendingApplications: pendingApplications || 0
  };
}
