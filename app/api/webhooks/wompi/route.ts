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
    const orderId = transaction.reference; // This matches our Supabase order UUID
    const wompiStatus = transaction.status; // APPROVED, DECLINED, VOIDED, ERROR

    // 3. Map Wompi status to our DB status
    let dbStatus: 'Pendiente' | 'En Preparación' | 'Cancelado' | 'Rechazado';
    
    switch (wompiStatus) {
      case 'APPROVED':
        dbStatus = 'En Preparación'; // Assuming payment cleared, move to preparation
        break;
      case 'DECLINED':
      case 'FAILED':
      case 'VOIDED':
      case 'ERROR':
        dbStatus = 'Cancelado'; // or 'Rechazado' if schema allowed, schema allows 'Cancelado'
        break;
      default:
        // Other intermediate statuses (PENDING) we leave as 'Pendiente'
        dbStatus = 'Pendiente';
        break;
    }

    // Append the Wompi transaction ID to the notes for traceability
    const noteAppend = `\n[Wompi TX: ${transaction.id} - ${wompiStatus}]`;

    // 4. Update the Database non-blockingly (but we wait for the update to ensure consistency)
    // We fetch current notes and customer info to append and notify
    const { data: orderData } = await supabase
      .from('orders')
      .select('notes, customer_phone, customer_name, total_amount')
      .eq('id', orderId)
      .single();

    const currentNotes = orderData?.notes || '';

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
      
      // 5. Trigger notifications if approved
      if (wompiStatus === 'APPROVED' && orderData) {
        // Run notification asynchronously so we don't block the HTTP response
        triggerOrderNotification(
          orderId,
          orderData.customer_phone,
          orderData.customer_name,
          orderData.total_amount
        ).catch(console.error);
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
