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
  let carts = [];

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
  } catch (err) {
    console.error('Abandoned carts table might not exist yet.', err);
  }

  const kpis = {
    totalAbandoned,
    totalRecoveredAmount,
    recoveryRate
  };

  return (
    <MarketingClient kpis={kpis} recentCarts={carts} />
  );
}
