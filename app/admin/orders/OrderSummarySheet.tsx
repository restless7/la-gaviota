"use client";

import React from 'react';
import { Order } from '@/src/data/mockOrders';
import { X, MapPin, Calendar, Package } from 'lucide-react';

export function OrderSummarySheet({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-40" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300">
         <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
               <span className="bg-[#E30613]/10 text-[#E30613] text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                 {order.customerTier}
               </span>
               <h2 className="text-2xl font-black text-slate-800 font-serif">{order.id}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
               <X className="w-5 h-5" />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-6">
            {/* Customer Details */}
            <div className="mb-8">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Detalles del Cliente</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="bg-slate-100 p-2 rounded-full text-slate-500"><Package className="w-4 h-4" /></div>
                     <div>
                        <p className="text-xs text-gray-500 font-medium">Nombre / Negocio</p>
                        <p className="font-bold text-slate-800 text-sm">{order.customerName}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="bg-slate-100 p-2 rounded-full text-slate-500"><MapPin className="w-4 h-4" /></div>
                     <div>
                        <p className="text-xs text-gray-500 font-medium">Dirección de Entrega</p>
                        <p className="font-bold text-slate-800 text-sm">{order.address}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="bg-slate-100 p-2 rounded-full text-slate-500"><Calendar className="w-4 h-4" /></div>
                     <div>
                        <p className="text-xs text-gray-500 font-medium">Fecha de Solicitud</p>
                        <p className="font-bold text-slate-800 text-sm">{new Date(order.date).toLocaleString('es-CO')}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Order Items */}
            <div>
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Productos</h3>
               <div className="space-y-4">
                  {order.items.map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-4">
                        <div>
                           <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                           <p className="text-xs font-semibold text-gray-500 mt-1">
                              {item.quantity} {item.unit} x ${item.price.toLocaleString('es-CO')}
                           </p>
                        </div>
                        <span className="font-black text-[#4CAF50]">${item.total.toLocaleString('es-CO')}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Total Summary Footer */}
         <div className="p-6 bg-slate-50 border-t border-gray-100 mt-auto">
            <div className="flex items-center justify-between mb-4">
               <span className="text-gray-500 font-bold">Total a Facturar</span>
               <span className="text-2xl font-black text-[#E30613]">${order.totalAmount.toLocaleString('es-CO')}</span>
            </div>
            <button className="w-full bg-[#4CAF50] hover:bg-[#3d8c40] text-white font-black py-4 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wide">
               Generar Factura & Romisión
            </button>
         </div>
      </div>
    </>
  );
}
