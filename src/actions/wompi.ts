'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { generateIntegritySignature, formatToCents, assertWompiCheckoutConfigured } from '@/src/lib/wompi';
import { createOrder } from '@/src/lib/server/orderWriter';
import { getActor, assertIssuedActor } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';
import { prepareCheckout } from '@/src/lib/server/checkout';
import type { CheckoutItem } from './checkoutAction';

export type WompiInitResult =
  | {
      ok: true;
      publicKey: string;
      totalAmount: number;
      orderId: string;
      currency: string;
      amountInCents: number;
      reference: string;
      signature: string;
      customerData: {
        email: string;
        fullName: string;
        phoneNumber: string;
        phoneNumberPrefix: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

export async function initializeWompiTransaction(
  formData: FormData,
  items: CheckoutItem[],
  expectedTotal?: number,
  idempotencyKey?: string
): Promise<WompiInitResult> {
  try {
    const isOnlinePaymentsEnabled = (process.env.ENABLE_ONLINE_PAYMENTS || '').includes('true');
    const appEnv = (process.env.APP_ENV || '').replace(/^APP_ENV=\s*/i, '').trim().toLowerCase();
    if (appEnv === 'production' && !isOnlinePaymentsEnabled) {
      return {
        ok: false,
        error: 'Los pagos electrónicos (Wompi) están desactivados en el backend. Seleccione Pago Contra Entrega.',
      };
    }
    const checkout = await prepareCheckout(formData, items, expectedTotal);
    // Fail before inserting an order when the widget cannot be configured.
    const publicKey = assertWompiCheckoutConfigured();
    const amountInCents = formatToCents(checkout.totalAmount);
    const { details } = checkout;
    const intentId = `INTENT_${Date.now()}_${(checkout.userId || 'guest').substring(0, 12)}`;
    const orderResult = await createOrder({
      clerk_user_id: checkout.userId,
      customer_name: `${details.firstName} ${details.lastName}`,
      customer_email: details.email,
      customer_phone: details.phone,
      delivery_address: details.fullAddress,
      delivery_municipality: details.city,
      total_amount: checkout.totalAmount,
      status: 'Pago Pendiente',
      payment_method: 'wompi',
      idempotency_key: idempotencyKey || null,
      notes: details.notes,
    }, checkout.orderItems, false, {
      intent_id: intentId,
      purpose: 'ORDER_CHECKOUT',
      currency: 'COP',
      provider: 'WOMPI',
      environment: process.env.NEXT_PUBLIC_WOMPI_ENVIRONMENT || 'sandbox'
    });
    const reference = orderResult.orderId;
    const signature = generateIntegritySignature(reference, amountInCents, 'COP');
    return {
      ok: true,
      publicKey,
      totalAmount: checkout.totalAmount,
      orderId: reference,
      currency: 'COP',
      amountInCents,
      reference,
      signature,
      customerData: {
        email: details.email,
        fullName: `${details.firstName} ${details.lastName}`,
        phoneNumber: details.phone,
        phoneNumberPrefix: '+57',
      },
    };
  } catch (error: unknown) {
    console.error('[initializeWompiTransaction] Initialization failed:', error);
    const message = error instanceof Error
      ? error.message
      : 'No se pudo inicializar la pasarela de pagos Wompi. Por favor intenta de nuevo o elige contra entrega.';
    return {
      ok: false,
      error: message,
    };
  }
}

export async function initializeWompiBalancePayment(amount: number) {
  const isOnlinePaymentsEnabled = (process.env.ENABLE_ONLINE_PAYMENTS || '').includes('true');
  const appEnv = (process.env.APP_ENV || '').replace(/^APP_ENV=\s*/i, '').trim().toLowerCase();
  if (appEnv === 'production' && !isOnlinePaymentsEnabled) {
    throw new Error('ELECTRONIC_PAYMENTS_DISABLED: Los pagos electrónicos (Wompi) están desactivados en el backend. Seleccione Pago Contra Entrega.');
  }
  const actor = await getActor();
  assertIssuedActor(actor);
  try {
    const userId = actor.userId;
    if (!userId) throw new Error("Usuario no autenticado");

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Ensure amount is valid
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 2147483647) throw new Error("Monto inválido");
    assertWompiCheckoutConfigured();

    // Generate a reference for balance payment binding to the exact immutable user id
    const reference = `BAL_${userId}_${Date.now()}`;
    const amountInCents = formatToCents(amount);
    const signature = generateIntegritySignature(reference, amountInCents, 'COP');

    // Persist payment intent in payment_intents table
    try {
      const supabase = getServerDatabase(actor);
      await supabase.from('payment_intents').insert({
        intent_id: reference,
        clerk_user_id: userId,
        purpose: 'B2B_BALANCE',
        amount: amount,
        currency: 'COP',
        provider: 'WOMPI',
        environment: process.env.NEXT_PUBLIC_WOMPI_ENVIRONMENT || 'sandbox',
        status: 'PENDING',
        provider_reference: reference
      });
    } catch (dbErr) {
      console.warn('Could not record B2B payment intent in database:', dbErr);
    }

    return {
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUB_KEY,
      currency: 'COP',
      amountInCents,
      reference,
      signature,
      customerData: {
        email: user.emailAddresses[0]?.emailAddress || '',
        fullName: `${user.firstName} ${user.lastName}`,
        phoneNumber: '', // Not strictly required if not available
        phoneNumberPrefix: '+57',
      }
    };
  } catch (error: unknown) {
    console.error('[WompiBalancePayment] Error:', error);
    throw new Error(error instanceof Error ? error.message : 'Error inicializando el pago de saldo.');
  }
}
