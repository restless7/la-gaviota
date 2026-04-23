'use client';

import React, { useState, useMemo } from 'react';
import { Product, CATEGORIES } from '@/src/data/products';
import { ProductCard } from './ProductCard';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import Image from 'next/image';

const CATEGORY_BANNERS: Record<string, string> = {
  'Frutas': '/IMAGES/frutas-banner.jpeg',
  'Verduras Y Hortalizas': '/IMAGES/verduras-banner1.jpeg',
  'Verduras': '/IMAGES/verduras-banner1.jpeg',
  'Carnes': '/IMAGES/carnes-banner1.jpeg',
};
import { DeliveryScheduler } from '@/src/components/checkout/DeliveryScheduler';

export default function ShopView({ initialProducts }: { initialProducts: Product[] }) {
   const [search, setSearch] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
   const [sortOrder, setSortOrder] = useState<'asc'|'desc'|null>(null);
   const { role } = useUserRole();

   const filteredProducts = useMemo(() => {
     const filtered = initialProducts.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = selectedCategory ? p.category === selectedCategory : true;
        return matchSearch && matchCategory;
     });

     if (sortOrder) {
         filtered.sort((a, b) => {
             const priceA = role === 'Restaurantes' ? a.priceRestaurant : role === 'Micromercados' ? a.priceMicro : a.priceRetail;
             const priceB = role === 'Restaurantes' ? b.priceRestaurant : role === 'Micromercados' ? b.priceMicro : b.priceRetail;
             return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
         });
     }

     return filtered;
   }, [initialProducts, search, selectedCategory, sortOrder, role]);

   return (
     <div className="w-full flex flex-col pb-24">
       
       {/* Full Width Category Banner */}
       {selectedCategory && CATEGORY_BANNERS[selectedCategory] && (
         <div className="w-full relative aspect-video overflow-hidden">
            <Image 
              src={CATEGORY_BANNERS[selectedCategory]} 
              alt={`${selectedCategory} Banner`} 
              fill 
              className="object-cover object-top brightness-[0.85]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 flex flex-col justify-end py-12">
               <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                 <h2 className="text-4xl md:text-6xl font-black text-white font-serif drop-shadow-lg uppercase tracking-tight">{selectedCategory}</h2>
               </div>
            </div>
         </div>
       )}

       {/* Main Layout Area */}
       <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 pt-8">
         {/* Filter Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 relative">
          <div className="sticky top-28 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-slate-800 font-serif">Filtros</h2>
                { (search || selectedCategory || sortOrder) && (
                   <button 
                      onClick={() => { setSearch(''); setSelectedCategory(null); setSortOrder(null); }}
                      className="text-xs font-bold text-[#E30613] hover:underline"
                   >
                     Limpiar
                   </button>
                )}
             </div>
             
             {/* Search */}
             <div className="mb-8">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Buscar Productor</label>
                <div className="relative">
                   <input 
                      type="text" 
                      placeholder="Ej. Tomate chonto..." 
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] transition-all bg-slate-50 font-medium"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                   />
                   <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
             </div>

             {/* Order By Price */}
             <div className="mb-8 border-t border-gray-100 pt-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Precio ({role})</label>
                <div className="flex gap-2">
                   <button 
                      onClick={() => setSortOrder(sortOrder === 'asc' ? null : 'asc')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${sortOrder === 'asc' ? 'border-[#E30613] bg-[#E30613]/5 text-[#E30613]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                   >
                     Menor a Mayor
                   </button>
                   <button 
                      onClick={() => setSortOrder(sortOrder === 'desc' ? null : 'desc')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${sortOrder === 'desc' ? 'border-[#E30613] bg-[#E30613]/5 text-[#E30613]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                   >
                     Mayor a Menor
                   </button>
                </div>
             </div>

             {/* Categories */}
             <div className="border-t border-gray-100 pt-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">Categorías</label>
                <div className="flex flex-col gap-1.5">
                   <button 
                      onClick={() => setSelectedCategory(null)}
                      className={`text-left text-sm py-2 px-3 rounded-lg transition-all font-medium ${selectedCategory === null ? 'bg-[#4CAF50] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                   >
                     Todos los productos
                   </button>
                   {CATEGORIES.map(cat => (
                      <button 
                         key={cat}
                         onClick={() => setSelectedCategory(cat)}
                         className={`text-left text-sm py-2 px-3 rounded-lg transition-all font-medium ${selectedCategory === cat ? 'bg-[#4CAF50] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                         {cat}
                      </button>
                   ))}
                </div>
             </div>

             {/* Phase 6 Delivery Integration Request */}
             <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="scale-90 origin-top-left w-[111%]"> {/* Scaling down slightly to perfectly fit sidebar width */}
                  <DeliveryScheduler />
                </div>
             </div>
          </div>
        </aside>

        {/* Dynamic Grid View */}
        <div className="flex-1 w-full">

           <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                 <h1 className="text-3xl lg:text-4xl font-black text-slate-800 font-serif leading-tight">
                   {selectedCategory ? selectedCategory : "Catálogo Fresco"}
                 </h1>
                 <p className="text-sm text-gray-500 mt-2 font-medium">Mostrando los precios especiales para tu nivel.</p>
              </div>
              <span className="text-sm font-bold bg-[#E30613]/10 text-[#E30613] px-4 py-2 rounded-full whitespace-nowrap self-start sm:self-auto">
                {filteredProducts.length} productos
              </span>
           </div>
           
           {filteredProducts.length === 0 ? (
              <div className="w-full bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                 <span className="text-7xl mb-6">🔍</span>
                 <h3 className="text-2xl font-black text-slate-800 mb-3">No hay coincidencias</h3>
                 <p className="text-gray-500 text-base max-w-sm mx-auto">No encontramos productos ajustados a tu búsqueda en esta categoría.</p>
                 <button onClick={() => { setSearch(''); setSelectedCategory(null); }} className="mt-8 bg-[#4CAF50] hover:bg-[#3d8c40] text-white px-8 py-3 rounded-full font-bold shadow-md transition-all hover:-translate-y-1">
                    Reiniciar filtros
                 </button>
              </div>
           ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                 ))}
              </div>
           )}
        </div>
      </div>
     </div>
   );
}
