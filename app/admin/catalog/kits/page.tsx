'use client';

import React from 'react';
import { Gift, Plus, GripVertical, Settings2, Image as ImageIcon } from 'lucide-react';
import { products } from '@/src/data/products';

export default function KitsAndPromotionsPage() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
            <div className="bg-[#E30613]/10 p-3 rounded-xl border border-[#E30613]/20">
               <Gift className="h-8 w-8 text-[#E30613]" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800">Constructor de Kits y Combos</h1>
               <p className="text-gray-500 mt-1">Arrastra productos para ensamblar "Kits Chéveres" y fija precios cerrados.</p>
            </div>
         </div>
         <button className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" /> Crear Nuevo Kit
         </button>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
         {/* Left Pane: Global Catalog Search */}
         <div className="w-[400px] bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-slate-50">
               <h3 className="font-bold text-slate-800 mb-2">Catálogo Surtifruver</h3>
               <input type="text" placeholder="Buscar para arrastrar..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#E30613]" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
               {products.map(p => (
                  <div key={p.id} className="flex flex-col bg-white border border-gray-100 p-3 rounded-lg hover:border-[#4CAF50] hover:shadow-md transition-all cursor-grab active:cursor-grabbing group">
                     <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                     <span className="text-xs text-gray-500">{p.category} • ${p.priceRetail.toLocaleString()} COP</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Right Pane: Kit Builder Canvas */}
         <div className="flex-1 bg-white rounded-2xl shadow-xl border-2 border-[#E30613]/20 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#E30613]/5 to-transparent flex justify-between items-start">
               <div className="flex-1">
                  <input type="text" defaultValue="Kit Chévere (Familiar)" className="text-3xl font-black text-slate-800 bg-transparent border-none outline-none w-full hover:bg-white focus:bg-white rounded p-1 transition-colors" />
                  <div className="flex items-center gap-1 mt-2 text-sm text-[#E30613] font-bold">
                     <Settings2 className="h-4 w-4" /> URL Slug: /shop?category=kits
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">Precio Fijo del Combo</p>
                  <div className="flex items-center gap-2">
                     <span className="font-black text-2xl text-slate-800">$</span>
                     <input type="text" defaultValue="45.000" className="text-3xl font-black text-[#E30613] outline-none text-right w-32 border-b-2 border-dashed border-red-300 focus:border-[#E30613] bg-transparent" />
                  </div>
               </div>
            </div>

            <div className="flex-1 p-6 bg-slate-50/50 overflow-y-auto w-full max-w-3xl mx-auto space-y-4">
               {/* Dropped items area */}
               <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                  <div className="w-12 h-12 bg-orange-100 rounded flex items-center justify-center">
                     <span className="text-xl">🥕</span>
                  </div>
                  <div className="flex-1">
                     <p className="font-bold text-slate-800">Zanahoria Blanca</p>
                  </div>
                  <div>
                     <input type="number" defaultValue={2} className="w-16 border border-gray-200 rounded p-1 text-center font-bold" /> <span className="text-sm text-gray-500 font-medium">Kg</span>
                  </div>
               </div>

               <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                  <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                     <span className="text-xl">🥑</span>
                  </div>
                  <div className="flex-1">
                     <p className="font-bold text-slate-800">Aguacate Hass</p>
                  </div>
                  <div>
                     <input type="number" defaultValue={5} className="w-16 border border-gray-200 rounded p-1 text-center font-bold" /> <span className="text-sm text-gray-500 font-medium">Unidades</span>
                  </div>
               </div>

               <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                  <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                     <span className="text-xl">🍅</span>
                  </div>
                  <div className="flex-1">
                     <p className="font-bold text-slate-800">Tomate Chonto</p>
                  </div>
                  <div>
                     <input type="number" defaultValue={1.5} step={0.5} className="w-16 border border-gray-200 rounded p-1 text-center font-bold" /> <span className="text-sm text-gray-500 font-medium">Kg</span>
                  </div>
               </div>

               {/* Drop Zone */}
               <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 bg-white">
                  <p className="font-bold">Arrastra productos aquí para añadirlos al Kit</p>
               </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-4">
               <button className="flex items-center gap-2 border border-blue-200 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors">
                  <ImageIcon className="h-4 w-4" /> Subir Imagen del Banner
               </button>
               <button className="bg-[#4CAF50] hover:bg-green-700 text-white px-8 py-2 rounded-lg font-bold shadow-md transition-all">
                  Guardar y Publicar Kit
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
