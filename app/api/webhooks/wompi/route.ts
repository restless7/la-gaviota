import { NextResponse } from 'next/server';
import { validateWebhookSignature, orderStatusForWompi } from '@/src/lib/wompi';
import { createClient } from '@supabase/supabase-js';
import { triggerOrderNotification } from '@/src/lib/notifications';

function getWebhookDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('WEBHOOK_DATABASE_UNCONFIGURED');
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload || payload.event !== 'transaction.updated' || !payload.data?.transaction || payload.timestamp == null) {
      return NextResponse.json({ error: 'Malformed event' }, { status: 400 });
    }

    // 1. Verify only the properties actually covered by the provider checksum
    const isValid = validateWebhookSignature(
      payload.signature,
      payload.data.transaction,
      payload.timestamp.toString()
    );

    if (!isValid) {
      console.error('[Wompi Webhook] Invalid signature detected. Possible tampering attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Extract and validate transaction data
    const transaction = payload.data.transaction;
    const reference = transaction.reference; // Supabase order UUID or BAL_ prefix
    const wompiStatus = transaction.status; // APPROVED, DECLINED, VOIDED, ERROR

    if (
      typeof reference !== 'string' ||
      reference.length > 160 ||
      !/^[A-Za-z0-9_-]+$/.test(reference) ||
      transaction.currency !== 'COP' ||
      !Number.isSafeInteger(transaction.amount_in_cents) ||
      transaction.amount_in_cents <= 0
    ) {
      return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 });
    }

    // 3. Pending and unknown statuses are observations, never permission to fulfil an order
    if (orderStatusForWompi(wompiStatus) === null) {
      return NextResponse.json({ received: true, observation: true, status: wompiStatus }, { status: 200 });
    }

    const supabase = getWebhookDatabase();
    // Deterministic provider event receipt identity
    const eventId = payload.id || `wompi_evt_${transaction.id}_${wompiStatus}_${payload.timestamp}`;

    // 4. Primary and ONLY transactional path: PostgreSQL Atomic Webhook RPC (ACID-safe, concurrency locked)
    // Elimination of unsafe JS fallback: if RPC fails or migration is missing, fail closed with retryable 500.
    const { data: rpcResult, error: rpcError } = await supabase.rpc('process_wompi_transaction', {
      p_event_id: eventId,
      p_transaction: transaction,
    });

    if (rpcError) {
      const msg = rpcError.message || '';
      console.error('[Wompi Webhook] Database RPC error:', msg);

      if (msg.includes('ORDER_NOT_FOUND')) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      if (msg.includes('ORDER_ALREADY_CANCELLED')) {
        return NextResponse.json({ error: 'Order already cancelled' }, { status: 409 });
      }
      if (msg.includes('PAYMENT_AMOUNT_MISMATCH')) {
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 422 });
      }
      if (msg.includes('INVALID_ORDER_UUID_REFERENCE') || msg.includes('INVALID_BALANCE_REFERENCE')) {
        return NextResponse.json({ error: 'Invalid reference format' }, { status: 400 });
      }

      // Fail-closed for database connectivity issues, missing RPC migration, or unexpected errors
      // Returning 500 triggers Wompi webhook retry mechanism until system is healthy.
      return NextResponse.json({ error: 'Database transaction processing failed', detail: msg }, { status: 500 });
    }

    if (!rpcResult || !rpcResult.success) {
      if (rpcResult?.error === 'ORDER_ALREADY_CANCELLED') {
        return NextResponse.json({ error: 'Order already cancelled' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Transaction rejected by database state invariant' }, { status: 422 });
    }

    // Handle duplicate acknowledgment
    if (rpcResult.duplicate) {
      return NextResponse.json({ received: true, duplicate: true, message: rpcResult.message }, { status: 200 });
    }

    // 5. Asynchronous Side-Effects (Durable Outbox pattern: decoupled from database transaction)
    if (rpcResult.action === 'order_approved' && rpcResult.order_id) {
      const orderId = rpcResult.order_id;
      // Trigger out-of-band notification without holding webhook response
      triggerOrderNotification(orderId, '', '', transaction.amount_in_cents / 100).catch(err => {
        console.error('[Wompi Webhook Outbox] Failed to deliver order notification:', err);
      });
    }

    return NextResponse.json({ received: true, atomic: true, action: rpcResult.action }, { status: 200 });

  } catch (error) {
    console.error('[Wompi Webhook] Critical error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: error instanceof SyntaxError ? 400 : 500 });
  }
}
