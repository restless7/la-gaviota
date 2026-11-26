import 'server-only';
import { getPublicDatabase, readPublicInventoryFlag } from '@/src/lib/server/database';
import { createOrder } from '@/src/lib/server/orderWriter';
import { quoteCheckout, type CheckoutProduct } from '@/src/lib/checkoutValidation';
import { calculateNextDeliveryDate, formatBogotaDateIso } from './recurrence';
import { getActivePromotion, calculateDiscount } from '@/src/lib/server/promotions';
import { triggerOrderNotification } from '@/src/lib/notifications';
import { CHRISTMAS_CUSHIONS } from '@/src/data/christmasProducts';
import { randomUUID } from 'node:crypto';

export interface GenerationResult {
  success: boolean;
  occurrenceId: string;
  orderId?: string;
  status: 'CONFIRMED' | 'PENDING_APPROVAL' | 'FAILED' | 'SKIPPED';
  totalAmount?: number;
  message?: string;
  errorCode?: string;
}

/**
 * Processes a single subscription occurrence, validating real-time prices,
 * inventory and spending caps, then generating an order via the canonical orderWriter.
 */
export async function generateOrderForOccurrence(
  occurrenceId: string,
  options: { isDryRun?: boolean; forceApproval?: boolean; actorId?: string } = {}
): Promise<GenerationResult> {
  const { isDryRun = false, forceApproval = false, actorId = 'SYSTEM_SCHEDULER' } = options;
  // Use privileged service client to read and transition occurrence
  const db = getPublicDatabase();

  // 1. Fetch occurrence with parent subscription
  const { data: occurrence, error: occError } = await db
    .from('grocery_subscription_occurrences')
    .select('*')
    .eq('id', occurrenceId)
    .single();

  if (occError || !occurrence) {
    return {
      success: false,
      occurrenceId,
      status: 'FAILED',
      errorCode: 'OCCURRENCE_NOT_FOUND',
      message: 'No se encontró la entrega programada especificada.',
    };
  }

  // Idempotency: if already confirmed with an order, return success immediately
  if (occurrence.status === 'CONFIRMED' && occurrence.order_id) {
    return {
      success: true,
      occurrenceId,
      orderId: occurrence.order_id,
      status: 'CONFIRMED',
      totalAmount: occurrence.estimated_total,
      message: 'El pedido ya fue generado previamente.',
    };
  }

  // If already canceled or skipped
  if (occurrence.status === 'SKIPPED' || occurrence.status === 'CANCELED') {
    return {
      success: false,
      occurrenceId,
      status: occurrence.status,
      message: `La entrega se encuentra en estado ${occurrence.status}.`,
    };
  }

  // 2. Fetch parent subscription
  const { data: subscription, error: subError } = await db
    .from('grocery_subscriptions')
    .select('*')
    .eq('id', occurrence.subscription_id)
    .single();

  if (subError || !subscription) {
    return {
      success: false,
      occurrenceId,
      status: 'FAILED',
      errorCode: 'SUBSCRIPTION_NOT_FOUND',
      message: 'No se encontró la suscripción asociada.',
    };
  }

  if (subscription.status !== 'ACTIVE') {
    return {
      success: false,
      occurrenceId,
      status: 'FAILED',
      errorCode: 'SUBSCRIPTION_INACTIVE',
      message: `La suscripción está ${subscription.status}. No se generó pedido.`,
    };
  }

  // 3. Fetch subscription items
  const { data: items, error: itemsError } = await db
    .from('grocery_subscription_items')
    .select('*')
    .eq('subscription_id', subscription.id);

  if (itemsError || !items || items.length === 0) {
    return {
      success: false,
      occurrenceId,
      status: 'FAILED',
      errorCode: 'EMPTY_BASKET',
      message: 'La canasta de la suscripción no contiene productos.',
    };
  }

  // Concurrency Lock: Mark occurrence as GENERATING unless dry run
  if (!isDryRun) {
    await db
      .from('grocery_subscription_occurrences')
      .update({
        status: 'GENERATING',
        generation_attempts: (occurrence.generation_attempts || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', occurrenceId);
  }

  try {
    // 4. Resolve live catalog products
    const lineIds = items.map((i) => i.product_id);
    const { data: productsData } = await db
      .from('products')
      .select('id,name,is_active,price_retail,price_micro,price_restaurant,stock_quantity')
      .in('id', lineIds);

    const catalogProducts: CheckoutProduct[] = [...((productsData as CheckoutProduct[]) || [])];

    // Check kits if any line is missing
    const foundIds = new Set(catalogProducts.map((p) => p.id));
    const missingIds = lineIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      const { data: kitsData } = await db
        .from('kits')
        .select('id,name,fixed_price,status')
        .in('id', missingIds);

      if (Array.isArray(kitsData)) {
        for (const kit of kitsData) {
          const fixedPrice = Math.round(Number(kit.fixed_price) || 0);
          catalogProducts.push({
            id: kit.id,
            name: kit.name,
            is_active: kit.status === 'active',
            stock_quantity: 999,
            price_retail: fixedPrice,
            price_micro: fixedPrice,
            price_restaurant: fixedPrice,
          });
        }
      }
    }

    // Check seasonal / Christmas items
    const stillFoundIds = new Set(catalogProducts.map((p) => p.id));
    const stillMissing = lineIds.filter((id) => !stillFoundIds.has(id));
    if (stillMissing.length > 0) {
      for (const id of stillMissing) {
        const navItem = CHRISTMAS_CUSHIONS.find((c) => c.id === id);
        if (navItem) {
          catalogProducts.push({
            id: navItem.id,
            name: navItem.name,
            is_active: navItem.isActive,
            stock_quantity: navItem.stockQuantity,
            price_retail: navItem.price,
            price_micro: navItem.price,
            price_restaurant: navItem.price,
          });
        }
      }
    }

    // 5. Quote order using canonical checkoutValidation
    const lines = items.map((i) => ({ productId: i.product_id, quantity: i.quantity }));
    const { track_inventory } = await readPublicInventoryFlag();
    const effectiveTier = 'Personas Naturales';

    // Calculate promotions
    const rawSubtotal = lines.reduce((acc, line) => {
      const prod = catalogProducts.find((p) => p.id === line.productId);
      return acc + (prod ? prod.price_retail * line.quantity : 0);
    }, 0);

    const activePromo = await getActivePromotion();
    const discountCalc = calculateDiscount(rawSubtotal, effectiveTier, activePromo);

    const quote = quoteCheckout(
      lines,
      catalogProducts,
      effectiveTier,
      subscription.delivery_municipality || 'Bucaramanga',
      track_inventory,
      discountCalc.discountAmount,
      discountCalc.discountLabel
    );

    // 6. Check confirmation policy & spending cap
    const isManualPolicy = subscription.confirmation_policy === 'MANUAL';
    const hasSpendingCap = typeof subscription.maximum_authorized_total === 'number' && subscription.maximum_authorized_total > 0;
    const exceedsCap = hasSpendingCap && quote.totalAmount > (subscription.maximum_authorized_total as number);

    if (!forceApproval && (isManualPolicy || exceedsCap)) {
      const pendingReason = exceedsCap
        ? `Total cotizado ($${quote.totalAmount.toLocaleString('es-CO')}) excede el tope autorizado ($${subscription.maximum_authorized_total?.toLocaleString('es-CO')}).`
        : 'Suscripción configurada con confirmación manual previa.';

      if (!isDryRun) {
        await db
          .from('grocery_subscription_occurrences')
          .update({
            status: 'PENDING_APPROVAL',
            estimated_subtotal: quote.subtotal,
            estimated_delivery_cost: quote.deliveryCost,
            estimated_total: quote.totalAmount,
            last_error_code: exceedsCap ? 'PRICE_CAP_EXCEEDED' : 'MANUAL_APPROVAL_REQUIRED',
            last_error_message: pendingReason,
            updated_at: new Date().toISOString(),
          })
          .eq('id', occurrenceId);

        await db.from('grocery_subscription_events').insert({
          subscription_id: subscription.id,
          occurrence_id: occurrenceId,
          actor_id: actorId,
          actor_type: actorId === 'ADMIN' ? 'ADMIN' : 'SYSTEM_SCHEDULER',
          event_type: 'APPROVAL_REQUESTED',
          details: pendingReason,
          metadata: { quotedTotal: quote.totalAmount, authorizedCap: subscription.maximum_authorized_total },
        });
      }

      return {
        success: false,
        occurrenceId,
        status: 'PENDING_APPROVAL',
        totalAmount: quote.totalAmount,
        errorCode: exceedsCap ? 'PRICE_CAP_EXCEEDED' : 'MANUAL_APPROVAL_REQUIRED',
        message: pendingReason,
      };
    }

    if (isDryRun) {
      return {
        success: true,
        occurrenceId,
        status: 'CONFIRMED',
        totalAmount: quote.totalAmount,
        message: 'Cotización exitosa en modo simulación.',
      };
    }

    // 7. Canonical Order Creation via createOrder
    const discountNote = quote.discountAmount > 0
      ? `[DESCUENTO: -$${quote.discountAmount.toLocaleString('es-CO')} (${quote.discountLabel})]`
      : '';
    const subscriptionNote = `[MERCADO PROGRAMADO · ${subscription.frequency}] ${subscription.delivery_instructions || ''}`.trim();
    const finalNotes = discountNote ? `${discountNote} ${subscriptionNote}` : subscriptionNote;

    const orderResult = await createOrder(
      {
        clerk_user_id: subscription.clerk_user_id,
        customer_name: subscription.delivery_name,
        customer_email: subscription.delivery_email || 'suscripciones@lagaviotafruver.com',
        customer_phone: subscription.delivery_phone,
        delivery_address: subscription.delivery_address,
        delivery_municipality: subscription.delivery_municipality,
        total_amount: quote.totalAmount,
        discount_amount: quote.discountAmount || 0,
        status: 'Pendiente',
        payment_method: 'cash',
        idempotency_key: occurrence.idempotency_key,
        notes: finalNotes,
        scheduled_delivery_date: occurrence.scheduled_delivery_date,
      },
      quote.orderItems,
      false
    );

    const generatedOrderId = orderResult.orderId;

    // 8. Update occurrence with order_id and CONFIRMED status
    await db
      .from('grocery_subscription_occurrences')
      .update({
        status: 'CONFIRMED',
        order_id: generatedOrderId,
        estimated_subtotal: quote.subtotal,
        estimated_delivery_cost: quote.deliveryCost,
        estimated_total: quote.totalAmount,
        last_error_code: null,
        last_error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', occurrenceId);

    // Link order back to occurrence
    await db
      .from('orders')
      .update({ subscription_occurrence_id: occurrenceId })
      .eq('id', generatedOrderId);

    // 9. Schedule the NEXT delivery occurrence
    const nextDeliveryIso = calculateNextDeliveryDate({
      frequency: subscription.frequency as 'WEEKLY' | 'EVERY_15_DAYS' | 'MONTHLY',
      anchorDate: subscription.anchor_date,
      fromDate: occurrence.scheduled_delivery_date,
    });

    const nextOccurrenceId = randomUUID();
    const nextIdempotencyKey = `sub-occ-${subscription.id}-${nextDeliveryIso}`;

    await db.from('grocery_subscription_occurrences').insert({
      id: nextOccurrenceId,
      subscription_id: subscription.id,
      scheduled_delivery_date: nextDeliveryIso,
      delivery_window: subscription.preferred_delivery_window,
      status: 'SCHEDULED',
      source_subscription_version: subscription.version,
      estimated_subtotal: quote.subtotal,
      estimated_delivery_cost: quote.deliveryCost,
      estimated_total: quote.totalAmount,
      idempotency_key: nextIdempotencyKey,
    });

    await db
      .from('grocery_subscriptions')
      .update({
        next_occurrence_date: nextDeliveryIso,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // 10. Audit log events
    await db.from('grocery_subscription_events').insert([
      {
        subscription_id: subscription.id,
        occurrence_id: occurrenceId,
        actor_id: actorId,
        actor_type: actorId === 'ADMIN' ? 'ADMIN' : 'SYSTEM_SCHEDULER',
        event_type: 'ORDER_GENERATED',
        details: `Pedido #${generatedOrderId} generado exitosamente por $${quote.totalAmount.toLocaleString('es-CO')}.`,
        metadata: { orderId: generatedOrderId, totalAmount: quote.totalAmount },
      },
      {
        subscription_id: subscription.id,
        occurrence_id: nextOccurrenceId,
        actor_id: actorId,
        actor_type: actorId === 'ADMIN' ? 'ADMIN' : 'SYSTEM_SCHEDULER',
        event_type: 'OCCURRENCE_SCHEDULED',
        details: `Siguiente entrega programada para el ${nextDeliveryIso}.`,
        metadata: { nextDeliveryIso },
      },
    ]);

    // 11. WhatsApp / order notification
    triggerOrderNotification(
      generatedOrderId,
      subscription.delivery_phone,
      subscription.delivery_name,
      quote.totalAmount
    ).catch((err) => {
      console.warn('[Subscriptions] Order notification trigger warning:', err);
    });

    return {
      success: true,
      occurrenceId,
      orderId: generatedOrderId,
      status: 'CONFIRMED',
      totalAmount: quote.totalAmount,
      message: 'Pedido generado exitosamente.',
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Subscriptions] Error generating order for occurrence ${occurrenceId}:`, err);

    if (!isDryRun) {
      await db
        .from('grocery_subscription_occurrences')
        .update({
          status: 'FAILED',
          last_error_code: 'GENERATION_EXCEPTION',
          last_error_message: errorMsg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', occurrenceId);

      await db.from('grocery_subscription_events').insert({
        subscription_id: subscription.id,
        occurrence_id: occurrenceId,
        actor_id: actorId,
        actor_type: actorId === 'ADMIN' ? 'ADMIN' : 'SYSTEM_SCHEDULER',
        event_type: 'GENERATION_FAILED',
        details: errorMsg,
      });
    }

    return {
      success: false,
      occurrenceId,
      status: 'FAILED',
      errorCode: 'GENERATION_EXCEPTION',
      message: errorMsg,
    };
  }
}

