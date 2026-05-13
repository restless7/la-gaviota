'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface SalesAnalytics {
  name: string;
  Retail: number;
  Micro: number;
  Restaurante: number;
}

export async function fetchSalesAnalytics(): Promise<SalesAnalytics[]> {
  // Fetch orders from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('created_at, total_amount, clerk_user_id')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching sales analytics:', error);
    return [];
  }

  // Also need to know the tier of each user to group correctly
  // This is a bit heavy, in production we should have a more efficient aggregation
  const { data: customers } = await supabase
    .from('customers')
    .select('clerk_user_id, tier');

  const customerTierMap = new Map(customers?.map(c => [c.clerk_user_id, c.tier]) || []);

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const resultsMap: Record<string, SalesAnalytics> = {};

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = days[date.getDay()];
    resultsMap[dayName] = { name: dayName, Retail: 0, Micro: 0, Restaurante: 0 };
  }

  orders?.forEach(order => {
    const date = new Date(order.created_at);
    const dayName = days[date.getDay()];
    const tier = order.clerk_user_id ? customerTierMap.get(order.clerk_user_id) : 'Personas Naturales';

    if (resultsMap[dayName]) {
      if (tier === 'Micromercados') {
        resultsMap[dayName].Micro += order.total_amount;
      } else if (tier === 'Restaurantes') {
        resultsMap[dayName].Restaurante += order.total_amount;
      } else {
        resultsMap[dayName].Retail += order.total_amount;
      }
    }
  });

  return Object.values(resultsMap);
}

export async function fetchKPIMetrics() {
  const { data: orders } = await supabase.from('orders').select('total_amount, status, clerk_user_id');
  
  const totalRevenue = orders?.reduce((acc, o) => acc + o.total_amount, 0) || 0;
  
  const { data: customers } = await supabase.from('customers').select('tier');
  const b2bCount = customers?.filter(c => c.tier !== 'Personas Naturales').length || 0;
  const totalCount = customers?.length || 1;
  const b2bRatio = (b2bCount / totalCount) * 100;

  return {
    totalRevenue,
    b2bRatio,
    activeOrders: orders?.filter(o => o.status !== 'Entregado' && o.status !== 'Cancelado').length || 0
  };
}
