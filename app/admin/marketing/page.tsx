import React from 'react';
import { createClient } from '@supabase/supabase-js';
import MarketingClient from './MarketingClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function MarketingHubPage() {
  // Try to fetch abandoned carts stats gracefully
  let totalAbandoned = 0;
  let totalRecoveredAmount = 0;
  let recoveryRate = 0;
  let carts: any[] = [];
  let reorderEligible: any[] = [];
  let rawLeads: any[] = [];

  try {
    const { data: abandonedData, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .order('last_active_at', { ascending: false });

    if (!error && abandonedData) {
      carts = abandonedData;
      totalAbandoned = abandonedData.length;
      const recovered = abandonedData.filter(c => c.status === 'recovered');
      totalRecoveredAmount = recovered.reduce((acc, c) => acc + c.total_amount, 0);
      if (totalAbandoned > 0) {
        recoveryRate = (recovered.length / totalAbandoned) * 100;
      }
    }

    // Phase 2: Fetch B2B Reorder Pipeline
    const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: b2bData } = await supabase
      .from('customers')
      .select('clerk_user_id, full_name, business_name, tier, last_order_at, total_spent')
      .in('tier', ['Micromercados', 'Restaurantes'])
      .gt('total_orders', 0)
      .lt('last_order_at', SEVEN_DAYS_AGO)
      .order('last_order_at', { ascending: true })
      .limit(5);
      
    if (b2bData) {
      reorderEligible = b2bData;
    }

    // Phase 3: Fetch B2B Commercial Leads
    const { data: leadsData } = await supabase
      .from('marketing_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (leadsData) {
      rawLeads = leadsData;
    }

  } catch (err) {
    console.error('Database query failed for marketing hub.', err);
  }

  const kpis = {
    totalAbandoned,
    totalRecoveredAmount,
    recoveryRate
  };

  return (
    <MarketingClient kpis={kpis} recentCarts={carts} reorderEligible={reorderEligible} rawLeads={rawLeads} />
  );
}
