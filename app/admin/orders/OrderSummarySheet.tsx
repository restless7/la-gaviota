"use client";

import React, { useState, useTransition } from 'react';
import { Order, flagOrderConflict, updateOrderStatus, cancelAndRefundOrder, confirmCashPayment } from '@/src/actions/orders';
import { X, MapPin, Calendar, Package, AlertTriangle, ArrowRight } from 'lucide-react';

const CONFLICT_REASONS = [
  'Pedido Duplicado / Fallo de Pago',
  'Devolución Parcial o Faltantes',
  'Cliente no recibió el pedido',
  'Error en dirección de entrega',
  'Producto Dañado o Vencido',
  'Otro'
];

export function OrderSummarySheet({ order, onClose }: { order: Order; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [isReporting, setIsReporting] = useState(false);
  const [conflictReason, setConflictReason] = useState(CONFLICT_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const handleFlagConflict = () => {
    const finalReason = conflictReason === 'Otro' ? customReason : conflictReason;
    if (!finalReason.trim()) return;

    startTransition(async () => {
      try {
        if (conflictReason === 'Pedido Duplicado / Fallo de Pago') {
          await cancelAndRefundOrder(order.id, finalReason);
          alert('Pedido cancelado y métricas del cliente revertidas con éxito.');
        } else {
          await flagOrderConflict(order.id, finalReason);
          alert('Novedad reportada correctamente.');
        }
        setIsReporting(false);
        onClose();
      } catch (error) {
        alert('Error reportando novedad.');
      }
    });
  };

  const handleConfirmPayment = () => {
    if (!confirm('¿Confirmar que el pago en efectivo fue recibido? Esta acción sumará el valor a las métricas del cliente.')) return;
    startTransition(async () => {
      try {
        await confirmCashPayment(order.id);
        alert('Pago confirmado exitosamente.');
        onClose();
      } catch (error: any) {
        alert(error.message || 'Error al confirmar el pago.');
      }
    });
  };

  const handleCancelOrder = () => {
    if (!confirm('¿Seguro que deseas cancelar este pedido? Se descontará del historial del cliente si aplica.')) return;
    startTransition(async () => {
      try {
        await cancelAndRefundOrder(order.id, 'Cancelado por administrador');
        alert('Pedido cancelado.');
        onClose();
      } catch (error) {
        alert('Error al cancelar el pedido.');
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-40" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300">
         <div className={`p-6 border-b flex items-center justify-between ${order.is_conflicted ? 'bg-red-50 border-red-200' : 'border-gray-100'}`}>
            <div>
               <div className="flex items-center gap-2 mb-2">
                 <span className="bg-[#E30613]/10 text-[#E30613] text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider inline-block">
                   {order.clerk_user_id ? 'Wholesale' : 'Retail'}
                 </span>
                 {order.is_conflicted && (
                   <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                     <AlertTriangle className="w-3 h-3" /> Novedad
                   </span>
                 )}
                 {order.notes?.includes('[PAGO CONFIRMADO]') && (
                   <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                     Pagado
                   </span>
                 )}
               </div>
               <h2 className="text-2xl font-black text-slate-800 font-serif">{order.id.slice(0, 13)}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
               <X className="w-5 h-5" />
            </button>
         </div>

         {order.is_conflicted && (
           <div className="bg-red-100 p-4 border-b border-red-200">
             <h4 className="font-bold text-red-800 text-sm mb-1 flex items-center gap-2">
               <AlertTriangle className="w-4 h-4" /> Motivo de la Novedad:
             </h4>
             <p className="text-sm text-red-700">{order.conflict_reason}</p>
             <div className="mt-4 flex gap-2">
               <button 
                 onClick={onClose}
                 title="Se reprogramará automáticamente al cerrar el día."
                 className="flex-1 bg-white text-red-700 border border-red-200 hover:bg-red-50 font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-colors"
               >
                 Re-agendar para Mañana
               </button>
               <button 
                 onClick={handleCancelOrder}
                 disabled={isPending}
                 className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
               >
                 Cancelar Pedido
               </button>
             </div>
           </div>
         )}

         <div className="flex-1 overflow-y-auto p-6">
            {!order.is_conflicted && !isReporting && (
              <button 
                onClick={() => setIsReporting(true)}
                className="w-full mb-6 bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 font-bold py-3 rounded-xl shadow-sm transition-all text-sm uppercase tracking-wide flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" /> Reportar Novedad
              </button>
            )}

            {isReporting && (
              <div className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-200">
                <h4 className="font-bold text-orange-800 text-sm mb-2">Clasificar novedad:</h4>
                <select 
                  value={conflictReason}
                  onChange={(e) => setConflictReason(e.target.value)}
                  className="w-full p-2.5 mb-3 border border-orange-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none text-slate-700 font-medium"
                >
                  {CONFLICT_REASONS.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>

                {conflictReason === 'Otro' && (
                  <textarea 
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describa el motivo..."
                    className="w-full p-2 border border-orange-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none mb-3"
                    rows={2}
                  />
                )}

                {conflictReason === 'Pedido Duplicado / Fallo de Pago' && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-3 text-xs text-red-600 font-medium">
                    ⚠️ Esta acción cancelará el pedido y restará el valor automáticamente del historial y saldo del cliente.
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  <button onClick={() => setIsReporting(false)} className="flex-1 py-2 text-orange-600 font-bold text-xs uppercase hover:bg-orange-100 rounded-lg transition-colors">Cancelar</button>
                  <button onClick={handleFlagConflict} disabled={isPending || (conflictReason === 'Otro' && !customReason.trim())} className="flex-1 py-2 bg-orange-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-md">Confirmar</button>
                </div>
              </div>
            )}

            <div className="mb-8">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Detalles del Cliente</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="bg-slate-100 p-2 rounded-full text-slate-500"><Package className="w-4 h-4" /></div>
                     <div>
                        <p className="text-xs text-gray-500 font-medium">Nombre / Negocio</p>
                        <p className="font-bold text-slate-800 text-sm">{order.customer_name}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="bg-slate-100 p-2 rounded-full text-slate-500"><MapPin className="w-4 h-4" /></div>
                     <div>
                        <p className="text-xs text-gray-500 font-medium">Dirección de Entrega</p>
                        <p className="font-bold text-slate-800 text-sm">{order.delivery_address}, {order.delivery_municipality}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="bg-slate-100 p-2 rounded-full text-slate-500"><Calendar className="w-4 h-4" /></div>
                     <div>
                        <p className="text-xs text-gray-500 font-medium">Fecha Operativa</p>
                        <p className="font-bold text-slate-800 text-sm">{order.scheduled_delivery_date || new Date(order.created_at).toLocaleString('es-CO')}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div>
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Productos</h3>
               <div className="space-y-4">
                  {order.order_items?.map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-4">
                        <div>
                           <p className="font-bold text-slate-800 text-sm">{item.product_name}</p>
                           <p className="text-xs font-semibold text-gray-500 mt-1">
                              {item.quantity} x ${item.price_at_purchase.toLocaleString('es-CO')}
                           </p>
                        </div>
                        <span className="font-black text-[#4CAF50]">${(item.quantity * item.price_at_purchase).toLocaleString('es-CO')}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="p-6 bg-slate-50 border-t border-gray-100 mt-auto">
            <div className="flex items-center justify-between mb-4">
               <span className="text-gray-500 font-bold">Total a Facturar</span>
               <span className="text-2xl font-black text-[#E30613]">${Number(order.total_amount).toLocaleString('es-CO')}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {order.payment_method === 'cash' && !order.notes?.includes('[PAGO CONFIRMADO]') && (
                <button 
                  onClick={handleConfirmPayment}
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wide flex items-center justify-center text-center disabled:opacity-50"
                >
                  Confirmar Pago en Efectivo
                </button>
              )}
              
              <a 
                 href={`/admin/orders/invoice/${order.id}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="w-full bg-[#4CAF50] hover:bg-[#3d8c40] text-white font-black py-4 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wide flex items-center justify-center text-center"
              >
                 Generar Factura & Remisión
              </a>
            </div>
         </div>
      </div>
    </>
  );
}
