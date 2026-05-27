'use client';

import React from 'react';
import { ShoppingCart, TrendingUp, Users, MessageCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface MarketingClientProps {
  kpis: {
    totalAbandoned: number;
    totalRecoveredAmount: number;
    recoveryRate: number;
  };
  recentCarts: any[];
}

export default function MarketingClient({ kpis, recentCarts }: MarketingClientProps) {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
         <div>
            <h1 className="text-3xl font-black text-slate-800 font-serif">Marketing Enterprise</h1>
            <p className="text-gray-500 mt-1">Automatización de retención, recuperación y embudos B2B.</p>
         </div>
         <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold border border-blue-200 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Motor Activo
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-red-50 p-4 rounded-xl text-red-500"><ShoppingCart /></div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Carritos Abandonados</p>
               <h3 className="text-2xl font-black text-slate-800">{kpis.totalAbandoned}</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-green-50 p-4 rounded-xl text-green-500"><TrendingUp /></div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ingresos Recuperados</p>
               <h3 className="text-2xl font-black text-slate-800">${(kpis.totalRecoveredAmount / 1_000_000).toFixed(2)}M COP</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-purple-50 p-4 rounded-xl text-purple-500"><MessageCircle /></div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tasa de Conversión WhatsApp</p>
               <h3 className="text-2xl font-black text-slate-800">{kpis.recoveryRate.toFixed(1)}%</h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5 text-amber-500" />
                 Carritos Recientes en Riesgo
               </h3>
               <button className="text-sm font-bold text-blue-600 hover:underline">Ver Todos</button>
            </div>
            <div className="divide-y divide-gray-100">
               {recentCarts.slice(0, 5).map(cart => (
                  <div key={cart.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                     <div>
                        <p className="font-bold text-slate-800">{cart.customer_phone || cart.customer_email || 'Usuario Anónimo'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(cart.last_active_at).toLocaleString('es-CO')}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="font-black text-slate-800">${cart.total_amount.toLocaleString('es-CO')} COP</p>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          cart.status === 'recovered' ? 'bg-green-100 text-green-700' :
                          cart.status === 'abandoned' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {cart.status}
                        </span>
                     </div>
                  </div>
               ))}
               {recentCarts.length === 0 && (
                 <div className="p-8 text-center text-gray-400 font-medium">
                   No hay carritos abandonados aún.
                 </div>
               )}
            </div>
         </div>

         {/* Embudos B2B Placeholder for Phase 2 & 3 */}
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
               <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 text-center max-w-sm">
                  <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Users className="h-8 w-8 text-amber-600" />
                  </div>
                  <h4 className="font-black text-slate-800 text-xl mb-2">Embudos B2B (Fase 2)</h4>
                  <p className="text-sm text-gray-500 font-medium mb-4">La automatización de lealtad y leads se desplegará próximamente según el Roadmap.</p>
               </div>
            </div>
            <div className="p-6 opacity-30 pointer-events-none">
               <h3 className="font-bold text-slate-800 mb-6">CRM Prospección Comercial</h3>
               {/* Dummy skeleton content */}
               <div className="space-y-4">
                 <div className="h-16 bg-gray-200 rounded-xl w-full"></div>
                 <div className="h-16 bg-gray-200 rounded-xl w-full"></div>
                 <div className="h-16 bg-gray-200 rounded-xl w-full"></div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
