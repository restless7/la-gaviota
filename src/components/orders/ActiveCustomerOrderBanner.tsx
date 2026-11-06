import React from 'react';
import { fetchActiveCustomerOrder } from '@/src/actions/tracking';
import { ActiveOrderStatusTracker } from './ActiveOrderStatusTracker';

export async function ActiveCustomerOrderBanner() {
  const activeOrder = await fetchActiveCustomerOrder();
  if (!activeOrder) return null;

  return (
    <div className="mb-8 w-full animate-in fade-in slide-in-from-top-2 duration-300">
      <ActiveOrderStatusTracker tracking={activeOrder} />
    </div>
  );
}
