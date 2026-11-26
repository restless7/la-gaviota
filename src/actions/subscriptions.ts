'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { getActor, requireOwnedSubject, requireCapability } from '@/src/lib/server/authorization';
import { getServerDatabase, getGuestCheckoutDatabase } from '@/src/lib/server/database';
import { calculateNextDeliveryDate, formatBogotaDateIso, SubscriptionFrequency } from '@/src/lib/subscriptions/recurrence';
import { generateOrderForOccurrence } from '@/src/lib/subscriptions/generator';

export interface CreateSubscriptionItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  price?: number;
  substitutionPreference?: 'CALL_CUSTOMER' | 'SIMILAR' | 'SKIP_ITEM';
}

export interface CreateSubscriptionPayload {
  name?: string;
  frequency: SubscriptionFrequency;
  firstDeliveryDate: string; // YYYY-MM-DD
  preferredDeliveryWindow?: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryEmail?: string;
  deliveryAddress: string;
  deliveryMunicipality: string;
  deliveryInstructions?: string;
  confirmationPolicy?: 'AUTO' | 'MANUAL';
  maximumAuthorizedTotal?: number | null;
  items: CreateSubscriptionItemInput[];
}

export interface SubscriptionRecord {
  id: string;
  clerk_user_id: string;
  name: string;
  frequency: SubscriptionFrequency;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELED';
  anchor_date: string;
  preferred_delivery_window: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_email: string | null;
  delivery_address: string;
  delivery_municipality: string;
  delivery_instructions: string | null;
  payment_method: string;
  confirmation_policy: 'AUTO' | 'MANUAL';
  maximum_authorized_total: number | null;
  next_occurrence_date: string;
  version: number;
  paused_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
  items?: SubscriptionItemRecord[];
  occurrences?: SubscriptionOccurrenceRecord[];
}

export interface SubscriptionItemRecord {
  id: string;
  subscription_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  substitution_preference: string;
}

export interface SubscriptionOccurrenceRecord {
  id: string;
  subscription_id: string;
  scheduled_delivery_date: string;
  delivery_window: string;
  status: 'SCHEDULED' | 'PENDING_APPROVAL' | 'GENERATING' | 'CONFIRMED' | 'SKIPPED' | 'FAILED' | 'CANCELED';
  estimated_subtotal: number;
  estimated_delivery_cost: number;
  estimated_total: number;
  order_id: string | null;
  idempotency_key: string;
  generation_attempts: number;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string;
}

/**
 * Creates a new recurring grocery subscription atomically.
 */
