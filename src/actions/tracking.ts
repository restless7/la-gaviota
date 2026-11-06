'use server';

import { auth } from '@clerk/nextjs/server';
import { getActor, hasCapability } from '@/src/lib/server/authorization';
import { getServerDatabase, getGuestCheckoutDatabase } from '@/src/lib/server/database';
import { computeOrderLifeCycle, ActiveOrderTrackingDetails } from '@/src/services/orderStatusService';
import { Order } from '@/src/actions/orders';

export async function fetchActiveCustomerOrder(): Promise<ActiveOrderTrackingDetails | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const actor = await getActor();
  const supabase = getServerDatabase(actor);

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !orders || orders.length === 0) {
      return null;
    }

    // Prioritize currently active/in-progress orders
    const activeOrder = orders.find((o) =>
      ['Pago Pendiente', 'Pendiente', 'En Preparación', 'En Ruta'].includes(o.status)
    );

    if (activeOrder) {
      return computeOrderLifeCycle(activeOrder as Order);
    }

    // If no live order, check if the last order was delivered within the last 48 hours
    const lastOrder = orders[0];
    if (lastOrder && (lastOrder.status === 'Entregado' || lastOrder.status === 'ARCHIVED_DELIVERED')) {
      const deliveredTime = new Date(lastOrder.created_at).getTime();
      const now = Date.now();
      const hoursSince = (now - deliveredTime) / (1000 * 60 * 60);
      if (hoursSince <= 48) {
        return computeOrderLifeCycle(lastOrder as Order);
      }
    }

    return null;
  } catch (err) {
    console.warn('[fetchActiveCustomerOrder] Failed to retrieve customer order:', err);
    return null;
  }
}

export async function fetchOrderTrackingById(orderId: string): Promise<ActiveOrderTrackingDetails | null> {
  if (!orderId || typeof orderId !== 'string') return null;

  try {
    const actor = await getActor();
    const isAdmin = hasCapability(actor, 'orders.manage');

    // Use server database for authenticated, or fallback to guest database
    const supabase = actor.userId ? getServerDatabase(actor) : getGuestCheckoutDatabase();

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) {
      return null;
    }

    // Access control: if user is logged in, ensure they own it or have admin privileges
    if (actor.userId && !isAdmin && order.clerk_user_id && order.clerk_user_id !== actor.userId) {
      console.warn('[fetchOrderTrackingById] Unauthorized order tracking access attempt');
      return null;
    }

    return computeOrderLifeCycle(order as Order);
  } catch (err) {
    console.error('[fetchOrderTrackingById] Error retrieving order tracking:', err);
    return null;
  }
}

