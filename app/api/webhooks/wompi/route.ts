import { NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/src/lib/wompi';
import { createClient } from '@supabase/supabase-js';
import { triggerOrderNotification } from '@/src/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // 1. Zero-Trust Security: Validate the signature
    const isValid = validateWebhookSignature(
      payload.signature,
      payload.data.transaction,
      payload.timestamp.toString()
    );

    if (!isValid) {
      console.error('[Wompi Webhook] Invalid signature detected. Possible tampering attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Extract transaction data
    const transaction = payload.data.transaction;
    const reference = transaction.reference; // This matches our Supabase order UUID or BAL_ prefix
    const wompiStatus = transaction.status; // APPROVED, DECLINED, VOIDED, ERROR

    // 3. Conditional routing: Balance Payments vs Standard Orders
    if (reference.startsWith('BAL_')) {
      if (wompiStatus === 'APPROVED') {
         // Logic for handling successful balance payment
         // The reference is something like BAL_{userId}_{timestamp}
         const [, clerkUserId] = reference.split('_');
         const amountPaid = transaction.amount_in_cents / 100;
         console.log(`[Wompi Webhook] Balance payment of $${amountPaid} approved for user starting with ${clerkUserId}`);
         
         // Fetch the user's credit profile
         const { data: profile } = await supabase
           .from('b2b_credit_profiles')
           .select('credit_balance, user_id')
           .ilike('user_id', `${clerkUserId}%`)
           .single();
           
         if (profile) {
            const newBalance = Math.max(0, profile.credit_balance - amountPaid);
            await supabase
              .from('b2b_credit_profiles')
              .update({ credit_balance: newBalance, updated_at: new Date().toISOString() })
              .eq('user_id', profile.user_id);
            console.log(`[Wompi Webhook] Abono registrado exitosamente para referencia ${reference}. Nuevo saldo: ${newBalance}`);
         } else {
            console.error(`[Wompi Webhook] No se encontró un perfil de crédito para el pago de saldo ${reference}`);
         }
      }
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const orderId = reference;

    // Fetch the current order state
    const { data: orderData } = await supabase
      .from('orders')
      .select('notes, customer_phone, customer_name, total_amount, clerk_user_id, status')
      .eq('id', orderId)
      .single();

    if (!orderData) {
      console.error(`[Wompi Webhook] Order ${orderId} not found in DB.`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Parche B: Idempotencia Inmutable
    if (['Pendiente', 'En Preparación', 'En Ruta', 'Entregado', 'ARCHIVED_DELIVERED'].includes(orderData.status)) {
      console.log(`[Idempotencia] Orden ${orderId} ya procesada con estado ${orderData.status}. Abortando duplicado.`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Parche A: Validación de Montos
    let mappedWompiStatus = wompiStatus;
    const amountPaid = transaction.amount_in_cents / 100;
    if (mappedWompiStatus === 'APPROVED' && orderData.total_amount !== amountPaid) {
      console.error(`[ALERTA FRAUDE] Monto pagado (${amountPaid}) no coincide con total del pedido (${orderData.total_amount}).`);
      mappedWompiStatus = 'ERROR'; // Force rejection
    }

    // 4. Map Wompi status to our DB status

    let dbStatus: string;
    
    switch (mappedWompiStatus) {
      case 'APPROVED':
        dbStatus = 'Pendiente'; 
        break;
      case 'DECLINED':
      case 'FAILED':
      case 'VOIDED':
      case 'ERROR':
        dbStatus = 'Cancelado';
        break;
      default:
        dbStatus = 'Pendiente';
        break;
    }

    const noteAppend = `\n[Wompi TX: ${transaction.id} - ${mappedWompiStatus}]`;

    // We already fetched orderData above, so we just use it.
    const currentNotes = orderData.notes || '';

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: dbStatus,
        notes: currentNotes + noteAppend,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error(`[Wompi Webhook] Failed to update order ${orderId}:`, updateError);
      // We still return 200 so Wompi doesn't retry unnecessarily if it's our DB issue,
      // but usually 500 would trigger a retry. Wompi prefers fast 200s.
    } else {
      console.log(`[Wompi Webhook] Order ${orderId} updated to ${dbStatus}.`);
      
      // 6. Trigger notifications and inventory updates if approved
      if (mappedWompiStatus === 'APPROVED') {
        // Run notification asynchronously so we don't block the HTTP response
        triggerOrderNotification(
          orderId,
          orderData.customer_phone,
          orderData.customer_name,
          orderData.total_amount
        ).catch(console.error);

        // Deduct inventory if feature flag is active
        const { getInventorySettings } = await import('@/src/actions/settings');
        const { track_inventory } = await getInventorySettings();

        if (track_inventory) {
          const { data: items } = await supabase
            .from('order_items')
            .select('product_id, quantity')
            .eq('order_id', orderId);

          if (items) {
            // Run deduction asynchronously
            Promise.all(items.map(async (item) => {
              // In production we should use an RPC or a safer decrement to avoid race conditions
              const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single();
              if (prod) {
                await supabase.from('products').update({ stock_quantity: Math.max(0, prod.stock_quantity - item.quantity) }).eq('id', item.product_id);
              }
            })).catch(console.error);
          }
        }

        // Mark Abandoned Cart as Recovered
        supabase
          .from('abandoned_carts')
          .update({ status: 'recovered', updated_at: new Date().toISOString() })
          .eq('clerk_user_id', orderData.clerk_user_id)
          .in('status', ['active', 'abandoned'])
          .then(({ error: cartError }) => {
            if (cartError) console.error('[Wompi Webhook] Failed to mark cart as recovered', cartError);
            else console.log(`[Wompi Webhook] Cart for ${orderData.clerk_user_id} marked as recovered.`);
          });

        // Update Customer Loyalty Metrics (Phase 2 Prep)
        if (orderData.clerk_user_id) {
          // Fetch current customer to increment totals
          supabase.from('customers').select('total_spent, total_orders, email').eq('clerk_user_id', orderData.clerk_user_id).single()
            .then(({ data: cust }) => {
               if (cust) {
                 supabase.from('customers').update({
                   total_spent: cust.total_spent + orderData.total_amount,
                   total_orders: cust.total_orders + 1,
                   last_order_at: new Date().toISOString(),
                   updated_at: new Date().toISOString()
                 }).eq('clerk_user_id', orderData.clerk_user_id).then(({ error: updError }) => {
                   if (updError) console.error(updError);
                 });
                 
                 // Phase 4: Meta CAPI Fire Purchase Event
                 import('@/src/lib/metaCapi').then(({ sendPurchaseEventToMeta }) => {
                   sendPurchaseEventToMeta({
                     orderId: orderId,
                     totalAmount: orderData.total_amount,
                     currency: 'COP',
                     customerEmail: cust.email,
                     customerPhone: orderData.customer_phone
                   });
                 });
               }
            });
        }
      }
    }

    // Wompi requires a fast 200 OK
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('[Wompi Webhook] Critical error processing webhook:', error);
    // Return 200 even on structural error to stop Wompi from retrying malformed payloads,
    // or 400 if it's a bad request. Wompi standard suggests 200 OK to stop the loop.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 200 });
  }
}
