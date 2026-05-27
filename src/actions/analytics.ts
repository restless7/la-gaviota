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
  const { data: customers } = await supabase.from('customers').select('clerk_user_id, tier');

  const customerTierMap = new Map(customers?.map(c => [c.clerk_user_id, c.tier]) || []);

  const validStatuses = ['En Preparación', 'En Ruta', 'Entregado'];
  const validOrders = orders?.filter(o => validStatuses.includes(o.status)) || [];

  // 1. Ingresos Totales Brutos
  const totalRevenue = validOrders.reduce((acc, o) => acc + o.total_amount, 0);

  // 2. Volumen y Ticket por Segmento
  let countRetail = 0;
  let countMicro = 0;
  let countRest = 0;

  let sumRetail = 0;
  let sumMicro = 0;
  let sumRest = 0;

  validOrders.forEach(o => {
    const tier = o.clerk_user_id ? customerTierMap.get(o.clerk_user_id) : 'Personas Naturales';
    if (tier === 'Micromercados') {
      countMicro++;
      sumMicro += o.total_amount;
    } else if (tier === 'Restaurantes') {
      countRest++;
      sumRest += o.total_amount;
    } else {
      countRetail++;
      sumRetail += o.total_amount;
    }
  });

  const totalValidCount = validOrders.length || 1;
  const retailRatio = (countRetail / totalValidCount) * 100;
  const microRatio = (countMicro / totalValidCount) * 100;
  const restRatio = (countRest / totalValidCount) * 100;

  // 3. Ticket Promedio
  const averageTicket = totalValidCount > 0 ? totalRevenue / totalValidCount : 0;
  const avgRetail = countRetail > 0 ? sumRetail / countRetail : 0;
  const avgMicro = countMicro > 0 ? sumMicro / countMicro : 0;
  const avgRest = countRest > 0 ? sumRest / countRest : 0;

  return {
    totalRevenue,
    retailRatio,
    microRatio,
    restRatio,
    averageTicket,
    avgRetail,
    avgMicro,
    avgRest,
    activeOrders: orders?.filter(o => o.status === 'Pendiente' || o.status === 'En Preparación' || o.status === 'En Ruta').length || 0
  };
}
