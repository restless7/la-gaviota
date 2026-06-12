'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: string;
  clerk_user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_municipality: string;
  total_amount: number;
  status: 'Pago Pendiente' | 'Pendiente' | 'En Preparación' | 'En Ruta' | 'Entregado' | 'Cancelado' | 'ARCHIVED_DELIVERED';
  payment_method: string;
  notes: string | null;
  created_at: string;
  scheduled_delivery_date?: string;
  is_conflicted?: boolean;
  conflict_reason?: string | null;
  order_items?: OrderItem[];
}

export async function getLiveOperationalOrders(): Promise<Order[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .neq('status', 'ARCHIVED_DELIVERED')
    .eq('scheduled_delivery_date', today)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching live operational orders:', error);
    throw new Error('Failed to fetch live orders');
  }

  return data || [];
}

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order by id:', error);
    return null;
  }
  return data;
}

export async function updateOrderStatus(orderId: string, newStatus: Order['status']) {
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin'); // Revalidate dashboard stats
  return { success: true };
}

export async function createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'order_items'>, items: Omit<OrderItem, 'id' | 'order_id'>[], incrementLTV: boolean = false) {
  // 1. Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw new Error('Failed to create order');
  }

  // 2. Insert order items
  const itemsWithOrderId = items.map(item => ({
    ...item,
    order_id: order.id
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    throw new Error('Failed to create order items');
  }

  // 3. Update customer stats if requested (Two-Phase Commit for Wompi)
  if (incrementLTV && orderData.clerk_user_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('total_orders, total_spent')
      .eq('clerk_user_id', orderData.clerk_user_id)
      .single();

    await supabase
      .from('customers')
      .upsert({
        clerk_user_id: orderData.clerk_user_id,
        full_name: orderData.customer_name,
        email: orderData.customer_email,
        phone: orderData.customer_phone,
        address: orderData.delivery_address,
        total_orders: (customer?.total_orders || 0) + 1,
        total_spent: (customer?.total_spent || 0) + orderData.total_amount,
        last_order_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin/clientes');
  return { success: true, orderId: order.id };
}
export async function fetchOrderConsolidation(statuses: string[] = ['Pendiente', 'En Preparación']) {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      product_id,
      quantity,
      product_name,
      orders!inner(status)
    `)
    .in('orders.status', statuses);

  if (error) {
    console.error('Error fetching order consolidation:', error);
    throw new Error('Failed to fetch order consolidation');
  }

  // Group by product_id
  const consolidation: Record<string, { id: string, name: string, quantity: number }> = {};

  data.forEach((item: any) => {
    const pid = item.product_id;
    if (!consolidation[pid]) {
      consolidation[pid] = { id: pid, name: item.product_name, quantity: 0 };
    }
    consolidation[pid].quantity += item.quantity;
  });

  const consolidatedList = Object.values(consolidation).sort((a, b) => b.quantity - a.quantity);

  // Fetch current stock for these products to compute deficit
  if (consolidatedList.length > 0) {
    const productIds = consolidatedList.map(c => c.id);
    const { data: productsData } = await supabase
      .from('products')
      .select('id, stock_quantity, unit')
      .in('id', productIds);

    if (productsData) {
      return consolidatedList.map(c => {
        const p = productsData.find(pd => pd.id === c.id);
        return {
          ...c,
          stock: p?.stock_quantity || 0,
          unit: p?.unit || 'Und',
          deficit: Math.max(0, c.quantity - (p?.stock_quantity || 0))
        };
      });
    }
  }

  return consolidatedList.map(c => ({ ...c, stock: 0, unit: 'Und', deficit: c.quantity }));
}

export async function flagOrderConflict(orderId: string, reason: string) {
  const { error } = await supabase
    .from('orders')
    .update({ 
      is_conflicted: true, 
      conflict_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error flagging order conflict:', error);
    throw new Error('Failed to flag order conflict');
  }

  revalidatePath('/admin/orders');
  return { success: true };
}

export async function cancelAndRefundOrder(orderId: string, reason: string) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('total_amount, clerk_user_id')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('Error fetching order to cancel:', orderError);
    throw new Error('Failed to fetch order details');
  }

  if (order.clerk_user_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('total_orders, total_spent')
      .eq('clerk_user_id', order.clerk_user_id)
      .single();

    if (customer) {
      await supabase
        .from('customers')
        .update({
          total_orders: Math.max(0, (customer.total_orders || 0) - 1),
          total_spent: Math.max(0, (customer.total_spent || 0) - order.total_amount),
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', order.clerk_user_id);
    }
  }

  const { error } = await supabase
    .from('orders')
    .update({ 
      status: 'Cancelado',
      is_conflicted: true,
      conflict_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) {
    console.error('Error canceling order:', error);
    throw new Error('Failed to cancel order');
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin/clientes');
  return { success: true };
}

export async function closeOperationalDay(date: string, userId: string) {
  // 1. Fetch active orders for the date
  const { data: activeOrders, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, is_conflicted, total_amount')
    .eq('scheduled_delivery_date', date)
    .neq('status', 'ARCHIVED_DELIVERED')
    .neq('status', 'Cancelado');

  if (fetchError) throw new Error('Failed to fetch active orders for closure');

  // Verify there are no pending normal orders
  const pendingNormalOrders = activeOrders?.filter(
    (o) => !o.is_conflicted && ['Pendiente', 'En Preparación', 'En Ruta'].includes(o.status)
  ) || [];

  if (pendingNormalOrders.length > 0) {
    throw new Error('No se puede cerrar el día con órdenes activas sin entregar o sin conflicto reportado.');
  }

  // 2. Postpone conflicted orders
  const conflictedOrders = activeOrders?.filter(o => o.is_conflicted) || [];
  if (conflictedOrders.length > 0) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    const { error: postponeError } = await supabase
      .from('orders')
      .update({ 
        scheduled_delivery_date: nextDayStr, 
        is_conflicted: false, // Reset conflict for the new day
        conflict_reason: null,
        status: 'Pendiente' // Send back to pending
      })
      .in('id', conflictedOrders.map(o => o.id));

    if (postponeError) throw new Error('Failed to postpone conflicted orders');
  }

  // 3. Calculate revenue and total orders delivered
  const deliveredOrders = activeOrders?.filter(o => o.status === 'Entregado') || [];
  const totalRevenue = deliveredOrders.reduce((acc, o) => acc + Number(o.total_amount), 0);
  const totalProcessed = deliveredOrders.length;

  // 4. Archive delivered orders
  if (deliveredOrders.length > 0) {
    const { error: archiveError } = await supabase
      .from('orders')
      .update({ status: 'ARCHIVED_DELIVERED' })
      .in('id', deliveredOrders.map(o => o.id));

    if (archiveError) throw new Error('Failed to archive delivered orders');
  }

  // 5. Insert operational ledger
  const { error: ledgerError } = await supabase
    .from('daily_operational_ledgers')
    .insert({
      operational_date: date,
      total_orders_processed: totalProcessed,
      total_revenue_collected: totalRevenue,
      closed_by_user: userId
    });

  if (ledgerError) {
    if (ledgerError.code === '23505') {
      throw new Error('El libro diario de esta fecha ya fue cerrado.');
    }
    console.error('Ledger error:', ledgerError);
    throw new Error('Failed to insert daily ledger');
  }

  revalidatePath('/admin/orders');
  return { success: true, postponedCount: conflictedOrders.length, archivedCount: deliveredOrders.length };
}
export async function getHistoricLedgers() {
  const { data, error } = await supabase
    .from('daily_operational_ledgers')
    .select('*')
    .order('operational_date', { ascending: false });

  if (error) {
    console.error('Error fetching ledgers:', error);
    throw new Error('Failed to fetch historical ledgers');
  }
  return data || [];
}

export async function fetchHistoricOrdersByDate(date: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('scheduled_delivery_date', date)
    .eq('status', 'ARCHIVED_DELIVERED')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching historic orders for date:', error);
    throw new Error('Failed to fetch historic orders');
  }

  return data || [];
}
