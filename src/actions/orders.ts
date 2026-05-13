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
  status: 'Pendiente' | 'En Preparación' | 'En Ruta' | 'Entregado' | 'Cancelado';
  payment_method: string;
  notes: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }

  return data || [];
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

export async function createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'order_items'>, items: Omit<OrderItem, 'id' | 'order_id'>[]) {
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

  // 3. Update customer stats if clerk_user_id exists
  if (orderData.clerk_user_id) {
    // We use a simplified approach: just incrementing. 
    // In a more robust system, we might want to recalculate from all orders.
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
