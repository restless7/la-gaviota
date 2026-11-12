import { getSchedulerDatabase } from '@/src/lib/server/database';
import { requireScheduler } from '@/src/lib/server/scheduler';
import { sendWhatsAppTemplate } from '@/src/lib/notifications';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try { requireScheduler(req); } catch { return NextResponse.json({error:'Unauthorized'},{status:401}); }
  const supabase = getSchedulerDatabase(req);
  try {
    // Find active carts older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: abandonedCarts, error: fetchError } = await supabase
      .from('abandoned_carts')
      .select('id, customer_phone, total_amount')
      .eq('status', 'active')
      .lt('last_active_at', thirtyMinutesAgo);

    if (fetchError) {
      throw fetchError;
    }

    if (!abandonedCarts || abandonedCarts.length === 0) {
      return NextResponse.json({ success: true, processed: 0, notificationsSent: 0, message: "No active carts to abandon" });
    }

    const ids = abandonedCarts.map(cart => cart.id);

    const { error: updateError } = await supabase
      .from('abandoned_carts')
      .update({
        status: 'abandoned',
        updated_at: new Date().toISOString()
      })
      .in('id', ids);

    if (updateError) {
      throw updateError;
    }

    let notificationsSent = 0;
    for (const cart of abandonedCarts) {
      if (cart.customer_phone) {
        const safeTotal = Number.isFinite(Number(cart.total_amount)) && Number(cart.total_amount) > 0
          ? Math.round(Number(cart.total_amount))
          : 0;
        const result = await sendWhatsAppTemplate(
          cart.customer_phone,
          'abandoned_cart_reminder',
          [
            {
              type: 'currency',
              currency: {
                fallback_value: `$${safeTotal} COP`,
                code: 'COP',
                amount_1000: safeTotal * 1000,
              },
            },
          ],
          'es',
          `abandoned-cart:${cart.id}`
        );
        if (result.sent) notificationsSent++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: abandonedCarts.length,
      notificationsSent,
    });

  } catch (error) {
    console.error('[Abandoned Cart Trigger Error]', error);
    return NextResponse.json({ error: 'Failed to process abandoned carts' }, { status: 500 });
  }
}
