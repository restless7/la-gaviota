'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { ActiveOrderTrackingDetails } from '@/src/services/orderStatusService';
import { useRouter } from 'next/navigation';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

export function ActiveOrderStatusTracker({ 
  tracking,
  title = "Estado de tu Pedido en Vivo"
}: { 
  tracking: ActiveOrderTrackingDetails;
  title?: string;
}) {
  const [showItems, setShowItems] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const getStageIcon = (iconName: string, state: string) => {
    const isCompleted = state === 'completed';
    const isCurrent = state === 'current';
    const isCancelled = state === 'cancelled';

    const colorClass = isCancelled
      ? 'text-red-500'
      : isCompleted
        ? 'text-emerald-600'
        : isCurrent
          ? 'text-amber-500 animate-pulse'
          : 'text-slate-300';

    switch (iconName) {
      case 'clock':
        return <Clock className={`h-5 w-5 ${colorClass}`} />;
      case 'package':
        return <Package className={`h-5 w-5 ${colorClass}`} />;
      case 'truck':
        return <Truck className={`h-5 w-5 ${colorClass}`} />;
      case 'check':
        return <CheckCircle2 className={`h-5 w-5 ${colorClass}`} />;
      default:
        return <Clock className={`h-5 w-5 ${colorClass}`} />;
    }
  };

  return (
    <div 
      aria-label="Seguimiento de pedido en vivo"
      className="w-full bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden relative"
    >
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                {tracking.isLive ? 'Operación en Vivo' : 'Historial de Entrega'}
              </span>
              <span className="text-xs text-slate-400 font-mono">• {tracking.displayNumber}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5">
              <MapPin size={13} className="text-amber-400 shrink-0" />
              <span>{tracking.destination.address}, {tracking.destination.city}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${tracking.statusBadge.classes}`}>
              {tracking.statusBadge.label}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Actualizar estado en vivo"
              aria-label="Actualizar estado del pedido"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Stepper Timeline */}
      <div className="p-6 sm:p-8">
        
        {/* Progress bar background */}
        <div className="relative mb-8 sm:mb-10 px-2 sm:px-6">
          <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 -z-0">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${tracking.progressPercent}%` }}
              role="progressbar"
              aria-valuenow={tracking.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <div className="grid grid-cols-4 relative z-10">
            {tracking.stages.map((stage) => {
              const isDone = stage.state === 'completed';
              const isCurrent = stage.state === 'current';

              return (
                <div key={stage.key} className="flex flex-col items-center text-center">
                  <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                    isDone 
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' 
                      : isCurrent 
                        ? 'bg-amber-400 text-slate-900 ring-4 ring-amber-100 scale-110 shadow-md font-black' 
                        : 'bg-white text-slate-400 border-2 border-slate-200'
                  }`}>
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      getStageIcon(stage.icon, stage.state)
                    )}
                  </div>
                  
                  <span className={`text-[11px] sm:text-xs font-bold mt-2.5 line-clamp-1 ${
                    isCurrent ? 'text-slate-900 font-black' : isDone ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {stage.label}
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:block">
                    {stage.sublabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Operational Message Banner */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Detalle Operativo en Tiempo Real
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 leading-relaxed">
                {tracking.stages[Math.max(0, tracking.currentStepIndex)]?.description || tracking.deliveryWindow}
              </p>
              <p className="text-xs text-emerald-700 font-bold mt-1">
                {tracking.deliveryWindow}
              </p>
            </div>
          </div>

          <a
            href={tracking.supportWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shrink-0 shadow-sm"
          >
            <MessageCircle size={15} />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>

        {/* Expandable Order Summary */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowItems(!showItems)}
            className="w-full px-5 py-3.5 bg-white hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-slate-500" />
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Productos en este Pedido ({tracking.items.length})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-slate-900">
                {formatPrice(tracking.financialSummary.totalAmount)}
              </span>
              {showItems ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </div>
          </button>

          {showItems && (
            <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-gray-100 space-y-2.5 animate-in fade-in duration-200">
              {tracking.items.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-200/50 last:border-none">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="text-slate-400 ml-2">× {item.quantity}</span>
                  </div>
                  <span className="font-bold text-slate-700">{formatPrice(item.subtotal)}</span>
                </div>
              ))}

              <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Método de Pago:</span>
                <span className="uppercase text-slate-800">
                  {tracking.financialSummary.paymentMethod === 'contra_entrega' || tracking.financialSummary.paymentMethod === 'cash'
                    ? 'Pago Contra Entrega'
                    : 'Pago Electrónico (Wompi)'}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

