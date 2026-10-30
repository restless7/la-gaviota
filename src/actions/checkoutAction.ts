'use server';

import { createOrder } from '@/src/lib/server/orderWriter';
import { prepareCheckout } from '@/src/lib/server/checkout';
import type { Product } from './products';

export interface CheckoutItem { product: Product; quantity: number }

export async function submitCheckoutOrder(formData: FormData, items: CheckoutItem[], totalAmount: number, idempotencyKey?: string) {
  const checkout = await prepareCheckout(formData, items, totalAmount);
  const { details } = checkout;
  const result = await createOrder({
    clerk_user_id: checkout.userId,
    customer_name: `${details.firstName} ${details.lastName}`,
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
  return { success: true, orderId: result.orderId, totalAmount: checkout.totalAmount, timestamp: new Date().toISOString() };
}
