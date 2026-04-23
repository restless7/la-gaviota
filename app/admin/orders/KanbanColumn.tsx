"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Order, OrderStatus } from '@/src/data/mockOrders';
import { OrderCard } from './OrderCard';

export function KanbanColumn({ status, orders, onSelectOrder }: { status: OrderStatus; orders: Order[]; onSelectOrder: (o: Order) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'Column', status },
  });

  const getHeaderColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pendiente': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'En Preparación': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'En Ruta': return 'bg-[#FFCC00]/20 text-[#ca8a04] border-[#FFCC00]';
      case 'Entregado': return 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/30';
    }
  };

  return (
    <div className="flex flex-col w-[300px] flex-shrink-0 bg-slate-50/50 rounded-2xl border border-gray-100 overflow-hidden">
      <div className={`p-4 border-b ${getHeaderColor(status)} flex justify-between items-center bg-white/50`}>
        <h3 className="font-bold text-sm uppercase tracking-wider">{status}</h3>
        <span className="bg-white rounded-full px-2 py-0.5 text-xs font-black shadow-sm">{orders.length}</span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`flex-1 p-3 min-h-[500px] transition-colors ${isOver ? 'bg-gray-100/80 ring-2 ring-inset ring-gray-200' : ''}`}
      >
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onClick={() => onSelectOrder(order)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
