import React from 'react';
import { OrderKanbanBoard } from './OrderKanbanBoard';
import { fetchOrders } from '@/src/actions/orders';

export default async function AdminOrdersPage() {
  const orders = await fetchOrders();
  
  return (
    <div className="w-full">
      <OrderKanbanBoard initialOrders={orders} />
    </div>
  );
}
