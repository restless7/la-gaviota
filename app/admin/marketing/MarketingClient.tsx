'use client';

import React from 'react';
import { ShoppingCart, TrendingUp, Users, MessageCircle, AlertTriangle, ArrowUpRight, CheckCircle, UserPlus } from 'lucide-react';

interface MarketingClientProps {
  kpis: {
    totalAbandoned: number;
    totalRecoveredAmount: number;
    recoveryRate: number;
  };
  recentCarts: any[];
  reorderEligible: any[];
  rawLeads: any[];
}

export default function MarketingClient({ kpis, recentCarts, reorderEligible, rawLeads }: MarketingClientProps) {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Phase 1: Abandoned Carts */}
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5 text-amber-500" />
                 Carritos Recientes
               </h3>
               <button className="text-sm font-bold text-blue-600 hover:underline">Ver Todos</button>
            </div>
            <div className="divide-y divide-gray-100 flex-1">
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

         {/* Phase 2: B2B Loyalty Reorder Engine */}
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Users className="h-5 w-5 text-purple-500" />
                 Listos para Recompra
               </h3>
               <button className="text-sm font-bold text-blue-600 hover:underline">Gestionar</button>
            </div>
            <div className="divide-y divide-gray-100 flex-1">
               {reorderEligible.map(cust => (
                  <div key={cust.clerk_user_id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                     <div>
                        <p className="font-bold text-slate-800 truncate max-w-[150px]">{cust.business_name || cust.full_name}</p>
                        <p className="text-xs text-gray-500">
                          Último pedido: {new Date(cust.last_order_at).toLocaleDateString('es-CO')}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="font-black text-slate-800">${(cust.total_spent / 1_000_000).toFixed(1)}M Total</p>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          cust.tier === 'Restaurantes' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {cust.tier}
                        </span>
                     </div>
                  </div>
               ))}
               {reorderEligible.length === 0 && (
                 <div className="p-8 text-center text-gray-400 font-medium">
                   <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle className="h-8 w-8 text-slate-300" />
                   </div>
                   Todos los clientes están al día.
                 </div>
               )}
            </div>
         </div>

         {/* Phase 3: B2B Commercial Leads */}
         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <UserPlus className="h-5 w-5 text-indigo-500" />
                 Prospectos B2B (Leads)
               </h3>
               <button className="text-sm font-bold text-blue-600 hover:underline">Abrir CRM</button>
            </div>
            <div className="divide-y divide-gray-100 flex-1">
               {rawLeads.map(lead => (
                  <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                     <div>
                        <p className="font-bold text-slate-800 truncate max-w-[150px]">{lead.business_name || lead.full_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {lead.business_type} · {new Date(lead.created_at).toLocaleDateString('es-CO')}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="font-bold text-slate-600 text-sm">{lead.phone}</p>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          lead.status === 'Nuevo' ? 'bg-green-100 text-green-700' :
                          lead.status === 'Contactado' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {lead.status}
                        </span>
                     </div>
                  </div>
               ))}
               {rawLeads.length === 0 && (
                 <div className="p-8 text-center text-gray-400 font-medium">
                   Aún no hay prospectos registrados.
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
