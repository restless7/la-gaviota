import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getServerDatabase } from '@/src/lib/server/database';
import { generateOrderForOccurrence } from '@/src/lib/subscriptions/generator';
import { formatBogotaDateIso } from '@/src/lib/subscriptions/recurrence';

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // If CRON_SECRET is not configured in dev, allow with warning
    if (process.env.NODE_ENV !== 'production') return true;
    return false;
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const customHeader = request.headers.get('x-cron-secret') || '';
  const candidate = token || customHeader;

  if (!candidate || candidate.length !== secret.length) return false;
  try {
    return timingSafeEqual(Buffer.from(candidate), Buffer.from(secret));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'UNAUTHORIZED_CRON_REQUEST' }, { status: 401 });
  }

  const nowBogota = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const todayIso = formatBogotaDateIso(nowBogota);

  // Target deliveries scheduled for today or tomorrow (preparation cycle)
  const tomorrow = new Date(nowBogota.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = formatBogotaDateIso(tomorrow);

  const db = getServerDatabase({ userId: 'system', role: 'ADMIN', tier: 'Personas Naturales' });

  // Query occurrences due for generation
  const { data: occurrences, error } = await db
    .from('grocery_subscription_occurrences')
    .select('id, subscription_id, scheduled_delivery_date, status')
    .in('status', ['SCHEDULED'])
    .lte('scheduled_delivery_date', tomorrowIso)
    .order('scheduled_delivery_date', { ascending: true })
    .limit(50);

  if (error || !occurrences) {
    return NextResponse.json(
      { success: false, error: error?.message || 'FAILED_TO_FETCH_OCCURRENCES' },
      { status: 500 }
    );
  }

  const results = [];
  let confirmed = 0;
  let pendingApproval = 0;
  let failed = 0;

  for (const occ of occurrences) {
    try {
      const genResult = await generateOrderForOccurrence(occ.id, {
        actorId: 'SYSTEM_SCHEDULER',
      });
      results.push(genResult);
      if (genResult.status === 'CONFIRMED') confirmed++;
      else if (genResult.status === 'PENDING_APPROVAL') pendingApproval++;
      else failed++;
    } catch (occErr) {
      failed++;
      results.push({
        success: false,
        occurrenceId: occ.id,
        status: 'FAILED',
        message: occErr instanceof Error ? occErr.message : String(occErr),
      });
    }
  }

  return NextResponse.json({
    success: true,
    executionDate: todayIso,
    processedCount: occurrences.length,
    confirmedCount: confirmed,
    pendingApprovalCount: pendingApproval,
    failedCount: failed,
    results,
  });
}

export async function POST(request: Request) {
  return GET(request);
}

