"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Order } from '@/src/data/mockOrders';

export function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
    data: { type: 'Order', order },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Restaurantes': return 'bg-[#FFCC00]/20 text-[#ca8a04] border-[#FFCC00]';
      case 'Micromercados': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing mb-3 group hover:border-[#E30613] transition-colors ${
        isDragging ? 'opacity-50 ring-2 ring-[#E30613] ring-offset-2' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-black text-gray-400">{order.id}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(order.customerTier)}`}>
          {order.customerTier === 'Personas Naturales' ? 'Retail' : order.customerTier}
        </span>
      </div>
      <h4 className="font-bold text-slate-800 text-sm mb-1">{order.customerName}</h4>
      <div className="flex justify-between items-end mt-4">
        <span className="text-xs text-gray-500 font-medium">{new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        <span className="font-black text-[#4CAF50]">${order.totalAmount.toLocaleString('es-CO')}</span>
      </div>
    </div>
  );
}
