import React from 'react';
import { Users, Search, Filter, Mail, ShoppingBag } from 'lucide-react';
import { fetchCustomers } from '@/src/actions/customers';

export default async function RetailCustomersPage() {
  const customers = await fetchCustomers('Personas Naturales');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 font-serif">
               <Users className="h-8 w-8 text-[#E30613]" />
               Personas Naturales
            </h1>
            <p className="text-gray-500 mt-1">CRM Detal: Historial de compras y Life Time Value (LTV).</p>
         </div>
         <button className="bg-[#E30613] hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all">
            Exportar CSV
         </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre o correo..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] transition-all bg-slate-50" />
         </div>
         <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">
            <Filter className="h-4 w-4" /> Filtros
         </button>
      </div>

      {/* Datagrid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                     <th className="p-4">Cliente</th>
                     <th className="p-4">Contacto</th>
                     <th className="p-4 text-center">Pedidos</th>
                     <th className="p-4 text-right">LTV (COP)</th>
                     <th className="p-4 text-center">Última Compra</th>
                     <th className="p-4 text-center">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {customers.map(client => (
                     <tr key={client.clerk_user_id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                           <p className="font-bold text-slate-800">{client.full_name}</p>
                           <p className="text-[10px] text-gray-400 font-mono">ID: {client.clerk_user_id.slice(0, 12)}...</p>
                        </td>
                        <td className="p-4">
                           <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4 text-gray-400" />
                              {client.email}
                           </div>
                        </td>
                        <td className="p-4 text-center font-medium text-slate-700">{client.total_orders}</td>
                        <td className="p-4 text-right font-black text-[#4CAF50]">
                           ${client.total_spent.toLocaleString()}
                        </td>
                        <td className="p-4 text-center text-sm text-gray-500">
                           {client.last_order_at ? new Date(client.last_order_at).toLocaleDateString() : 'Nunca'}
                        </td>
                        <td className="p-4 text-center">
                           <button className="text-gray-400 hover:text-[#E30613] transition-colors p-2">
                              <ShoppingBag className="h-5 w-5" />
                           </button>
                        </td>
                     </tr>
                  ))}
                  {customers.length === 0 && (
                     <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-400 font-medium italic">
                           No hay registros de clientes en este segmento.
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
