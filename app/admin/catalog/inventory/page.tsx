'use client';

import React, { useState, useMemo } from 'react';
import { Package, Search, Filter, AlertTriangle, ChevronDown, Save } from 'lucide-react';
import { products, CATEGORIES } from '@/src/data/products';

// Deterministic stock based on product index (no Math.random)
function getStock(index: number): number {
  const seeds = [320, 45, 180, 12, 500, 88, 210, 35, 150, 420, 8, 275, 60, 340, 22, 190, 400, 55, 130, 310];
  return seeds[index % seeds.length];
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Frutas': '🍎',
  'Verduras Y Hortalizas': '🥬',
  'Pulpas': '🧃',
  'Varios Preparados': '🥗',
  'Carnes': '🥩',
  'Condimentos Frutos Secos Aromaticas': '🌶️',
  'Kits Negocios': '📦',
};

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleSave = (id: string) => {
    setSavedItems(prev => new Set(prev).add(id));
    setTimeout(() => {
      setSavedItems(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  const lowStockCount = products.filter((_, i) => getStock(i) < 50).length;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="bg-[#4CAF50]/10 p-3 rounded-xl border border-[#4CAF50]/20">
               <Package className="h-8 w-8 text-[#4CAF50]" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800">Inventario General</h1>
               <p className="text-gray-500 mt-1">
                 {products.length} productos registrados · <span className="text-[#E30613] font-bold">{lowStockCount} en stock bajo</span>
               </p>
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
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] transition-all bg-slate-50"
            />
         </div>
         <div className="relative">
           <select
             value={selectedCategory || ''}
             onChange={(e) => setSelectedCategory(e.target.value || null)}
             className="appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2 font-medium text-slate-700 outline-none focus:border-[#4CAF50] cursor-pointer"
           >
             <option value="">Todas</option>
             {CATEGORIES.map(cat => (
               <option key={cat} value={cat}>{cat}</option>
             ))}
           </select>
           <ChevronDown className="h-4 w-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
         </div>
         <span className="text-sm font-bold text-gray-400 whitespace-nowrap">
           {filtered.length} resultados
         </span>
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
                  {filtered.map((p, i) => {
                     const globalIndex = products.indexOf(p);
                     const stock = getStock(globalIndex);
                     const isLowStock = stock < 50;
                     const isSaved = savedItems.has(p.id);
                     const emoji = CATEGORY_EMOJI[p.category] || '📦';

                     return (
                     <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 relative bg-slate-100 flex items-center justify-center text-xl">
                              {emoji}
                           </div>
                           <div>
                             <p className="font-bold text-slate-800">{p.name}</p>
                             <p className="text-[10px] text-gray-400">{p.unit}</p>
                           </div>
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
                             <input type="checkbox" className="sr-only peer" defaultChecked={globalIndex % 4 !== 0} />
                             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
                             <span className="ml-3 text-sm font-medium text-gray-600">
                                {globalIndex % 4 !== 0 ? 'En Temporada' : 'Agotado'}
                             </span>
                           </label>
                        </td>
                        <td className="p-4 text-center">
                           <button
                             onClick={() => handleSave(p.id)}
                             className={`font-bold text-sm transition-all ${isSaved ? 'text-green-600' : 'text-[#4CAF50] hover:text-green-700 hover:underline decoration-2'}`}
                           >
                              {isSaved ? '✓ Guardado' : 'Guardar'}
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
