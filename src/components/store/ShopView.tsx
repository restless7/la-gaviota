'use client';

import React, { useState, useMemo } from 'react';
import { Product } from '@/src/actions/products';
import { CATEGORIES, SUBCATEGORIES } from '@/src/constants/productConstants';
import { ProductCard } from './ProductCard';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState as useStateReact } from 'react';

const CATEGORY_BANNERS: Record<string, string[]> = {
  'FRUTAS': ['/IMAGES/frutas-banner.jpeg', '/IMAGES/frutas-banner1.jpeg', '/IMAGES/frutas-banner2.jpeg', '/IMAGES/frutas-banner3.jpeg'],
  'VERDURAS Y HORTALIZAS': ['/IMAGES/verduras-banner1.jpeg', '/IMAGES/verduras-banner2.jpeg', '/IMAGES/verduras-banner3.jpeg', '/IMAGES/verduras-banner4.jpeg'],
  'CARNES X 500 GRAMOS': ['/IMAGES/carnes-banner1.jpeg', '/IMAGES/carnes-banner2.jpeg', '/IMAGES/carnes-banner3.jpeg', '/IMAGES/carnes-banner4.jpeg'],
};
import { DeliveryScheduler } from '@/src/components/checkout/DeliveryScheduler';

export default function ShopView({ initialProducts }: { initialProducts: Product[] }) {
   const [search, setSearch] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
   const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
   const [sortOrder, setSortOrder] = useState<'asc'|'desc'|null>(null);
   const { role } = useUserRole();
   const searchParams = useSearchParams();
   const [showToast, setShowToast] = useState(false);
   const [bannerIndex, setBannerIndex] = useState(0);

   useEffect(() => {
     const interval = setInterval(() => {
       setBannerIndex(prev => prev + 1);
     }, 4000);
     return () => clearInterval(interval);
   }, []);

   useEffect(() => {
     if (searchParams?.get('error') === 'unauthorized-tier') {
       setShowToast(true);
       const timer = setTimeout(() => setShowToast(false), 8000);
       return () => clearTimeout(timer);
     }
     
     const urlCategory = searchParams?.get('category');
     if (urlCategory && CATEGORIES.includes(urlCategory)) {
       setSelectedCategory(urlCategory);
     }
   }, [searchParams]);

   const filteredProducts = useMemo(() => {
     const filtered = initialProducts.filter(p => {
         const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
         const matchCategory = selectedCategory ? p.category === selectedCategory : true;
         const matchSubcategory = selectedSubcategory ? p.subcategory === selectedSubcategory : true;
         return matchSearch && matchCategory && matchSubcategory;
      });

     if (sortOrder) {
         filtered.sort((a, b) => {
             const priceA = role === 'Restaurantes' ? a.priceRestaurant : role === 'Micromercados' ? a.priceMicro : a.priceRetail;
             const priceB = role === 'Restaurantes' ? b.priceRestaurant : role === 'Micromercados' ? b.priceMicro : b.priceRetail;
             return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
         });
     }

     return filtered;
   }, [initialProducts, search, selectedCategory, selectedSubcategory, sortOrder, role]);

   const handleCategorySelect = (cat: string | null) => {
      setSelectedCategory(cat);
      setSelectedSubcategory(null); // Reset subcategory when category changes
   };

   return (
     <div className="w-full flex flex-col pb-24 relative">
       
       {/* Unauthorized Toast */}
       {showToast && (
         <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
           <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-4 max-w-sm">
             <div className="text-[#FFCC00] mt-0.5">⚠️</div>
             <div className="flex-1">
               <h4 className="font-bold mb-1">Acceso Denegado</h4>
               <p className="text-sm text-gray-300 leading-tight">Esta sección es exclusiva para comercios verificados. Si tienes un negocio, solicita tus precios mayoristas en tu perfil.</p>
             </div>
             <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-white">✕</button>
           </div>
         </div>
       )}

       {/* Full Width Category Banner */}
       {selectedCategory && CATEGORY_BANNERS[selectedCategory] && CATEGORY_BANNERS[selectedCategory].length > 0 && (
         <div className="w-full relative aspect-video overflow-hidden">
            <Image 
              src={CATEGORY_BANNERS[selectedCategory][bannerIndex % CATEGORY_BANNERS[selectedCategory].length]} 
              alt={`${selectedCategory} Banner`} 
              fill 
              className="object-cover object-top transition-all duration-1000 ease-in-out"
              priority
            />
            <div className="absolute inset-0 z-10 flex flex-col justify-end py-12">
               <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                 <h2 className="text-4xl md:text-6xl font-black text-white font-serif drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] uppercase tracking-tight">{selectedCategory}</h2>
               </div>
            </div>
         </div>
       )}

       {/* Categories Quick Filter Desktop Only (since mobile has hamburger) */}
       <div className="hidden lg:block sticky top-[80px] z-40 bg-white/95 backdrop-blur-md py-3 shadow-sm border-b border-gray-100">
           <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
             <div className="flex flex-row overflow-x-auto no-scrollbar gap-2 pb-1">
                 <button 
                    onClick={() => handleCategorySelect(null)}
                    className={`whitespace-nowrap text-xs py-1.5 px-4 rounded-full transition-all font-bold border ${selectedCategory === null ? 'bg-[#4CAF50] border-[#4CAF50] text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 shadow-sm'}`}
                 >
                   Todos
                 </button>
                 {CATEGORIES.map(cat => (
                    <button 
                       key={cat}
                       onClick={() => handleCategorySelect(cat)}
                       className={`whitespace-nowrap text-xs py-1.5 px-4 rounded-full transition-all font-bold border ${selectedCategory === cat ? 'bg-[#4CAF50] border-[#4CAF50] text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 shadow-sm'}`}
                    >
                       {cat}
                    </button>
                 ))}
             </div>
             {selectedCategory && SUBCATEGORIES[selectedCategory] && SUBCATEGORIES[selectedCategory].length > 0 && (
               <div className="flex flex-row overflow-x-auto no-scrollbar gap-2 pt-2 pb-1 border-t border-gray-100 mt-1">
                 <button 
                    onClick={() => setSelectedSubcategory(null)}
                    className={`whitespace-nowrap text-[11px] py-1 px-3 rounded-full transition-all font-bold border ${selectedSubcategory === null ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-500 hover:bg-slate-100'}`}
                 >
                   Todo en {selectedCategory}
                 </button>
                 {SUBCATEGORIES[selectedCategory].map(sub => (
                    <button 
                       key={sub}
                       onClick={() => setSelectedSubcategory(sub)}
                       className={`whitespace-nowrap text-[11px] py-1 px-3 rounded-full transition-all font-bold border ${selectedSubcategory === sub ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-500 hover:bg-slate-100'}`}
                    >
                       {sub}
                    </button>
                 ))}
               </div>
             )}
           </div>
       </div>

       {/* Main Layout Area */}
       <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 pt-8">
         {/* Filter Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 relative">
          <div className="sticky top-28 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 max-h-[calc(100vh-8rem)] overflow-y-auto">
             <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-slate-800 font-serif">Filtros</h2>
                { (search || selectedCategory || sortOrder || selectedSubcategory) && (
                   <button 
                      onClick={() => { setSearch(''); handleCategorySelect(null); setSortOrder(null); }}
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

             {/* Categories (Desktop only) */}
             <div className="hidden lg:block mb-8 border-t border-gray-100 pt-6">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">Categorías</label>
                <div className="flex flex-col gap-1.5">
                   <button 
                      onClick={() => handleCategorySelect(null)}
                      className={`text-left text-sm py-2 px-3 rounded-lg transition-all font-medium border-transparent border ${selectedCategory === null ? 'bg-[#4CAF50] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
                   >
                     Todos los productos
                   </button>
                   {CATEGORIES.map(cat => (
                      <button 
                         key={cat}
                         onClick={() => handleCategorySelect(cat)}
                         className={`text-left text-sm py-2 px-3 rounded-lg transition-all font-medium border-transparent border ${selectedCategory === cat ? 'bg-[#4CAF50] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
                      >
                         {cat}
                      </button>
                   ))}
                </div>
             </div>

             {/* Subcategories (Desktop only) */}
             {selectedCategory && SUBCATEGORIES[selectedCategory] && SUBCATEGORIES[selectedCategory].length > 0 && (
                <div className="hidden lg:block mb-8 border-t border-gray-100 pt-6">
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">Subcategorías</label>
                   <div className="flex flex-col gap-1.5">
                      <button 
                         onClick={() => setSelectedSubcategory(null)}
                         className={`text-left text-sm py-1.5 px-3 rounded-lg transition-all font-medium border-transparent border ${selectedSubcategory === null ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:bg-slate-50 border-transparent hover:border-gray-200'}`}
                      >
                        Todo en {selectedCategory}
                      </button>
                      {SUBCATEGORIES[selectedCategory].map(sub => (
                         <button 
                            key={sub}
                            onClick={() => setSelectedSubcategory(sub)}
                            className={`text-left text-sm py-1.5 px-3 rounded-lg transition-all font-medium border-transparent border ${selectedSubcategory === sub ? 'bg-slate-800 text-white shadow-sm' : 'text-gray-500 hover:bg-slate-50 border-transparent hover:border-gray-200'}`}
                         >
                            {sub}
                         </button>
                      ))}
                   </div>
                </div>
             )}

           </div>
        </aside>

        {/* Dynamic Grid View */}
        <div className="flex-1 w-full flex flex-col">

           {/* Phase 6 Delivery Integration Request - Moved to top of grid for horizontal spread */}
           <div className="mb-6 w-full">
             <DeliveryScheduler />
           </div>

           {/* Subtle Partnership Banner */}
           <div className="mb-6 w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                 <h4 className="text-sm font-bold text-slate-800">¿Compras grandes volúmenes para tu negocio?</h4>
                 <p className="text-xs text-gray-500 mt-0.5">Aplica a nuestro programa de aliados y obtén tarifas mayoristas exclusivas.</p>
              </div>
              <a href="/aplicar-negocio" className="text-xs font-black text-white bg-slate-800 hover:bg-slate-900 px-5 py-2.5 rounded-full shadow-sm transition-colors whitespace-nowrap">
                 Aplicar para Negocio
              </a>
           </div>

           <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                 <h1 className="text-3xl lg:text-4xl font-black text-slate-800 font-serif leading-tight">
                   {selectedSubcategory ? selectedSubcategory : selectedCategory ? selectedCategory : "Catálogo Fresco"}
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
                 <button onClick={() => { setSearch(''); handleCategorySelect(null); }} className="mt-8 bg-[#4CAF50] hover:bg-[#3d8c40] text-white px-8 py-3 rounded-full font-bold shadow-md transition-all hover:-translate-y-1">
                    Reiniciar filtros
                 </button>
              </div>
           ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
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
