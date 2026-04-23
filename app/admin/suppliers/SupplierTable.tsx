"use client";

import React, { useState } from 'react';
import { Supplier, mockSuppliers } from '@/src/data/mockSuppliers';
import { Search, Plus, MapPin, Phone, Truck } from 'lucide-react';

export function SupplierTable() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.productsSupplied.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    if (status === 'Activo') return <span className="bg-[#4CAF50]/10 text-[#4CAF50] px-2 py-1 rounded-full text-xs font-bold border border-[#4CAF50]/20">Activo</span>;
    if (status === 'Auditando') return <span className="bg-[#FFCC00]/20 text-[#ca8a04] px-2 py-1 rounded-full text-xs font-bold border border-[#FFCC00]">Auditando</span>;
    return <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs font-bold border border-red-200">Inactivo</span>;
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar proveedor o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20 outline-none transition-all"
            />
         </div>
         <button className="w-full md:w-auto bg-[#4CAF50] hover:bg-[#3d8c40] text-white px-6 py-3 rounded-xl font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95">
           <Plus className="w-5 h-5" /> Registrar Granja
         </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold">Granja / Origen</th>
                <th className="px-6 py-4 font-bold">Contacto</th>
                <th className="px-6 py-4 font-bold">Productos Base</th>
                <th className="px-6 py-4 font-bold">Último Acopio</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(supplier => (
                <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                     <div className="font-bold text-slate-800">{supplier.name}</div>
                     <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                       <MapPin className="w-3 h-3" /> {supplier.location}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="font-medium text-slate-700">{supplier.contactPerson}</div>
                     <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                       <Phone className="w-3 h-3" /> {supplier.phone}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1">
                       {supplier.productsSupplied.map(p => (
                         <span key={p} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                           {p}
                         </span>
                       ))}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="text-gray-600 font-medium flex items-center gap-2">
                       <Truck className="w-4 h-4 text-gray-400" />
                       {supplier.lastDelivery}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     {getStatusBadge(supplier.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="text-[#E30613] font-bold hover:underline text-xs">Costos & Márgenes</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                      No se encontraron granjas con ese criterio.
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
