'use client';

import React from 'react';
import { ChefHat, Search, Settings, Truck } from 'lucide-react';

const MOCK_WHOLESALE = [
  { id: 'W001', name: 'Cadena Restaurantes Sándwich', activeStores: 15, route: 'Ruta Especial 1', defaultRecipe: 'Plantilla Burgers (Premium)', reorderRate: 'Señal Diaria' },
  { id: 'W002', name: 'Alimentación Industrial Col', activeStores: 3, route: 'Ruta Madrugada 4AM', defaultRecipe: 'Plantilla Casino Básico', reorderRate: 'Semanal (Lunes)' },
];

export default function WholesaleCustomersPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-[#E30613]/10 p-3 rounded-xl border border-[#E30613]/20">
               <ChefHat className="h-8 w-8 text-[#E30613]" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800">Restaurantes & Mayoristas</h1>
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
                     <th className="p-5 text-center">Locales Activos</th>
                     <th className="p-5">Ruta de Flota Asignada</th>
                     <th className="p-5">Plantilla Pordefecto</th>
                     <th className="p-5 text-center">Frecuencia</th>
                     <th className="p-5 text-center">Ajustes</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {MOCK_WHOLESALE.map(ent => (
                     <tr key={ent.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-5">
                           <p className="font-bold text-lg text-slate-800">{ent.name}</p>
                           <p className="text-sm text-gray-400">Licencia Enterprise: {ent.id}</p>
                        </td>
                        <td className="p-5 text-center">
                           <span className="bg-slate-200 text-slate-800 font-black px-3 py-1 rounded-full border border-slate-300">
                              {ent.activeStores}
                           </span>
                        </td>
                        <td className="p-5">
                           <div className="flex items-center gap-2 text-sm text-[#E30613] font-bold">
                              <Truck className="h-4 w-4" />
                              {ent.route}
                           </div>
                        </td>
                        <td className="p-5 font-mono text-sm text-slate-600 bg-slate-50 border-x border-gray-100">
                           {ent.defaultRecipe}
                        </td>
                        <td className="p-5 text-center font-medium text-gray-600">
                           {ent.reorderRate}
                        </td>
                        <td className="p-5 text-center">
                           <button className="text-gray-400 hover:text-slate-800 transition-colors">
                              <Settings className="h-6 w-6" />
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
