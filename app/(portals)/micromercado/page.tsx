'use client';

import React from 'react';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import Image from 'next/image';
import { ProductCard } from '@/src/components/store/ProductCard';
import { products } from '@/src/data/products';

export default function MicromercadoDashboard() {
  const { role } = useUserRole();

  // Micromercado: Focus on essential vegetables and kits for resale
  const bulkPicks = products.filter(p => p.category === 'Verduras Y Hortalizas' || p.category === 'Kits Negocios').slice(0, 4);

  return (
    <div className="animate-fade-in">
      {/* Welcome & Wholesale Banner */}
      <div className="flex flex-col md:flex-row items-center bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-200 gap-8 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFCC00]/20 rounded-full blur-3xl -mr-20 -mt-20 z-0"></div>
        <div className="w-32 h-32 md:w-48 md:h-48 relative shrink-0 z-10 bg-slate-100 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
           {/* Fallback to farmer or produce */}
           <Image src="/images/frutas-banner.jpg" alt="Micromercado Banner" fill className="object-cover" />
        </div>
        <div className="flex-1 z-10 text-center md:text-left">
           <span className="text-yellow-600 font-black tracking-widest uppercase text-xs sm:text-sm mb-2 block">Portal Bodega & Micromercados</span>
           <h1 className="text-3xl lg:text-5xl font-black text-slate-800 font-serif mb-4 leading-tight">
             Surta su negocio <span className="text-yellow-600">con la mejor calidad</span>
           </h1>
           <p className="text-gray-500 font-medium max-w-xl mx-auto md:mx-0">
             Inventario fresco garantizado. Disfrute de su tarifa especial &quot;Micromercados&quot; en todos nuestros productos.
           </p>
        </div>
      </div>

      {/* Action Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📦</span>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Pedidos Rápidos</h3>
            <p className="text-xs text-gray-500">Repita su última compra al instante.</p>
         </div>
         <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</span>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Mis Facturas</h3>
            <p className="text-xs text-gray-500">Historial y comprobantes de compra.</p>
         </div>
         <div className="bg-[#4CAF50] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:bg-green-600 transition-all cursor-pointer group">
            <span className="text-4xl mb-2">🚚</span>
            <h3 className="font-bold text-white text-lg">Ver estado de Ruta</h3>
         </div>
      </div>

      {/* Suggested Products */}
      <div className="mb-6 flex justify-between items-end">
         <h2 className="text-2xl font-black text-slate-800 font-serif">Sugeridos para Inventario</h2>
         <a href="/shop" className="text-sm font-bold text-yellow-600 hover:text-yellow-700 underline">Ver todo el catálogo</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {bulkPicks.map(p => (
            <ProductCard key={p.id} product={p} />
         ))}
      </div>
    </div>
  );
}