export async function createGrocerySubscription(payload: CreateSubscriptionPayload) {
  const actor = await getActor();
  const userId = actor.userId || 'guest-sub';

  if (!payload.items || payload.items.length === 0) {
    throw new Error('La canasta de suscripción debe contener al menos un producto.');
  }

  const db = actor.userId ? getServerDatabase(actor) : getGuestCheckoutDatabase();

  const subscriptionId = randomUUID();
  const firstOccurrenceId = randomUUID();
  const now = new Date().toISOString();
  const anchorDateIso = payload.firstDeliveryDate;
  const initialWindow = payload.preferredDeliveryWindow || '08:00 - 12:00';

  // Calculate estimated subtotal
  const estimatedSubtotal = payload.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const estimatedDelivery = payload.deliveryMunicipality.toLowerCase().includes('florida') ? 7000 : 5000;
  const estimatedTotal = estimatedSubtotal + estimatedDelivery;

  // 1. Insert subscription
  const { error: subErr } = await db.from('grocery_subscriptions').insert({
    id: subscriptionId,
    clerk_user_id: userId,
    name: payload.name || `Mi Mercado ${payload.frequency === 'WEEKLY' ? 'Semanal' : payload.frequency === 'EVERY_15_DAYS' ? 'Quincenal' : 'Mensual'}`,
    frequency: payload.frequency,
    status: 'ACTIVE',
    timezone: 'America/Bogota',
    anchor_date: anchorDateIso,
    preferred_delivery_window: initialWindow,
    delivery_name: payload.deliveryName,
    delivery_phone: payload.deliveryPhone,
    delivery_email: payload.deliveryEmail || null,
    delivery_address: payload.deliveryAddress,
    delivery_municipality: payload.deliveryMunicipality || 'Bucaramanga',
    delivery_instructions: payload.deliveryInstructions || null,
    payment_method: 'cash',
    confirmation_policy: payload.confirmationPolicy || 'AUTO',
    maximum_authorized_total: payload.maximumAuthorizedTotal || null,
    next_occurrence_date: anchorDateIso,
    version: 1,
    created_at: now,
    updated_at: now,
  });

  if (subErr) {
    console.error('Failed to create subscription:', subErr);
    throw new Error('No se pudo guardar la suscripción. Intenta nuevamente.');
  }

  // 2. Insert items
  const itemsToInsert = payload.items.map((item) => ({
    id: randomUUID(),
    subscription_id: subscriptionId,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit: item.unit || 'unidad',
    substitution_preference: item.substitutionPreference || 'CALL_CUSTOMER',
  }));

  const { error: itemsErr } = await db.from('grocery_subscription_items').insert(itemsToInsert);
  if (itemsErr) {
    console.error('Failed to insert subscription items:', itemsErr);
    throw new Error('Error al guardar los productos de la suscripción.');
  }

  // 3. Insert first occurrence
  const idempotencyKey = `sub-occ-${subscriptionId}-${anchorDateIso}`;
  const { error: occErr } = await db.from('grocery_subscription_occurrences').insert({
    id: firstOccurrenceId,
    subscription_id: subscriptionId,
    scheduled_delivery_date: anchorDateIso,
    delivery_window: initialWindow,
    status: 'SCHEDULED',
    source_subscription_version: 1,
    estimated_subtotal: estimatedSubtotal,
    estimated_delivery_cost: estimatedDelivery,
    estimated_total: estimatedTotal,
    idempotency_key: idempotencyKey,
  });

  if (occErr) {
    console.error('Failed to schedule first occurrence:', occErr);
  }

  // 4. Log creation audit event
  await db.from('grocery_subscription_events').insert({
    subscription_id: subscriptionId,
    occurrence_id: firstOccurrenceId,
    actor_id: userId,
    actor_type: 'CUSTOMER',
    event_type: 'CREATED',
    details: `Suscripción creada con frecuencia ${payload.frequency}. Primera entrega: ${anchorDateIso}.`,
    metadata: { itemCount: payload.items.length, frequency: payload.frequency },
  });

  revalidatePath('/mi-cuenta/mercados-programados');
  revalidatePath('/admin/mercados-programados');

  return {
    success: true,
    subscriptionId,
    nextDeliveryDate: anchorDateIso,
  };
}

/**
 * Lists all recurring subscriptions for the currently authenticated customer.
 */
export async function getCustomerSubscriptions(): Promise<SubscriptionRecord[]> {
  const actor = await getActor();
  if (!actor.userId) return [];

  const db = actor.userId ? getServerDatabase(actor) : getGuestCheckoutDatabase();

  const { data: subs, error } = await db
    .from('grocery_subscriptions')
    .select(`
      *,
      items:grocery_subscription_items(*),
      occurrences:grocery_subscription_occurrences(
        id, scheduled_delivery_date, delivery_window, status, estimated_total, order_id, last_error_message
      )
    `)
    .eq('clerk_user_id', actor.userId)
    .order('created_at', { ascending: false });

  if (error || !subs) return [];
  return subs as SubscriptionRecord[];
}

/**
 * Pauses future deliveries for a subscription.
 */
