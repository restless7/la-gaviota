import { getSchedulerDatabase } from '@/src/lib/server/database';
import { requireScheduler } from '@/src/lib/server/scheduler';
import { sendWhatsAppTemplate } from '@/src/lib/notifications';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try { requireScheduler(req); } catch { return NextResponse.json({error:'Unauthorized'},{status:401}); }
  const supabase = getSchedulerDatabase(req);
  try {
    // 1. Define the Loyalty Reorder Threshold (7 days without buying)
    const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const EIGHT_DAYS_AGO = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

    const { data: eligibleCustomers, error } = await supabase
      .from('customers')
      .select('clerk_user_id, full_name, business_name, phone, tier, last_order_at')
      .in('tier', ['Micromercados', 'Restaurantes'])
      .gt('total_orders', 0)
      .lt('last_order_at', SEVEN_DAYS_AGO)
      .gt('last_order_at', EIGHT_DAYS_AGO);

    if (error) throw error;

    if (!eligibleCustomers || eligibleCustomers.length === 0) {
      return NextResponse.json({ success: true, processed_reorders: 0, notificationsSent: 0, message: "No B2B customers eligible for reorder today." });
    }

    // 2. Trigger WhatsApp Reorder Funnel
    let notificationsSent = 0;
    for (const customer of eligibleCustomers) {
      if (customer.phone) {
        const displayName = (customer.business_name || customer.full_name || 'Cliente').trim();
        const result = await sendWhatsAppTemplate(
          customer.phone,
          'b2b_reorder_reminder',
          [{ type: 'text', text: displayName }],
          'es',
          `loyalty-reorder:${customer.clerk_user_id}`
        );
        if (result.sent) notificationsSent++;
      }
    }

    return NextResponse.json({
      success: true,
      processed_reorders: eligibleCustomers.length,
      notificationsSent,
    });

  } catch (error) {
    console.error('[Loyalty Reorder Trigger Error]', error);
    return NextResponse.json({ error: 'Failed to process loyalty reorders' }, { status: 500 });
  }
}
