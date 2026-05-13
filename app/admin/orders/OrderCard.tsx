"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Order } from '@/src/actions/orders';

export function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
    data: { type: 'Order', order },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTierColor = (clerk_user_id: string | null) => {
    if (!clerk_user_id) return 'bg-gray-100 text-gray-700 border-gray-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
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
        <span className="text-[10px] font-black text-gray-400">{order.id.slice(0, 8)}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(order.clerk_user_id)}`}>
          {order.clerk_user_id ? 'Wholesale' : 'Retail'}
        </span>
      </div>
      <h4 className="font-bold text-slate-800 text-sm mb-1">{order.customer_name}</h4>
      <div className="flex justify-between items-end mt-4">
        <span className="text-[10px] text-gray-500 font-medium">
          {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
        <span className="font-black text-[#4CAF50]">${order.total_amount.toLocaleString('es-CO')}</span>
      </div>
    </div>
  );
}
