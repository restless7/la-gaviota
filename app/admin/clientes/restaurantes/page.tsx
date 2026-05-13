import React from 'react';
import { ChefHat, Search, Settings, Truck } from 'lucide-react';
import { fetchCustomers } from '@/src/actions/customers';

export default async function WholesaleCustomersPage() {
  const customers = await fetchCustomers('Restaurantes');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-[#E30613]/10 p-3 rounded-xl border border-[#E30613]/20">
               <ChefHat className="h-8 w-8 text-[#E30613]" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800 font-serif">Restaurantes & Mayoristas</h1>
               <p className="text-gray-500 mt-1">Cuentas corporativas, logística de flotas y plantillas de compra.</p>
            </div>
         </div>
         <button className="bg-[#4CAF50] hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all">
            Nueva Cuenta Enterprise
         </button>
      </div>

      {/* Datagrid */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-8">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-900 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-300 font-bold">
                     <th className="p-5">Grupo / Cadena Empresarial</th>
                     <th className="p-5 text-center">Pedidos Totales</th>
                     <th className="p-5">Ubicación / Dirección</th>
                     <th className="p-5 text-right">LTV Acumulado</th>
                     <th className="p-5 text-center">Condición</th>
                     <th className="p-5 text-center">Ajustes</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {customers.map(ent => (
                     <tr key={ent.clerk_user_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-5">
                           <p className="font-bold text-lg text-slate-800">{ent.business_name || ent.full_name}</p>
                           <p className="text-sm text-gray-400">Licencia Enterprise: {ent.clerk_user_id.slice(0, 12)}</p>
                        </td>
                        <td className="p-5 text-center">
                           <span className="bg-slate-200 text-slate-800 font-black px-3 py-1 rounded-full border border-slate-300">
                              {ent.total_orders}
                           </span>
                        </td>
                        <td className="p-5">
                           <div className="flex items-center gap-2 text-sm text-[#E30613] font-bold">
                              <Truck className="h-4 w-4" />
                              {ent.address || 'Sin dirección'}
                           </div>
                        </td>
                        <td className="p-5 text-right font-black text-[#4CAF50]">
                           ${ent.total_spent.toLocaleString()}
                        </td>
                        <td className="p-5 text-center font-medium text-gray-600">
                           {ent.payment_terms}
                        </td>
                        <td className="p-5 text-center">
                           <button className="text-gray-400 hover:text-slate-800 transition-colors">
                              <Settings className="h-6 w-6" />
                           </button>
                        </td>
                     </tr>
                  ))}
                  {customers.length === 0 && (
                     <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-400 font-medium italic">
                           No hay registros de restaurantes en este segmento.
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
