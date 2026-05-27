'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, Save, RefreshCw, Search, ChevronDown } from 'lucide-react';
import { Product, applyMacroMargins, updateProductPricing, updateProductPrices } from '@/src/actions/products';

interface EditableProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  cost: number;
  priceRetail: number;
  priceMicro: number;
  priceRestaurant: number;
}

export default function PricingClient({ initialProducts }: { initialProducts: Product[] }) {
  const [retailMargin, setRetailMargin] = useState(25);
  const [microMargin, setMicroMargin] = useState(15);
  const [restaurantMargin, setRestaurantMargin] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const CATEGORIES = useMemo(() => Array.from(new Set(initialProducts.map(p => p.category))), [initialProducts]);

  // Initialize editable products from static data
  const [editableProducts, setEditableProducts] = useState<EditableProduct[]>(() =>
    initialProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      unit: p.unit,
      cost: p.baseCost || Math.round(p.priceRetail * 0.65), // Fallback if baseCost is 0
      priceRetail: p.priceRetail,
      priceMicro: p.priceMicro,
      priceRestaurant: p.priceRestaurant,
    }))
  );

  const filteredProducts = useMemo(() => {
    return editableProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [editableProducts, searchTerm, selectedCategory]);

  const handleCostChange = async (id: string, newCost: number) => {
    try {
      // Optimistic update
      setEditableProducts(prev =>
        prev.map(p => p.id === id ? { ...p, cost: newCost } : p)
      );

      // Save to DB
      await updateProductPricing(id, newCost); 
    } catch (error) {
      console.error('Failed to update cost', error);
      alert('Error guardando el costo base.');
    }
  };

  const handlePriceChange = async (id: string, field: 'priceRetail' | 'priceMicro' | 'priceRestaurant', newValue: number) => {
    try {
      setEditableProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: newValue } : p));
      
      const product = editableProducts.find(p => p.id === id);
      if (!product) return;
      
      const newPrices = {
        retail: field === 'priceRetail' ? newValue : product.priceRetail,
        micro: field === 'priceMicro' ? newValue : product.priceMicro,
        restaurant: field === 'priceRestaurant' ? newValue : product.priceRestaurant,
      };

      await updateProductPrices(id, newPrices);
    } catch (error) {
      console.error('Failed to update specific price', error);
      alert('Error actualizando el precio específico.');
    }
  };

  const handleApplyMacro = async () => {
    setIsApplying(true);
    try {
      await applyMacroMargins(retailMargin, microMargin, restaurantMargin);

      setEditableProducts(prev =>
        prev.map(p => ({
          ...p,
          priceRetail: Math.round(p.cost * (1 + retailMargin / 100)),
          priceMicro: Math.round(p.cost * (1 + microMargin / 100)),
          priceRestaurant: Math.round(p.cost * (1 + restaurantMargin / 100)),
        }))
      );

      setSuccessMessage(`✅ ${editableProducts.length} productos actualizados con márgenes: Detal +${retailMargin}%, Micro +${microMargin}%, Rest. +${restaurantMargin}%`);
    } catch (error) {
      console.error('Failed to apply macro margins', error);
      alert('Error aplicando márgenes masivos.');
    } finally {
      setIsApplying(false);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const formatCOP = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

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
          disabled={isApplying}
          className="bg-[#E30613] hover:bg-red-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold shadow-[0_4px_14px_rgba(227,6,19,0.4)] transition-all flex items-center gap-2"
         >
            <RefreshCw className={`h-4 w-4 ${isApplying ? 'animate-spin' : ''}`} />
            {isApplying ? 'Aplicando...' : 'Aplicar Cambios Masivos'}
         </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-xl font-bold text-sm animate-fade-in">
          {successMessage}
        </div>
      )}

      {/* Macro Tools */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-indigo-50 flex flex-wrap gap-8 items-end">
         <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Macro: Personas (Detal)</label>
            <div className="flex items-center gap-2">
               <span className="text-sm font-medium text-gray-500">Costo Base +</span>
               <input
                type="number"
                value={retailMargin}
                onChange={(e) => setRetailMargin(parseInt(e.target.value) || 0)}
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
                value={microMargin}
                onChange={(e) => setMicroMargin(parseInt(e.target.value) || 0)}
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
                value={restaurantMargin}
                onChange={(e) => setRestaurantMargin(parseInt(e.target.value) || 0)}
                className="w-16 border border-gray-300 rounded font-bold text-center py-1 text-[#FFCC00]"
               />
               <span className="text-sm font-medium text-gray-500">%</span>
            </div>
         </div>
         <p className="text-xs text-gray-400 italic max-w-xs">
            Al hacer clic en &quot;Aplicar Cambios Masivos&quot;, todos los precios se recalcularán basados en el costo de compra actual.
         </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00] bg-white"
          />
        </div>
        <div className="relative">
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2.5 font-medium text-slate-700 outline-none focus:border-[#FFCC00] cursor-pointer"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>
        <span className="text-sm font-bold text-gray-400 whitespace-nowrap">
          {filteredProducts.length} productos
        </span>
      </div>

      {/* Pricing Matrix */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider font-bold">
                     <th className="p-3 w-64 border-r border-slate-700">Producto</th>
                     <th className="p-3 text-center border-r border-slate-700">Categoría</th>
                     <th className="p-3 text-right bg-slate-700 border-r border-slate-600">Costo Compra</th>
                     <th className="p-3 text-center bg-[#E30613]/10 border-r border-slate-700 text-[#ff8088]">Precio Detal</th>
                     <th className="p-3 text-center bg-[#4CAF50]/10 border-r border-slate-700 text-[#82ea91]">Precio Micro</th>
                     <th className="p-3 text-center bg-[#FFCC00]/10 text-[#ffe566]">Precio Restaurante</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map(p => (
                     <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors text-sm">
                        <td className="p-3 border-r border-gray-100 font-bold text-slate-800">
                           {p.name}
                           <span className="block text-[10px] text-gray-400 font-normal mt-0.5">/ {p.unit}</span>
                        </td>
                        <td className="p-3 text-center border-r border-gray-100 text-xs font-medium text-gray-500">
                           {p.category}
                        </td>
                        <td className="p-3 text-right border-r border-gray-100 bg-slate-50">
                           <input
                            type="number"
                            defaultValue={p.cost}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== p.cost) {
                                handleCostChange(p.id, val);
                              }
                            }}
                            className="w-24 text-right px-2 py-1 outline-none border border-transparent hover:border-gray-300 focus:border-slate-800 rounded bg-transparent font-mono font-medium"
                           />
                        </td>
                        <td className="p-3 text-center border-r border-gray-100 bg-red-50/20">
                           <input
                            type="number"
                            defaultValue={p.priceRetail}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== p.priceRetail) handlePriceChange(p.id, 'priceRetail', val);
                            }}
                            className="w-24 text-center px-2 py-1 outline-none border border-transparent hover:border-gray-300 focus:border-slate-800 rounded bg-transparent font-mono font-bold text-[#E30613]"
                           />
                        </td>
                        <td className="p-3 text-center border-r border-gray-100 bg-green-50/20">
                           <input
                            type="number"
                            defaultValue={p.priceMicro}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== p.priceMicro) handlePriceChange(p.id, 'priceMicro', val);
                            }}
                            className="w-24 text-center px-2 py-1 outline-none border border-transparent hover:border-gray-300 focus:border-slate-800 rounded bg-transparent font-mono font-bold text-[#218524]"
                           />
                        </td>
                        <td className="p-3 text-center bg-yellow-50/20">
                           <input
                            type="number"
                            defaultValue={p.priceRestaurant}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== p.priceRestaurant) handlePriceChange(p.id, 'priceRestaurant', val);
                            }}
                            className="w-24 text-center px-2 py-1 outline-none border border-transparent hover:border-gray-300 focus:border-slate-800 rounded bg-transparent font-mono font-bold text-[#a87405]"
                           />
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
