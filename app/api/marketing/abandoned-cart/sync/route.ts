import { getActor } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';



export async function POST(req: Request) {
  try {
    const actor = await getActor();
    const userId = actor.userId;
    if (!userId) return NextResponse.json({error:'Unauthorized'},{status:401});
    const supabase = getServerDatabase(actor);
    const payload = await req.json();
    const { items, cartTotal, phone, email, isCompleted } = payload;

    if (!isCompleted && (!items || items.length === 0)) {
      return NextResponse.json({ success: true, ignored: true });
    }

    let customerPhone = phone || null;
    let customerEmail = email || null;

    // Try to get details from Clerk if authenticated
    if (userId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        if (!customerPhone && user.primaryPhoneNumber) customerPhone = user.primaryPhoneNumber.phoneNumber;
        if (!customerEmail && user.primaryEmailAddress) customerEmail = user.primaryEmailAddress.emailAddress;
      } catch (e) {
        console.warn('Could not fetch clerk user details for abandoned cart sync', e);
      }
    }

    // Upsert logic: Since we might not have a reliable ID for guests before checkout,
    // we use clerk_user_id if available, otherwise we just insert a new one if it's the first ping,
    // or rely on local storage sending a cart_id (which we'd have to implement).
    // For Phase 1, tracking authenticated users is the priority.
    
    if (userId) {
      try {
        // Find existing active cart
        const { data: existingCart } = await supabase
          .from('abandoned_carts')
          .select('id')
          .eq('clerk_user_id', userId)
          .in('status', ['active', 'abandoned'])
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingCart) {
          const updatePayload: Record<string, unknown> = {
            customer_phone: customerPhone,
            customer_email: customerEmail,
            status: isCompleted ? 'recovered' : 'active',
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (Array.isArray(items) && items.length > 0) {
            updatePayload.cart_data = items;
          }
          if (typeof cartTotal === 'number' && Number.isFinite(cartTotal) && cartTotal >= 0) {
            updatePayload.total_amount = Math.round(cartTotal);
          }

          await supabase
            .from('abandoned_carts')
            .update(updatePayload)
            .eq('id', existingCart.id);
        } else {
          if (!isCompleted) {
            await supabase
              .from('abandoned_carts')
              .insert({
                clerk_user_id: userId,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                cart_data: items,
                total_amount: cartTotal,
                status: 'active'
              });
          }
        }
      } catch (dbErr) {
        console.warn('[Abandoned Cart DB Sync Warning]', dbErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Abandoned Cart Sync Error]', error);
    return NextResponse.json({ success: false, error: 'Telemetry sync non-fatal' }, { status: 200 });
  }
}
