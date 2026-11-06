'use server';
import { requireCapability } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';

export interface ActiveKitMetric {
  id: string;
  name: string;
  fixed_price: number;
  itemCount: number;
  weeklySales: number;
  targetWeeklySales: number;
  percentage: number;
}

export interface DashboardMetrics {
  productCount: number;
  orderCount: number;
  supplierCount: number;
  activeSuppliers: number;
  pendingApplications: number;
  activeKit: ActiveKitMetric | null;
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

  let activeKit: ActiveKitMetric | null = null;
  try {
    const { data: kit } = await supabase
      .from('kits')
      .select('id, name, fixed_price, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (kit) {
      const { count: itemCount } = await supabase
        .from('kit_items')
        .select('*', { count: 'exact', head: true })
        .eq('kit_id', kit.id);

      // Query weekly sales from order_items (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentItems } = await supabase
        .from('order_items')
        .select('quantity')
        .or(`product_id.eq.${kit.id},product_name.ilike.%${kit.name}%`)
        .gte('created_at', sevenDaysAgo);

      const weeklySales = (recentItems || []).reduce((acc: number, item: { quantity?: number }) => acc + (item.quantity || 1), 0);
      const targetWeeklySales = 100;
      const percentage = Math.min(100, Math.round((weeklySales / targetWeeklySales) * 100));

      activeKit = {
        id: kit.id,
        name: kit.name,
        fixed_price: Number(kit.fixed_price) || 0,
        itemCount: itemCount || 0,
        weeklySales,
        targetWeeklySales,
        percentage
      };
    }
  } catch (err) {
    console.warn('[fetchDashboardMetrics] Error getting active kit:', err);
  }

  return {
    productCount,
    orderCount,
    supplierCount,
    activeSuppliers,
    pendingApplications,
    activeKit
  };
}
