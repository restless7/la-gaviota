'use client';

import React from 'react';
import { Package, Search, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { products } from '@/src/data/products';

export default function InventoryPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-[#4CAF50]/10 p-3 rounded-xl border border-[#4CAF50]/20">
               <Package className="h-8 w-8 text-[#4CAF50]" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800">Inventario General</h1>
               <p className="text-gray-500 mt-1">Existencias, mermas y temporada de productos agrícolas.</p>
            </div>
         </div>
         <button className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all">
            + Registrar Lote Nuevo
         </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex-1 relative">
            <Search className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Buscar producto por nombre o SKU..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] transition-all bg-slate-50" />
         </div>
         <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium">
            <Filter className="h-4 w-4" /> Temporada
         </button>
      </div>

      {/* Datagrid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                     <th className="p-4">Producto</th>
                     <th className="p-4 text-center">Categoría</th>
                     <th className="p-4 text-right">Existencias (Kg/Und)</th>
                     <th className="p-4 text-center">Umbral de Merma</th>
                     <th className="p-4 text-center">Estado de Temporada</th>
                     <th className="p-4 text-center">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {products.slice(0, 8).map((p, i) => {
                     const stock = Math.floor(Math.random() * 500) + 10;
                     const isLowStock = stock < 50;

                     return (
                     <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 relative bg-white">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                           </div>
                           <p className="font-bold text-slate-800">{p.name}</p>
                        </td>
                        <td className="p-4 text-center text-sm font-medium text-gray-500">{p.category}</td>
                        <td className="p-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                              {isLowStock && <AlertTriangle className="h-4 w-4 text-[#E30613]" />}
                              <input 
                                 type="text" 
                                 defaultValue={`${stock}`}
                                 className={`w-20 text-right px-2 py-1 border rounded-md font-bold focus:ring-[#4CAF50] focus:border-[#4CAF50] outline-none ${isLowStock ? 'border-[#E30613]/50 text-[#E30613] bg-[#E30613]/5' : 'border-gray-200 text-slate-700'}`} 
                              />
                           </div>
                        </td>
                        <td className="p-4 text-center">
                           <span className="text-gray-400 font-mono text-sm">~5%</span>
                        </td>
                        <td className="p-4 text-center">
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" className="sr-only peer" defaultChecked={i % 4 !== 0} />
                             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
                             <span className="ml-3 text-sm font-medium text-gray-600">
                                {i % 4 !== 0 ? 'En Temporada' : 'Agotado'}
                             </span>
                           </label>
                        </td>
                        <td className="p-4 text-center">
                           <button className="text-[#4CAF50] hover:text-green-700 font-bold text-sm transition-colors decoration-2 hover:underline">
                              Guardar
                           </button>
                        </td>
                     </tr>
                  )})}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
