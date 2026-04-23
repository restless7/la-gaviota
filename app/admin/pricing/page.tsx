'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, Save, RefreshCw } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
// Since it's a monorepo, we might need to use string-based API if 
// the generated files are not in the current package's path
// For now we use string names with any cast to ensure it compiles
const api = {
  gaviota: {
    listProducts: "gaviota:listProducts" as any,
    getPricingConfigs: "gaviota:getPricingConfigs" as any,
    updateProductCost: "gaviota:updateProductCost" as any,
    applyMacroMultipliers: "gaviota:applyMacroMultipliers" as any,
  }
};

export default function PricingMatrixPage() {
  const products = useQuery(api.gaviota.listProducts, { limit: 100 });
  const configs = useQuery(api.gaviota.getPricingConfigs);
  const updateCost = useMutation(api.gaviota.updateProductCost);
  const applyMacro = useMutation(api.gaviota.applyMacroMultipliers);

  const [retailMargin, setRetailMargin] = useState(25);
  const [microMargin, setMicroMargin] = useState(15);
  const [restaurantMargin, setRestaurantMargin] = useState(5);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (configs) {
      const rm = configs.find((c: any) => c.key === "retail_margin")?.value;
      const mm = configs.find((c: any) => c.key === "micro_margin")?.value;
      const rtm = configs.find((c: any) => c.key === "restaurant_margin")?.value;
      if (rm !== undefined) setRetailMargin(Math.round(rm * 100));
      if (mm !== undefined) setMicroMargin(Math.round(mm * 100));
      if (rtm !== undefined) setRestaurantMargin(Math.round(rtm * 100));
    }
  }, [configs]);

  const handleApplyMacro = async () => {
    setIsUpdating(true);
    try {
      await applyMacro({
        retailMargin,
        microMargin,
        restaurantMargin,
      });
      alert("Multiplicadores aplicados exitosamente");
    } catch (e) {
      console.error(e);
      alert("Error al aplicar multiplicadores");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!products) return <div className="p-8 text-center">Cargando catálogo...</div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-[#FFCC00]/20 p-3 rounded-xl border border-[#FFCC00]/40">
               <Calculator className="h-8 w-8 text-[#ca8a04]" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800">Gestión de Precios por Tier</h1>
               <p className="text-gray-500 mt-1">Multiplicadores masivos de margen (Personas, Micro, Restaurantes).</p>
            </div>
         </div>
         <button 
          onClick={handleApplyMacro}
          disabled={isUpdating}
          className="bg-[#E30613] hover:bg-red-700 disabled:opacity-50 text-white px-8 py-2 rounded-lg font-bold shadow-[0_4px_14px_rgba(227,6,19,0.4)] transition-all flex items-center gap-2"
         >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            Guardar y Aplicar Cambios
         </button>
      </div>

      {/* Macro Tools */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-50 flex flex-wrap gap-8 items-end">
         <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Macro: Personas (Detal)</label>
            <div className="flex items-center gap-2">
               <span className="text-sm font-medium text-gray-500">Costo Base +</span>
               <input 
                type="number" 
                value={retailMargin || 0} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setRetailMargin(isNaN(val) ? 0 : val);
                }}
                className="w-16 border border-gray-300 rounded font-bold text-center py-1 text-[#E30613]" 
               />
               <span className="text-sm font-medium text-gray-500">%</span>
            </div>
         </div>
         <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Macro: Micromercados</label>
            <div className="flex items-center gap-2">
               <span className="text-sm font-medium text-gray-500">Costo Base +</span>
               <input 
                type="number" 
                value={microMargin || 0} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setMicroMargin(isNaN(val) ? 0 : val);
                }}
                className="w-16 border border-gray-300 rounded font-bold text-center py-1 text-[#4CAF50]" 
               />
               <span className="text-sm font-medium text-gray-500">%</span>
            </div>
         </div>
         <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Macro: Restaurantes</label>
            <div className="flex items-center gap-2">
               <span className="text-sm font-medium text-gray-500">Costo Base +</span>
               <input 
                type="number" 
                value={restaurantMargin || 0} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setRestaurantMargin(isNaN(val) ? 0 : val);
                }}
                className="w-16 border border-gray-300 rounded font-bold text-center py-1 text-[#FFCC00]" 
               />
               <span className="text-sm font-medium text-gray-500">%</span>
            </div>
         </div>
         <p className="text-xs text-gray-400 italic max-w-xs">
            Al hacer clic en "Aplicar Cambios Masivos", todos los precios se recalcularán basados en el costo de compra actual.
         </p>
      </div>

      {/* Pricing Matrix */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider font-bold">
                     <th className="p-3 w-64 border-r border-slate-700">Producto</th>
                     <th className="p-3 text-right bg-slate-700 border-r border-slate-600">Costo Compra (Kg)</th>
                     <th className="p-3 text-center bg-[#E30613]/10 border-r border-slate-700 text-[#ff8088]">Preview Detal</th>
                     <th className="p-3 text-center bg-[#4CAF50]/10 border-r border-slate-700 text-[#82ea91]">Preview Micro</th>
                     <th className="p-3 text-center bg-[#FFCC00]/10 text-[#ffe566]">Preview Restaurante</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {products.map((p: any) => (
                     <tr key={p._id} className="hover:bg-indigo-50/30 transition-colors font-mono text-sm">
                        <td className="p-3 border-r border-gray-100 font-sans font-bold text-slate-800">
                           {p.name}
                        </td>
                        <td className="p-3 text-right border-r border-gray-100 bg-slate-50">
                           <input 
                            type="number" 
                            defaultValue={p.cost} 
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val === "") return;
                              const newCost = parseInt(val);
                              if (!isNaN(newCost) && newCost !== p.cost) {
                                updateCost({ id: p._id, cost: newCost });
                              }
                            }}
                            className="w-24 text-right px-2 py-1 outline-none border border-transparent hover:border-gray-300 focus:border-slate-800 rounded bg-transparent font-medium" 
                           />
                        </td>
                        <td className="p-3 text-center border-r border-gray-100 bg-red-50/20 font-bold text-[#E30613]">
                           ${Math.round(p.cost * (1 + retailMargin / 100)).toLocaleString()}
                        </td>
                        <td className="p-3 text-center border-r border-gray-100 bg-green-50/20 font-bold text-[#218524]">
                           ${Math.round(p.cost * (1 + microMargin / 100)).toLocaleString()}
                        </td>
                        <td className="p-3 text-center bg-yellow-50/20 font-bold text-[#a87405]">
                           ${Math.round(p.cost * (1 + restaurantMargin / 100)).toLocaleString()}
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
