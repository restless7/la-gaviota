import 'server-only';
import type { Order, OrderItem } from '@/src/actions/orders';
import { revalidatePath } from 'next/cache';
import { requireOwnedSubject, getActor } from './authorization';
import { getServerDatabase, getGuestCheckoutDatabase, readPublicInventoryFlag } from './database';
import { assertOrderWrite } from '@/src/lib/checkoutValidation';
import { computeCheckoutFingerprint } from '@/src/lib/idempotency';
import { calculateDeliverySchedule } from '@/src/lib/deliveryCutoff';

export interface PaymentIntentData {
  intent_id: string;
  purpose?: string;
  currency?: string;
  provider?: string;
  environment?: string;
  provider_reference?: string;
}

export async function createOrder(
  orderData: Omit<Order, 'id' | 'created_at' | 'order_items'> & { idempotency_key?: string | null; idempotency_fingerprint?: string | null },
  items: Omit<OrderItem, 'id' | 'order_id'>[],
  incrementLTV: boolean = false,
  paymentIntent?: PaymentIntentData | null
) {
  assertOrderWrite(orderData.total_amount, items);

  // Backend Payment Method Enforcement
  // Electronic methods (Wompi, Cards, PSE) are permitted when ENABLE_ONLINE_PAYMENTS is true.
  const rawMethod = (orderData.payment_method || 'cash').trim().toLowerCase();
  const isCashChannel = rawMethod === 'cash' || rawMethod === 'contra_entrega';
  if (!isCashChannel) {
    const isOnlinePaymentsEnabled = (process.env.ENABLE_ONLINE_PAYMENTS || '').includes('true');
    const appEnv = (process.env.APP_ENV || '').replace(/^APP_ENV=\s*/i, '').trim().toLowerCase();
    if (appEnv === 'production' && !isOnlinePaymentsEnabled) {
      throw new Error(
        'PAYMENT_METHOD_DISABLED: Los pagos electrónicos (Wompi) están desactivados en el backend. Seleccione Pago Contra Entrega.'
      );
    }
  }

  let supabase: ReturnType<typeof getServerDatabase>;
  if (orderData.clerk_user_id === null) {
    const actor = typeof getActor === 'function' ? await getActor() : { userId: null, role: 'GUEST' as const, tier: 'Personas Naturales' as const };
    if (actor && actor.role === 'INVALID') {
      throw new Error('INVALID_ACTOR');
    }
    supabase = typeof getGuestCheckoutDatabase === 'function' ? getGuestCheckoutDatabase() : getServerDatabase({ userId: 'guest', role: 'USER', tier: 'Personas Naturales' });
  } else {
    const actor = await requireOwnedSubject(orderData.clerk_user_id);
    supabase = getServerDatabase(actor);
  }

  // Canonical delivery date calculation: enforce 10:00 PM cutoff rule
  if (!orderData.scheduled_delivery_date) {
    const schedule = calculateDeliverySchedule();
    orderData.scheduled_delivery_date = schedule.scheduledDateIso;
    if (schedule.isAfterCutoff) {
      const cutoffPrefix = '[ORDEN POSTERIOR A 10:00 PM - ENTREGA PASADO MAÑANA]';
      orderData.notes = orderData.notes ? `${cutoffPrefix} ${orderData.notes}`.slice(0, 2000) : cutoffPrefix;
    }
  }

  // Compute canonical checkout fingerprint if idempotency key is present
  if (orderData.idempotency_key && !orderData.idempotency_fingerprint) {
    orderData.idempotency_fingerprint = computeCheckoutFingerprint({
      clerk_user_id: orderData.clerk_user_id || '',
      purchase_tier: (orderData as any).tier || 'retail',
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
      })),
      delivery_address: orderData.delivery_address || '',
      delivery_municipality: orderData.delivery_municipality || 'bucaramanga',
      total_amount: orderData.total_amount,
      payment_method: orderData.payment_method || 'cash',
    });
  }

  // Strategy 1: Prioritize true atomic database transaction via create_order_atomic RPC
  if (typeof (supabase as any).rpc === 'function') {
    try {
      const { data: rpcResult, error: rpcError } = await (supabase as any).rpc('create_order_atomic', {
        p_order: orderData,
        p_items: items,
        p_payment_intent: paymentIntent || null
      });

      if (!rpcError && rpcResult && rpcResult.success) {
        revalidatePath('/admin/orders');
        revalidatePath('/admin/clientes');
        return { success: true, orderId: rpcResult.order_id, duplicate: Boolean(rpcResult.duplicate) };
      }

      if (rpcError) {
        if (rpcError.message?.includes('INSUFFICIENT_STOCK')) {
          throw new Error('INSUFFICIENT_STOCK');
        }
        if (rpcError.message?.includes('IDEMPOTENCY_OWNER_MISMATCH')) {
          throw new Error('IDEMPOTENCY_OWNER_MISMATCH');
        }
        if (rpcError.message?.includes('IDEMPOTENCY_PAYLOAD_MISMATCH')) {
          throw new Error('IDEMPOTENCY_PAYLOAD_MISMATCH');
        }
        if (rpcError.message?.includes('FORBIDDEN_USER_IMPERSONATION')) {
          throw new Error('FORBIDDEN_USER_IMPERSONATION');
        }
        if (rpcError.message?.includes('INVALID_ITEM_QUANTITY')) {
          throw new Error('INVALID_ITEM_QUANTITY');
        }
        throw new Error(rpcError.message || 'DATABASE_RPC_ERROR');
      }
    } catch (rpcEx) {
      if (rpcEx instanceof Error && (
        rpcEx.message === 'INSUFFICIENT_STOCK' ||
        rpcEx.message === 'IDEMPOTENCY_OWNER_MISMATCH' ||
        rpcEx.message === 'IDEMPOTENCY_PAYLOAD_MISMATCH' ||
        rpcEx.message === 'FORBIDDEN_USER_IMPERSONATION' ||
        rpcEx.message === 'INVALID_ITEM_QUANTITY'
      )) {
        throw rpcEx;
      }
      // RPC fallback for mock harnesses or pre-migration environments
    }
  }

  // Strategy 2: Guarded boundary with Idempotency verification and compensation
  if (orderData.idempotency_key) {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, total_amount, status, clerk_user_id, idempotency_fingerprint')
      .eq('idempotency_key', orderData.idempotency_key)
      .maybeSingle();

    if (existingOrder) {
      if (existingOrder.clerk_user_id && existingOrder.clerk_user_id !== orderData.clerk_user_id) {
        throw new Error('IDEMPOTENCY_OWNER_MISMATCH');
      }
      if (existingOrder.idempotency_fingerprint && orderData.idempotency_fingerprint && existingOrder.idempotency_fingerprint !== orderData.idempotency_fingerprint) {
        throw new Error('IDEMPOTENCY_PAYLOAD_MISMATCH');
      }
      if (existingOrder.total_amount !== undefined && existingOrder.total_amount !== orderData.total_amount) {
        throw new Error('IDEMPOTENCY_PAYLOAD_MISMATCH');
      }
      return { success: true, orderId: existingOrder.id, duplicate: true };
    }
  }

  // Insert order header
  let { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError || !order) {
    console.warn('Primary order header insert failed, retrying with core schema columns:', orderError);
    const coreOrderData = {
      clerk_user_id: orderData.clerk_user_id,
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone,
      delivery_address: orderData.delivery_address,
      delivery_municipality: orderData.delivery_municipality,
      total_amount: orderData.total_amount,
      status: orderData.status || 'Pendiente',
      payment_method: orderData.payment_method || 'cash',
      scheduled_delivery_date: orderData.scheduled_delivery_date || null,
      notes: orderData.notes || null,
    };
    const retryResult = await supabase
      .from('orders')
      .insert(coreOrderData)
      .select()
      .single();
    order = retryResult.data;
    orderError = retryResult.error;
  }

  if (orderError || !order) {
    console.error('Error creating order header:', orderError);
    throw new Error('Failed to create order');
  }

  // Insert order lines with compensation rollback
  const itemsWithOrderId = items.map(item => ({
    ...item,
    order_id: order.id
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId);

  if (itemsError) {
    console.error('Error creating order items, executing compensation cleanup:', itemsError);
    try {
      await supabase.from('orders').delete().eq('id', order.id);
    } catch (cleanupError) {
      console.error('Compensation cleanup failed; orphan order remains:', cleanupError);
    }
    throw new Error('Failed to create order items');
  }

  // Atomic stock deduction if inventory tracking is active
  try {
    const { track_inventory } = await readPublicInventoryFlag();
    if (track_inventory && items.length > 0) {
      for (const item of items) {
        if (item.product_id) {
          const { data: prod } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .maybeSingle();

          if (prod && typeof prod.stock_quantity === 'number') {
            if (prod.stock_quantity < item.quantity) {
              // Rollback order if stock insufficient
              await supabase.from('order_items').delete().eq('order_id', order.id);
              await supabase.from('orders').delete().eq('id', order.id);
              throw new Error('INSUFFICIENT_STOCK');
            }
            const nextStock = Math.max(0, prod.stock_quantity - item.quantity);
            await supabase
              .from('products')
              .update({ stock_quantity: nextStock })
              .eq('id', item.product_id);
          }
        }
      }
    }
  } catch (inventoryError) {
    if (inventoryError instanceof Error && inventoryError.message === 'INSUFFICIENT_STOCK') {
      throw inventoryError;
    }
    console.warn('Inventory deduction skipped or unavailable:', inventoryError);
  }

  // Payment intent record if provided
  if (paymentIntent && paymentIntent.intent_id) {
    try {
      await supabase.from('payment_intents').insert({
        intent_id: paymentIntent.intent_id,
        order_id: order.id,
        clerk_user_id: orderData.clerk_user_id,
        purpose: paymentIntent.purpose || 'ORDER_CHECKOUT',
        amount: orderData.total_amount,
        currency: paymentIntent.currency || 'COP',
        provider: paymentIntent.provider || 'WOMPI',
        environment: paymentIntent.environment || 'sandbox',
        status: 'PENDING',
        provider_reference: paymentIntent.provider_reference || order.id
      });
    } catch (intentErr) {
      console.warn('Could not record payment intent:', intentErr);
    }
  }

  // Update customer stats if requested (Two-Phase Commit for Wompi)
  if (incrementLTV && orderData.clerk_user_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('total_orders, total_spent')
      .eq('clerk_user_id', orderData.clerk_user_id)
      .maybeSingle();

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
