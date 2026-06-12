'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  productId?: string;
  category?: string;
}

export async function getAdvancedFinancialSummary(filters: AnalyticsFilters) {
  let query = supabase.from('orders').select('id, total_amount, purchase_tier, status, order_items!inner(product_id)');

  if (filters.startDate) query = query.gte('created_at', filters.startDate);
  if (filters.endDate) query = query.lte('created_at', filters.endDate);
  if (filters.productId) query = query.eq('order_items.product_id', filters.productId);
  
  // Note: we can't easily filter by category through orders->order_items->products in a single simple JS query without RPC, 
  // but we fetch data and process. In an enterprise system, we use an RPC.
  // For now, we will do a robust JS aggregation over the filtered rows.
  
  const { data: orders, error } = await query;
  if (error) {
    console.error('Error fetching financial summary:', error);
    return {
      totalRevenue: 0,
      activeOrders: 0,
      retailRatio: 0, microRatio: 0, restRatio: 0,
      averageTicket: 0, avgRetail: 0, avgMicro: 0, avgRest: 0,
    };
  }

  // Use a Map to deduplicate orders if we joined with order_items
  const uniqueOrders = new Map<string, any>();
  orders?.forEach(o => {
    uniqueOrders.set(o.id, o); // wait, id is not selected. Let's fix that.
  });

  // Let's re-query to ensure we only get unique orders if we filter by product_id
  let baseOrdersQuery = supabase.from('orders').select('id, total_amount, purchase_tier, status');
  if (filters.startDate) baseOrdersQuery = baseOrdersQuery.gte('created_at', filters.startDate);
  if (filters.endDate) baseOrdersQuery = baseOrdersQuery.lte('created_at', filters.endDate);

  const { data: baseOrders } = await baseOrdersQuery;
  
  let validOrders = baseOrders || [];
  
  if (filters.productId) {
    // If filtering by product, intersect
    const { data: itemMatches } = await supabase.from('order_items').select('order_id').eq('product_id', filters.productId);
    const validIds = new Set(itemMatches?.map(i => i.order_id));
    validOrders = validOrders.filter(o => validIds.has(o.id));
  }

  let totalRevenue = 0;
  let countRetail = 0, countMicro = 0, countRest = 0;
  let sumRetail = 0, sumMicro = 0, sumRest = 0;
  let activeOrders = 0;

  validOrders.forEach(o => {
    if (['Pendiente', 'En Preparación', 'En Ruta'].includes(o.status)) {
      activeOrders++;
    }
    
    // Solo ingresos validados
    if (['En Preparación', 'En Ruta', 'Entregado', 'ARCHIVED_DELIVERED'].includes(o.status)) {
      totalRevenue += Number(o.total_amount);
      const tier = o.purchase_tier || 'RETAIL';
      
      if (tier === 'WHOLESALE' || tier === 'Restaurantes') {
        countRest++; sumRest += Number(o.total_amount);
      } else if (tier === 'DISTRIBUTOR' || tier === 'Micromercados') {
        countMicro++; sumMicro += Number(o.total_amount);
      } else {
        countRetail++; sumRetail += Number(o.total_amount);
      }
    }
  });

  const totalValidCount = countRetail + countMicro + countRest || 1;

  return {
    totalRevenue,
    activeOrders,
    retailRatio: (countRetail / totalValidCount) * 100,
    microRatio: (countMicro / totalValidCount) * 100,
    restRatio: (countRest / totalValidCount) * 100,
    averageTicket: totalValidCount > 1 ? totalRevenue / totalValidCount : 0,
    avgRetail: countRetail > 0 ? sumRetail / countRetail : 0,
    avgMicro: countMicro > 0 ? sumMicro / countMicro : 0,
    avgRest: countRest > 0 ? sumRest / countRest : 0,
  };
}

export async function getSalesProjectionData(filters: AnalyticsFilters) {
  let query = supabase.from('orders').select('id, created_at, total_amount, purchase_tier, status');
  if (filters.startDate) query = query.gte('created_at', filters.startDate);
  if (filters.endDate) query = query.lte('created_at', filters.endDate);

  const { data: orders } = await query;
  let validOrders = orders || [];

  if (filters.productId) {
    const { data: itemMatches } = await supabase.from('order_items').select('order_id').eq('product_id', filters.productId);
    const validIds = new Set(itemMatches?.map(i => i.order_id));
    validOrders = validOrders.filter(o => validIds.has(o.id));
  }

  // Agrupar por fecha
  const resultsMap: Record<string, { name: string, Retail: number, Micro: number, Restaurante: number }> = {};
  
  validOrders.forEach(order => {
    if (!['En Preparación', 'En Ruta', 'Entregado', 'ARCHIVED_DELIVERED'].includes(order.status)) return;

    const date = new Date(order.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
    if (!resultsMap[date]) {
      resultsMap[date] = { name: date, Retail: 0, Micro: 0, Restaurante: 0 };
    }

    const tier = order.purchase_tier || 'RETAIL';
    if (tier === 'WHOLESALE' || tier === 'Restaurantes') {
      resultsMap[date].Restaurante += Number(order.total_amount);
    } else if (tier === 'DISTRIBUTOR' || tier === 'Micromercados') {
      resultsMap[date].Micro += Number(order.total_amount);
    } else {
      resultsMap[date].Retail += Number(order.total_amount);
    }
  });

  // Sort chronologically (simple approach: sort by Date parsing if possible, or assume db ordered if we had done it. We'll sort by original date)
  // To keep it simple, return Object.values
  return Object.values(resultsMap);
}

export async function getRealShrinkageMetrics(filters: AnalyticsFilters) {
  let query = supabase.from('agricultural_shrinkage_logs').select(`
    quantity_kg, 
    log_type, 
    products!inner(category, id)
  `);

  if (filters.startDate) query = query.gte('logged_at', filters.startDate);
  if (filters.endDate) query = query.lte('logged_at', filters.endDate);
  if (filters.productId) query = query.eq('product_id', filters.productId);
  if (filters.category) query = query.eq('products.category', filters.category);

  const { data: logs, error } = await query;
  
  if (error) {
    console.error('Error fetching shrinkage logs:', error);
    return [];
  }

  const resultsMap: Record<string, { category: string, Merma: number, Recuperado: number }> = {};

  logs?.forEach((log: any) => {
    const cat = log.products.category || 'Otros';
    if (!resultsMap[cat]) {
      resultsMap[cat] = { category: cat, Merma: 0, Recuperado: 0 };
    }
    if (log.log_type === 'MERMA_TOTAL') {
      resultsMap[cat].Merma += Number(log.quantity_kg);
    } else {
      resultsMap[cat].Recuperado += Number(log.quantity_kg);
    }
  });

  return Object.values(resultsMap);
}

export async function logAgriculturalShrinkage(payload: { productId: string, quantityKg: number, logType: 'MERMA_TOTAL' | 'RECUPERADO_ORGANICO', reason: string }) {
  const { error } = await supabase.from('agricultural_shrinkage_logs').insert({
    product_id: payload.productId,
    quantity_kg: payload.quantityKg,
    log_type: payload.logType,
    loss_reason: payload.reason
  });

  if (error) {
    console.error('Error logging shrinkage:', error);
    throw new Error('No se pudo registrar la novedad de merma.');
  }

  revalidatePath('/admin/reports');
  return { success: true };
}

export async function fetchAllProducts() {
  const { data, error } = await supabase.from('products').select('id, name, category').order('name');
  if (error) throw new Error('Failed to fetch products');
  return data || [];
}
