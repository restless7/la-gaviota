'use server';
import { requireCapability } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';

export interface DashboardMetrics {
  productCount: number;
  orderCount: number;
  supplierCount: number;
  activeSuppliers: number;
  pendingApplications: number;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const actor = await requireCapability('reports.read');
  const supabase = getServerDatabase(actor);

  const safeCount = async (table: string, filter?: { col: string; val: string }) => {
    try {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      if (filter) query = query.eq(filter.col, filter.val);
      const res = await query;
      return res.count || 0;
    } catch (err) {
      console.warn(`[fetchDashboardMetrics] Error getting count for ${table}:`, err);
      return 0;
    }
  };

  const [
    productCount,
    orderCount,
    supplierCount,
    activeSuppliers,
    pendingApplications
  ] = await Promise.all([
    safeCount('products'),
    safeCount('orders'),
    safeCount('suppliers'),
    safeCount('suppliers', { col: 'status', val: 'Activo' }),
    safeCount('business_applications', { col: 'status', val: 'pending' })
  ]);

  return {
    productCount,
    orderCount,
    supplierCount,
    activeSuppliers,
    pendingApplications
  };
}
