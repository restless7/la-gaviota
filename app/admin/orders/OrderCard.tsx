"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Order } from '@/src/actions/orders';
import { AlertTriangle, FileText, Building2, MapPin } from 'lucide-react';
import { buildWhatsAppChatUrl, buildOrderConfirmationMessage } from '@/src/lib/whatsapp';
import { WhatsAppIcon } from '@/src/components/ui/WhatsAppIcon';

export function getOrderTierPresentation(order: Order) {
  const tier = order.customer_tier || (order.clerk_user_id ? 'Personas Naturales' : 'Personas Naturales');
  if (tier === 'Restaurantes') {
    return {
      label: '👨‍🍳 Restaurantes',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  if (tier === 'Micromercados') {
    return {
      label: '🏪 Micromercados',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }
  return {
    label: '🏠 Personas Naturales',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  };
}

export function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
    data: { type: 'Order', order },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tierInfo = getOrderTierPresentation(order);
  const isPastDue =
    order.scheduled_delivery_date &&
    order.scheduled_delivery_date < new Date().toISOString().split('T')[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white p-4 rounded-xl shadow-sm border cursor-grab active:cursor-grabbing mb-3 group transition-colors ${order.is_conflicted
          ? 'border-red-500 bg-red-50/10'
          : isPastDue
            ? 'border-orange-400 bg-orange-50/20'
            : 'border-gray-100 hover:border-[#E30613]'
        } ${isDragging ? 'opacity-50 ring-2 ring-[#E30613] ring-offset-2' : ''}`}
    >
      <div className="flex justify-between items-start gap-1.5 mb-2">
        <span className="text-[10px] font-black text-gray-400 font-mono">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierInfo.badgeClass}`}>
            {tierInfo.label}
          </span>
        </div>
      </div>

      {order.customer_business_name ? (
        <div className="mb-1">
          <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5 leading-snug">
            <Building2 className="w-3.5 h-3.5 text-[#1C2059] shrink-0" />
            <span className="truncate">{order.customer_business_name}</span>
          </h4>
          <p className="text-[11px] text-gray-500 font-medium truncate">{order.customer_name}</p>
        </div>
      ) : (
        <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{order.customer_name}</h4>
      )}

      <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate mb-3">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">
          {order.delivery_municipality} • {order.delivery_address}
        </span>
      </p>

      <div className="flex justify-between items-end pt-2 border-t border-gray-50">
        <span className="text-[10px] text-gray-500 font-medium">
          {order.scheduled_delivery_date ||
            new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex items-center gap-1.5">
          <a
            href={`/admin/orders/invoice/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Ver Factura y Remisión"
            className="bg-slate-100 hover:bg-[#1C2059] text-slate-600 hover:text-white p-1.5 rounded-md transition-colors inline-flex items-center justify-center"
          >
            <FileText className="w-3.5 h-3.5" />
          </a>
          {order.customer_phone && (
            <a
              href={buildWhatsAppChatUrl(order.customer_phone, buildOrderConfirmationMessage(order))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Confirmar por WhatsApp"
              className="bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white p-1.5 rounded-md transition-colors inline-flex items-center justify-center"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
            </a>
          )}
          <span className="font-black text-[#4CAF50] text-sm">
            ${Number(order.total_amount).toLocaleString('es-CO')}
          </span>
        </div>
      </div>
    </div>
  );
}
