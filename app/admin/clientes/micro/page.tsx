import React from 'react';
import { Store, Search, Filter, FileText } from 'lucide-react';
import { fetchCustomers } from '@/src/actions/customers';

export default async function MicroCustomersPage() {
  const customers = await fetchCustomers('Micromercados');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-[#FFCC00]/10 p-3 rounded-xl border border-[#FFCC00]/20">
               <Store className="h-8 w-8 text-[#ca8a04]" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800 font-serif">Micromercados Aliados</h1>
               <p className="text-gray-500 mt-1">Gestión de cartera, cupos de crédito y frecuencia de pedido.</p>
            </div>
         </div>
         <button className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
            + Nuevo Micromercado
         </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Buscar por Razón Social o NIT..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] transition-all bg-slate-50" />
         </div>
         <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">
            <Filter className="h-4 w-4" /> Estado
         </button>
      </div>

      {/* Datagrid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                     <th className="p-4">Razón Social</th>
                     <th className="p-4 text-center">NIT</th>
                     <th className="p-4 text-right">Línea de Crédito (Max)</th>
                     <th className="p-4 text-right">Deuda Actual</th>
                     <th className="p-4 text-center">Condición de Pago</th>
                     <th className="p-4 text-center">Ejecutivo</th>
                     <th className="p-4 text-center">Detalle</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {customers.map(client => {
                     const risk = client.credit_limit > 0 ? client.current_balance / client.credit_limit : 0;
                     const riskColor = risk > 0.8 ? 'text-[#E30613]' : 'text-[#4CAF50]';
                     
                     return (
                     <tr key={client.clerk_user_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                           <p className="font-bold text-slate-800">{client.business_name || client.full_name}</p>
                           <p className="text-[10px] text-gray-400 font-mono">ID: {client.clerk_user_id.slice(0, 12)}</p>
                        </td>
                        <td className="p-4 text-center font-mono text-sm text-gray-600">{client.nit || 'N/A'}</td>
                        <td className="p-4 text-right font-medium text-slate-700">
                           ${client.credit_limit.toLocaleString()}
                        </td>
                        <td className={`p-4 text-right font-black ${riskColor}`}>
                           ${client.current_balance.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                           <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                              {client.payment_terms}
                           </span>
                        </td>
                        <td className="p-4 text-center text-sm font-medium text-gray-600">{client.assigned_rep || 'Sin asignar'}</td>
                        <td className="p-4 text-center">
                           <button className="text-gray-400 hover:text-slate-800 transition-colors p-2">
                              <FileText className="h-5 w-5" />
                           </button>
                        </td>
                     </tr>
                  )})}
                  {customers.length === 0 && (
                     <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-400 font-medium italic">
                           No hay registros de micromercados en este segmento.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
