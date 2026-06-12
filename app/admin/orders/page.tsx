import React from 'react';
import { OrderKanbanBoard } from './OrderKanbanBoard';
import { getLiveOperationalOrders, getHistoricLedgers } from '@/src/actions/orders';

export default async function AdminOrdersPage() {
  const [orders, ledgers] = await Promise.all([
    getLiveOperationalOrders(),
    getHistoricLedgers()
  ]);
  
  return (
    <div className="w-full">
      <OrderKanbanBoard initialOrders={orders} historicLedgers={ledgers} />
    </div>
  );
}
