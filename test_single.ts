import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const date = '2026-06-13';
  const userId = 'user_admin_test';

  const { data: activeOrders, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, is_conflicted, total_amount, scheduled_delivery_date')
    .or(`scheduled_delivery_date.lte.${date},scheduled_delivery_date.is.null`)
    .neq('status', 'ARCHIVED_DELIVERED')
    .neq('status', 'Cancelado');

  console.log('Active Orders:', activeOrders);

  const deliveredOrders = activeOrders?.filter(o => o.status === 'Entregado') || [];
  
  if (deliveredOrders.length > 0) {
    const ledgersByDate: Record<string, { orders: number, revenue: number }> = {};
    
    deliveredOrders.forEach(o => {
      const orderDate = o.scheduled_delivery_date || date;
      if (!ledgersByDate[orderDate]) {
        ledgersByDate[orderDate] = { orders: 0, revenue: 0 };
      }
      ledgersByDate[orderDate].orders += 1;
      ledgersByDate[orderDate].revenue += Number(o.total_amount);
    });

    console.log('Ledgers By Date:', ledgersByDate);

    for (const [opDate, metrics] of Object.entries(ledgersByDate)) {
      console.log('Processing date:', opDate);
      const { data: existingLedger, error: selectErr } = await supabase
        .from('daily_operational_ledgers')
        .select('id, total_orders_processed, total_revenue_collected')
        .eq('operational_date', opDate)
        .maybeSingle();
      
      console.log('Existing Ledger:', existingLedger, selectErr);

      if (existingLedger) {
        console.log('Updating...');
        const { error: updateError } = await supabase
          .from('daily_operational_ledgers')
          .update({
            total_orders_processed: existingLedger.total_orders_processed + metrics.orders,
            total_revenue_collected: existingLedger.total_revenue_collected + metrics.revenue
          })
          .eq('id', existingLedger.id);
        console.log('Update Error:', updateError);
      } else {
        console.log('Inserting...');
        const { error: insertError } = await supabase
          .from('daily_operational_ledgers')
          .insert({
            operational_date: opDate,
            total_orders_processed: metrics.orders,
            total_revenue_collected: metrics.revenue,
            closed_by_user: userId
          });
        console.log('Insert Error:', insertError);
      }
    }
  }
}
run();
