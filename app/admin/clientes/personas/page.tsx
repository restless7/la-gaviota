'use client';

import React from 'react';
import { Users, Search, Filter, Mail, ShoppingBag } from 'lucide-react';

const MOCK_RETAIL_CLIENTS = [
  { id: 'C001', name: 'Ana Maria Lopez', email: 'alopez@gmail.com', orders: 12, latestOrder: '2026-04-20', ltv: 650000, status: 'Active' },
  { id: 'C002', name: 'Carlos Rendon', email: 'crendon@hotmail.com', orders: 3, latestOrder: '2026-04-15', ltv: 125000, status: 'Active' },
  { id: 'C003', name: 'Lucia Quintero', email: 'lucia.q@yahoo.com', orders: 28, latestOrder: '2026-04-21', ltv: 2150000, status: 'VIP' },
  { id: 'C004', name: 'Mario Vargas', email: 'm.vargas@empresa.com', orders: 1, latestOrder: '2026-01-10', ltv: 45000, status: 'Inactive' },
];

export default function RetailCustomersPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
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
                     <th className="p-4 text-center">Estado</th>
                     <th className="p-4 text-center">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {MOCK_RETAIL_CLIENTS.map(client => (
                     <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                           <p className="font-bold text-slate-800">{client.name}</p>
                           <p className="text-xs text-gray-400">ID: {client.id}</p>
                        </td>
                        <td className="p-4">
                           <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4 text-gray-400" />
                              {client.email}
                           </div>
                        </td>
                        <td className="p-4 text-center font-medium text-slate-700">{client.orders}</td>
                        <td className="p-4 text-right font-black text-[#4CAF50]">
                           ${client.ltv.toLocaleString()}
                        </td>
                        <td className="p-4 text-center text-sm text-gray-500">{client.latestOrder}</td>
                        <td className="p-4 text-center">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              client.status === 'VIP' ? 'bg-[#FFCC00]/20 text-[#ca8a04]' :
                              client.status === 'Active' ? 'bg-[#4CAF50]/10 text-[#4CAF50]' :
                              'bg-gray-100 text-gray-500'
                           }`}>
                              {client.status}
                           </span>
                        </td>
                        <td className="p-4 text-center">
                           <button className="text-gray-400 hover:text-[#E30613] transition-colors p-2">
                              <ShoppingBag className="h-5 w-5" />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
