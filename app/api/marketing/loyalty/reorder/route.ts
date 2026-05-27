import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    // 1. Validate Cron Secret (Skipped for demo but necessary for production)
    // const authHeader = req.headers.get('Authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Define the Loyalty Reorder Threshold (e.g. 7 days without buying)
    const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const EIGHT_DAYS_AGO = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

    // We query customers who:
    // a. Are B2B (Micromercados or Restaurantes)
    // b. Have purchased before (total_orders > 0)
    // c. Their last order was between 7 and 8 days ago (to avoid spamming them every day after day 7)
    
    const { data: eligibleCustomers, error } = await supabase
      .from('customers')
      .select('clerk_user_id, full_name, business_name, phone, tier, last_order_at')
      .in('tier', ['Micromercados', 'Restaurantes'])
      .gt('total_orders', 0)
      .lt('last_order_at', SEVEN_DAYS_AGO)
      .gt('last_order_at', EIGHT_DAYS_AGO);

    if (error) throw error;

    if (!eligibleCustomers || eligibleCustomers.length === 0) {
      return NextResponse.json({ success: true, message: "No B2B customers eligible for reorder today." });
    }

    // 3. Trigger WhatsApp Reorder Funnel
    for (const customer of eligibleCustomers) {
      if (customer.phone) {
        console.log(`[LOYALTY TRIGGER] Sending Reorder WhatsApp to ${customer.business_name || customer.full_name} (${customer.phone}) - Tier: ${customer.tier}`);
        
        // In Production: 
        // await sendWhatsAppTemplate(customer.phone, 'b2b_reorder_reminder', [
        //   { type: 'text', text: customer.business_name || customer.full_name }
        // ]);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed_reorders: eligibleCustomers.length 
    });

  } catch (error) {
    console.error('[Loyalty Reorder Trigger Error]', error);
    return NextResponse.json({ error: 'Failed to process loyalty reorders' }, { status: 500 });
  }
}
