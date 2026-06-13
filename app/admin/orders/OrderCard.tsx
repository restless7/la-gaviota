"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Order } from '@/src/actions/orders';

import { AlertTriangle } from 'lucide-react';

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

  const isPastDue = order.scheduled_delivery_date && order.scheduled_delivery_date < new Date().toISOString().split('T')[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white p-4 rounded-xl shadow-sm border cursor-grab active:cursor-grabbing mb-3 group transition-colors ${
        order.is_conflicted ? 'border-red-500 bg-red-50/10' : (isPastDue ? 'border-orange-400 bg-orange-50/20' : 'border-gray-100 hover:border-[#E30613]')
      } ${
        isDragging ? 'opacity-50 ring-2 ring-[#E30613] ring-offset-2' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black text-gray-400">{order.id.slice(0, 8)}</span>
        <div className="flex items-center gap-2">
          {isPastDue && !order.is_conflicted && (
            <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full uppercase">
              Atrasado
            </span>
          )}
          {order.is_conflicted && (
            <span title={order.conflict_reason || 'Conflicto'} className="text-red-500">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(order.clerk_user_id)}`}>
            {order.clerk_user_id ? 'Wholesale' : 'Retail'}
          </span>
        </div>
      </div>
      <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
        {order.customer_name}
      </h4>
      <div className="flex justify-between items-end mt-4">
        <span className="text-[10px] text-gray-500 font-medium">
          {order.scheduled_delivery_date || new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
        <span className="font-black text-[#4CAF50]">${Number(order.total_amount).toLocaleString('es-CO')}</span>
      </div>
    </div>
  );
}
