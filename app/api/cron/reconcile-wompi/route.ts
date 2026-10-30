import { NextResponse } from 'next/server';
import { getSchedulerDatabase } from '@/src/lib/server/database';
import { reconcilePendingPaymentIntents } from '@/src/lib/server/wompiReconciliation';

export async function GET(req: Request) {
  return handleReconciliation(req);
}

export async function POST(req: Request) {
  return handleReconciliation(req);
}

async function handleReconciliation(req: Request) {
  try {
    // Requires constant-time timingSafeEqual CRON_SECRET verification
    const db = getSchedulerDatabase(req);

    const result = await reconcilePendingPaymentIntents(db);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      reconciliation: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    if (message === 'SCHEDULER_UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized scheduler execution' }, { status: 401 });
    }
    console.error('[Reconciliation Worker] Execution failure:', err);
    return NextResponse.json({ error: 'Reconciliation worker failure', detail: message }, { status: 500 });
  }
}
