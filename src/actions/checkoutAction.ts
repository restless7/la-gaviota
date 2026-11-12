'use server';

import { createOrder } from '@/src/lib/server/orderWriter';
import { prepareCheckout } from '@/src/lib/server/checkout';
import { triggerOrderNotification } from '@/src/lib/notifications';
import type { Product } from './products';

export interface CheckoutItem { product: Product; quantity: number }

export async function submitCheckoutOrder(formData: FormData, items: CheckoutItem[], totalAmount: number, idempotencyKey?: string) {
  const checkout = await prepareCheckout(formData, items, totalAmount);
  const { details } = checkout;
  const customerName = `${details.firstName} ${details.lastName}`;
  const result = await createOrder({
    clerk_user_id: checkout.userId,
    customer_name: customerName,
    customer_email: details.email,
    customer_phone: details.phone,
    delivery_address: details.fullAddress,
    delivery_municipality: details.city,
    total_amount: checkout.totalAmount,
    status: 'Pendiente',
    payment_method: 'cash',
    idempotency_key: idempotencyKey || null,
    notes: details.notes,
  }, checkout.orderItems, false);
  if (result.orderId) {
    triggerOrderNotification(result.orderId, details.phone, customerName, checkout.totalAmount).catch(err => {
      console.error('[submitCheckoutOrder] WhatsApp notification warning:', err);
    });
  }
  return { success: true, orderId: result.orderId, totalAmount: checkout.totalAmount, timestamp: new Date().toISOString() };
}

export async function submitCashCheckoutAction(
  formData: FormData,
  items: CheckoutItem[],
  idempotencyKey?: string
): Promise<
  | { ok: true; orderId: string; totalAmount: number; timestamp: string }
  | { ok: false; error: string }
> {
  try {
    const checkout = await prepareCheckout(formData, items);
    const { details } = checkout;
    const customerName = `${details.firstName} ${details.lastName}`;
    const result = await createOrder({
      clerk_user_id: checkout.userId,
      customer_name: customerName,
      customer_email: details.email,
      customer_phone: details.phone,
      delivery_address: details.fullAddress,
      delivery_municipality: details.city,
      total_amount: checkout.totalAmount,
      status: 'Pendiente',
      payment_method: 'cash',
      idempotency_key: idempotencyKey || null,
      notes: details.notes,
    }, checkout.orderItems, false);
    if (result.orderId) {
      triggerOrderNotification(result.orderId, details.phone, customerName, checkout.totalAmount).catch(err => {
        console.error('[submitCashCheckoutAction] WhatsApp notification warning:', err);
      });
    }
    return { ok: true, orderId: result.orderId, totalAmount: checkout.totalAmount, timestamp: new Date().toISOString() };
  } catch (err) {
    console.error('[submitCashCheckoutAction] Checkout error:', err);
    const message = err instanceof Error ? err.message : 'No pudimos procesar tu pedido. Verifica tus datos e intenta nuevamente.';
    return { ok: false, error: message };
  }
}