export async function pauseCustomerSubscription(subscriptionId: string) {
  const actor = await getActor();
  const db = actor.userId ? getServerDatabase(actor) : getGuestCheckoutDatabase();

  const { data: sub } = await db.from('grocery_subscriptions').select('*').eq('id', subscriptionId).single();
  if (!sub) throw new Error('Suscripción no encontrada.');
  if (actor.userId && sub.clerk_user_id !== actor.userId && actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('No autorizado.');
  }

  await db
    .from('grocery_subscriptions')
    .update({
      status: 'PAUSED',
      paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  await db.from('grocery_subscription_events').insert({
    subscription_id: subscriptionId,
    actor_id: actor.userId || 'system',
    actor_type: actor.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
    event_type: 'PAUSED',
    details: 'Entregas recurrentes pausadas por el usuario.',
  });

  revalidatePath('/mi-cuenta/mercados-programados');
  revalidatePath('/admin/mercados-programados');
  return { success: true };
}

/**
 * Resumes a paused subscription and recomputes the next delivery date if needed.
 */
export async function resumeCustomerSubscription(subscriptionId: string) {
  const actor = await getActor();
  const db = actor.userId ? getServerDatabase(actor) : getGuestCheckoutDatabase();

  const { data: sub } = await db.from('grocery_subscriptions').select('*').eq('id', subscriptionId).single();
  if (!sub) throw new Error('Suscripción no encontrada.');
  if (actor.userId && sub.clerk_user_id !== actor.userId && actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('No autorizado.');
  }

  // Recalculate next valid delivery date from today
  const nextDate = calculateNextDeliveryDate({
    frequency: sub.frequency as SubscriptionFrequency,
    anchorDate: sub.anchor_date,
    fromDate: formatBogotaDateIso(new Date()),
  });

  await db
    .from('grocery_subscriptions')
    .update({
      status: 'ACTIVE',
      next_occurrence_date: nextDate,
      paused_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  // Ensure an active occurrence exists for nextDate
  const nextOccurrenceId = randomUUID();
  const idempotencyKey = `sub-occ-${subscriptionId}-${nextDate}`;

  await db.from('grocery_subscription_occurrences').upsert({
    id: nextOccurrenceId,
    subscription_id: subscriptionId,
    scheduled_delivery_date: nextDate,
    delivery_window: sub.preferred_delivery_window,
    status: 'SCHEDULED',
    idempotency_key: idempotencyKey,
  }, { onConflict: 'idempotency_key' });

  await db.from('grocery_subscription_events').insert({
    subscription_id: subscriptionId,
    actor_id: actor.userId || 'system',
    actor_type: actor.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
    event_type: 'RESUMED',
    details: `Suscripción reanudada. Próxima entrega: ${nextDate}.`,
  });

  revalidatePath('/mi-cuenta/mercados-programados');
  revalidatePath('/admin/mercados-programados');
  return { success: true, nextDate };
}

/**
 * Skips the next upcoming scheduled delivery and advances to the subsequent cycle.
 */
export async function skipNextSubscriptionDelivery(subscriptionId: string) {
  const actor = await getActor();
  const db = actor.userId ? getServerDatabase(actor) : getGuestCheckoutDatabase();

  const { data: sub } = await db.from('grocery_subscriptions').select('*').eq('id', subscriptionId).single();
  if (!sub) throw new Error('Suscripción no encontrada.');
  if (actor.userId && sub.clerk_user_id !== actor.userId && actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('No autorizado.');
  }

  // Find upcoming scheduled occurrence
  const { data: occ } = await db
    .from('grocery_subscription_occurrences')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .in('status', ['SCHEDULED', 'PENDING_APPROVAL'])
    .order('scheduled_delivery_date', { ascending: true })
    .limit(1)
    .single();

  if (occ) {
    await db
      .from('grocery_subscription_occurrences')
      .update({ status: 'SKIPPED', updated_at: new Date().toISOString() })
      .eq('id', occ.id);
  }

  // Calculate subsequent date
  const subsequentDate = calculateNextDeliveryDate({
    frequency: sub.frequency as SubscriptionFrequency,
    anchorDate: sub.anchor_date,
    fromDate: occ ? occ.scheduled_delivery_date : sub.next_occurrence_date,
  });

  await db
    .from('grocery_subscriptions')
    .update({
      next_occurrence_date: subsequentDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  // Schedule the new occurrence
  const newOccId = randomUUID();
  const idempotencyKey = `sub-occ-${subscriptionId}-${subsequentDate}`;
  await db.from('grocery_subscription_occurrences').insert({
    id: newOccId,
    subscription_id: subscriptionId,
    scheduled_delivery_date: subsequentDate,
    delivery_window: sub.preferred_delivery_window,
    status: 'SCHEDULED',
    idempotency_key: idempotencyKey,
  });

  await db.from('grocery_subscription_events').insert({
    subscription_id: subscriptionId,
    actor_id: actor.userId || 'system',
    actor_type: actor.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
    event_type: 'SKIPPED',
    details: `Entrega del ${occ?.scheduled_delivery_date || sub.next_occurrence_date} saltada. Próxima entrega programada: ${subsequentDate}.`,
  });

  revalidatePath('/mi-cuenta/mercados-programados');
  revalidatePath('/admin/mercados-programados');
  return { success: true, nextDate: subsequentDate };
}

/**
 * Cancels a subscription and stops all future delivery occurrences.
 */
export async function cancelCustomerSubscription(subscriptionId: string, reason?: string) {
  const actor = await getActor();
  const db = actor.userId ? getServerDatabase(actor) : getGuestCheckoutDatabase();

  const { data: sub } = await db.from('grocery_subscriptions').select('*').eq('id', subscriptionId).single();
  if (!sub) throw new Error('Suscripción no encontrada.');
  if (actor.userId && sub.clerk_user_id !== actor.userId && actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new Error('No autorizado.');
  }

  await db
    .from('grocery_subscriptions')
    .update({
      status: 'CANCELED',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);

  // Cancel unconfirmed upcoming occurrences
  await db
    .from('grocery_subscription_occurrences')
    .update({ status: 'CANCELED', updated_at: new Date().toISOString() })
    .eq('subscription_id', subscriptionId)
    .in('status', ['SCHEDULED', 'PENDING_APPROVAL']);

  await db.from('grocery_subscription_events').insert({
    subscription_id: subscriptionId,
    actor_id: actor.userId || 'system',
    actor_type: actor.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
    event_type: 'CANCELED',
    details: reason || 'Suscripción cancelada por el usuario.',
  });

  revalidatePath('/mi-cuenta/mercados-programados');
  revalidatePath('/admin/mercados-programados');
  return { success: true };
}

/**
 * Manually approves a pending occurrence (either due to MANUAL policy or price cap exceeded).
 */
export async function approveSubscriptionOccurrence(occurrenceId: string) {
  const actor = await getActor();
  const result = await generateOrderForOccurrence(occurrenceId, {
    forceApproval: true,
    actorId: actor.userId || 'CUSTOMER',
  });

  revalidatePath('/mi-cuenta/mercados-programados');
  revalidatePath('/admin/mercados-programados');
  return result;
}

/**
 * Admin action: Lists all subscriptions with filters for status and frequency.
 */
export async function getAdminSubscriptionsList(filters?: { status?: string; frequency?: string }) {
  const actor = await requireCapability('orders.manage');
  const db = getServerDatabase(actor);

  let query = db
    .from('grocery_subscriptions')
    .select(`
      *,
      items:grocery_subscription_items(*),
      occurrences:grocery_subscription_occurrences(
        id, scheduled_delivery_date, delivery_window, status, estimated_total, order_id, last_error_code, last_error_message
      )
    `)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status);
  }
  if (filters?.frequency && filters.frequency !== 'ALL') {
    query = query.eq('frequency', filters.frequency);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as SubscriptionRecord[];
}

/**
 * Admin action: Retries an occurrence that failed during automatic order generation.
 */
export async function retryFailedSubscriptionOccurrence(occurrenceId: string) {
  await requireCapability('orders.manage');
  const result = await generateOrderForOccurrence(occurrenceId, {
    forceApproval: true,
    actorId: 'ADMIN',
  });

  revalidatePath('/admin/mercados-programados');
  return result;
}

/**
 * Admin action: Generates orders for all occurrences due for delivery today or tomorrow.
 * Solves the Vercel Free plan limitation by allowing 1-click execution directly
 * from the Admin Operations panel without needing a paid Vercel Pro Cron.
 */
export async function processDueSubscriptionsAction(targetDateIso?: string) {
  const actor = await requireCapability('orders.manage');
  const db = getServerDatabase(actor);

  const nowBogota = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const cutoffDate = targetDateIso || (() => {
    const tomorrow = new Date(nowBogota.getTime());
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatBogotaDateIso(tomorrow);
  })();

  const { data: occurrences, error } = await db
    .from('grocery_subscription_occurrences')
    .select('id, scheduled_delivery_date, status')
    .in('status', ['SCHEDULED'])
    .lte('scheduled_delivery_date', cutoffDate)
    .order('scheduled_delivery_date', { ascending: true })
    .limit(50);

  if (error || !occurrences || occurrences.length === 0) {
    return {
      success: true,
      processedCount: 0,
      confirmedCount: 0,
      pendingApprovalCount: 0,
      failedCount: 0,
      message: 'No hay entregas pendientes por despachar para la fecha seleccionada.',
    };
  }

  let confirmed = 0;
  let pendingApproval = 0;
  let failed = 0;

  for (const occ of occurrences) {
    try {
      const res = await generateOrderForOccurrence(occ.id, { actorId: 'ADMIN' });
      if (res.status === 'CONFIRMED') confirmed++;
      else if (res.status === 'PENDING_APPROVAL') pendingApproval++;
      else failed++;
    } catch {
      failed++;
    }
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin/mercados-programados');
  return {
    success: true,
    processedCount: occurrences.length,
    confirmedCount: confirmed,
    pendingApprovalCount: pendingApproval,
    failedCount: failed,
    message: `Procesamiento completado: ${confirmed} pedidos creados, ${pendingApproval} pendientes de aprobación, ${failed} con novedades.`,
  };
}

