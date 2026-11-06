'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product } from '@/src/actions/products';
import { CATEGORIES, SUBCATEGORIES } from '@/src/constants/productConstants';
import { ProductCard } from './ProductCard';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { useCart } from '@/src/contexts/CartContext';
import { CatalogImage } from './CatalogImage';
import { normalizeCategory } from '@/src/lib/categories';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  Sparkles, 
  ShoppingBag, 
  X,
  PackageCheck
} from 'lucide-react';
import { DeliveryScheduler } from '@/src/components/checkout/DeliveryScheduler';

const CATEGORY_BANNERS: Record<string, string[]> = {
  'FRUTAS': ['/IMAGES/frutas-banner.jpeg', '/IMAGES/frutas-banner1.jpeg', '/IMAGES/frutas-banner2.jpeg', '/IMAGES/frutas-banner3.jpeg'],
  'VERDURAS Y HORTALIZAS': ['/IMAGES/verduras-banner1.jpeg', '/IMAGES/verduras-banner2.jpeg', '/IMAGES/verduras-banner3.jpeg', '/IMAGES/verduras-banner4.jpeg'],
  'CARNES X 500 GRAMOS': ['/IMAGES/carnes-banner1.jpeg', '/IMAGES/carnes-banner2.jpeg', '/IMAGES/carnes-banner3.jpeg', '/IMAGES/carnes-banner4.jpeg'],
};

const formatPrice = (price: number) => 
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

export default function ShopView({ initialProducts }: { initialProducts: Product[] }) {
   const [search, setSearch] = useState('');
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
   const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
   const [sortOrder, setSortOrder] = useState<'asc'|'desc'|null>(null);
   const { role } = useUserRole();
   const { addToCart, setIsCartOpen } = useCart();
   const searchParams = useSearchParams();
   const router = useRouter();
   const selectedCategory = normalizeCategory(searchParams?.get('category'));
   const [toastDismissed, setToastDismissed] = useState(false);
   const showToast = searchParams?.get('error') === 'unauthorized-tier' && !toastDismissed;
   const [bannerIndex, setBannerIndex] = useState(0);
   const stickySearchInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
     const interval = setInterval(() => {
       setBannerIndex(prev => prev + 1);
     }, 4000);
     return () => clearInterval(interval);
   }, []);

   useEffect(() => {
     if (showToast) {
       const timer = setTimeout(() => setToastDismissed(true), 8000);
       return () => clearTimeout(timer);
     }
   }, [showToast]);

   // Focus search input when activated from magnifying glass
   useEffect(() => {
     if (isSearchOpen) {
       stickySearchInputRef.current?.focus();
     }
   }, [isSearchOpen]);

   const filteredProducts = useMemo(() => {
     const filtered = initialProducts.filter(p => {
         const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
         const matchCategory = selectedCategory ? p.category === selectedCategory : true;
         const validSubcategory = selectedCategory && SUBCATEGORIES[selectedCategory]?.includes(selectedSubcategory ?? '') ? selectedSubcategory : null;
         const matchSubcategory = validSubcategory ? p.subcategory === validSubcategory : true;
         return matchSearch && matchCategory && matchSubcategory;
      });

     if (sortOrder) {
         filtered.sort((a, b) => {
             const priceA = a.price;
             const priceB = b.price;
             return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
         });
     }

     return filtered;
   }, [initialProducts, search, selectedCategory, selectedSubcategory, sortOrder]);

   // Find or construct the Featured Kit Chévere
   const kitProduct = useMemo<Product>(() => {
     const found = initialProducts.find(p => 
       p.id === 'prd_0255' || 
       p.name.toLowerCase().includes('kit chévere') || 
       p.name.toLowerCase().includes('kit chevere') ||
       p.category === 'Kits Negocios'
     );
     if (found) return found;

     const defaultPrice = role === 'Restaurantes' ? 45000 : role === 'Micromercados' ? 52000 : 59000;
     return {
       id: 'prd_0255',
       name: 'Kit Chévere de la Semana',
       category: 'Kits Negocios',
       subcategory: null,
       unit: 'Combo Semanal',
       price: defaultPrice,
       previousPrice: defaultPrice + 12000,
       stockQuantity: 999,
       isActive: true,
       isInSeason: true,
       imageUrl: '/IMAGES/kit-chevere-semana.jpg',
       description: 'Surtido premium rotativo de frutas, verduras y hortalizas frescas de alta calidad seleccionado directamente en las granjas de Santander. Máximo rendimiento y ahorro.'
     };
   }, [initialProducts, role]);

   const handleCategorySelect = (cat: string | null) => {
      const query = new URLSearchParams(searchParams?.toString());
      if (cat) query.set('category', cat); else query.delete('category');
      router.replace(query.size ? `/?${query}` : '/', { scroll: false });
      setSelectedSubcategory(null);
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
             <button onClick={() => setToastDismissed(true)} className="text-gray-400 hover:text-white">✕</button>
           </div>
         </div>
       )}

       {/* Full Width Category Banner */}
       {selectedCategory && CATEGORY_BANNERS[selectedCategory] && CATEGORY_BANNERS[selectedCategory].length > 0 && (
         <div className="w-full relative aspect-video overflow-hidden">
            <CatalogImage
              src={CATEGORY_BANNERS[selectedCategory][bannerIndex % CATEGORY_BANNERS[selectedCategory].length]} 
              alt={`${selectedCategory} Banner`} 
              fill 
              className="object-cover object-top transition-all duration-1000 ease-in-out"
              priority
            />
            <div className="absolute inset-0 z-10 flex flex-col justify-end py-5 sm:py-12">
               <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                 <h2 className="text-2xl sm:text-4xl md:text-6xl font-black text-white font-serif drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] uppercase tracking-tight">{selectedCategory}</h2>
               </div>
            </div>
         </div>
       )}

       {/* Categories Quick Filter Desktop & Sticky Bar */}
       <div className="sticky top-[80px] z-40 bg-white/95 backdrop-blur-md py-2.5 shadow-sm border-b border-gray-100">
           <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
             
             {/* Desktop Sidebar Toggle Arrow */}
             <button
               type="button"
               onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
               className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all shrink-0"
               title={desktopSidebarOpen ? 'Ocultar barra lateral de filtros' : 'Mostrar barra lateral de filtros'}
             >
               {desktopSidebarOpen ? (
                 <>
                   <ChevronLeft size={15} className="text-red-600" />
                   <span>Ocultar filtros</span>
                 </>
               ) : (
                 <>
                   <SlidersHorizontal size={14} className="text-emerald-600" />
                   <span>Mostrar filtros</span>
                   <ChevronRight size={15} className="text-emerald-600" />
                 </>
               )}
             </button>

             {/* Categories Scroll Pills */}
             <div className="flex-1 flex flex-row overflow-x-auto no-scrollbar gap-2 py-0.5 items-center">
                 <button 
                    onClick={() => handleCategorySelect(null)}
                    className={`whitespace-nowrap text-xs py-1.5 px-4 rounded-full transition-all font-bold border shrink-0 ${selectedCategory === null ? 'bg-[#4CAF50] border-[#4CAF50] text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'}`}
                 >
                   Todos
                 </button>
                 {CATEGORIES.map(cat => {
                   const isKits = cat === 'KITS NEGOCIOS';
                   const isSelected = selectedCategory === cat;
                   return (
                     <button 
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`whitespace-nowrap text-xs py-1.5 px-4 rounded-full transition-all font-bold border shrink-0 flex items-center gap-1.5 ${
                          isSelected 
                            ? isKits 
                              ? 'bg-amber-500 border-amber-500 text-white shadow-md ring-2 ring-amber-300' 
                              : 'bg-[#4CAF50] border-[#4CAF50] text-white shadow-md'
                            : isKits
                              ? 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold hover:bg-amber-100 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'
                        }`}
                     >
                        {isKits && <span>🧺</span>}
                        <span>{cat}</span>
                     </button>
                   );
                 })}
             </div>

             {/* Always-Visible Magnifying Glass (Search Toggle & Input) */}
             <div className="flex items-center shrink-0">
               {isSearchOpen ? (
                 <div className="flex items-center gap-1.5 bg-white border border-red-500 rounded-full pl-3 pr-1 py-1 shadow-md animate-in fade-in duration-200">
                   <Search size={14} className="text-red-600 shrink-0" />
                   <input
                     ref={stickySearchInputRef}
                     type="search"
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                     placeholder="Buscar fruta, verdura..."
                     className="w-32 sm:w-48 text-xs bg-transparent outline-none text-slate-800 font-medium"
                   />
                   <button
                     type="button"
                     onClick={() => { setIsSearchOpen(false); setSearch(''); }}
                     className="h-6 w-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                     aria-label="Cerrar búsqueda"
                   >
                     <X size={14} />
                   </button>
                 </div>
               ) : (
                 <button
                   type="button"
                   onClick={() => setIsSearchOpen(true)}
                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 shadow-sm transition-all"
                   title="Buscar producto en la tienda"
                   aria-label="Activar barra de búsqueda"
                 >
                   <Search size={15} className="text-red-600" />
                   <span className="hidden sm:inline">Buscar</span>
                 </button>
               )}
             </div>

           </div>

           {/* Subcategories bar */}
           {selectedCategory && SUBCATEGORIES[selectedCategory] && SUBCATEGORIES[selectedCategory].length > 0 && (
             <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-2 pb-1 border-t border-gray-100 mt-1 flex flex-row overflow-x-auto no-scrollbar gap-2">
               <button 
                  onClick={() => setSelectedSubcategory(null)}
                  className={`whitespace-nowrap text-[11px] py-1 px-3 rounded-full transition-all font-bold border shrink-0 ${selectedSubcategory === null ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-500 hover:bg-slate-100'}`}
               >
                 Todo en {selectedCategory}
               </button>
               {SUBCATEGORIES[selectedCategory].map(sub => (
                  <button 
                     key={sub}
                     onClick={() => setSelectedSubcategory(sub)}
                     className={`whitespace-nowrap text-[11px] py-1 px-3 rounded-full transition-all font-bold border shrink-0 ${selectedSubcategory === sub ? 'bg-slate-800 border-slate-800 text-white' : 'bg-slate-50 border-gray-200 text-gray-500 hover:bg-slate-100'}`}
                  >
                     {sub}
                  </button>
               ))}
             </div>
           )}
       </div>

       {/* Main Layout Area */}
       <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 pt-8">
         
         {/* Filter Sidebar (Collapsible on Desktop) */}
         {desktopSidebarOpen && (
           <aside className="w-full lg:w-72 flex-shrink-0 relative transition-all duration-300">
             <div className="sticky top-28 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-2">
                     <h2 className="font-bold text-xl text-slate-800 font-serif">Filtros</h2>
                     <button
                       type="button"
                       onClick={() => setDesktopSidebarOpen(false)}
                       className="hidden lg:flex items-center justify-center h-7 w-7 rounded-full text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                       title="Colapsar panel lateral"
                       aria-label="Colapsar barra lateral"
                     >
                       <ChevronLeft size={18} />
                     </button>
                   </div>
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
                   <label htmlFor="catalog-search" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Buscar producto</label>
                   <div className="relative">
                      <input 
                         id="catalog-search" type="search"
                         placeholder="Ej. Tomate chonto..." 
                         className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] transition-all bg-slate-50 font-medium"
                         value={search}
                         onChange={(e) => setSearch(e.target.value)}
                      />
                      <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
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
         )}

         {/* Dynamic Grid View */}
         <div className="min-w-0 flex-1 w-full flex flex-col">

            {/* Phase 6 Delivery Integration Request */}
            <div className="mb-6 w-full">
              <DeliveryScheduler />
            </div>

            {/* Customer Tiers Identification & Partnership Banner */}
            <div className="mb-6 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
               <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                     <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Nivel de Cliente Activo:</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-extrabold ${
                           role === 'Restaurantes'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : role === 'Micromercados'
                                 ? 'border-amber-300 bg-amber-50 text-amber-800'
                                 : 'border-slate-300 bg-slate-100 text-slate-800'
                        }`}>
                           {role === 'Restaurantes' ? '👨‍🍳 Mayorista · Restaurantes (Pedido mín. $300.000)' : role === 'Micromercados' ? '🏪 Mayorista · Micromercados (Pedido mín. $150.000)' : '🏠 Personas Naturales · Detal (Envío gratis desde $50.000)'}
                        </span>
                     </div>
                     <p className="mt-1.5 text-xs text-slate-600">
                        {role === 'Personas Naturales'
                           ? 'Estás viendo precios al detal para hogar. ¿Tienes un restaurante o micromercado? Aplica a tarifas mayoristas verificadas.'
                           : `Estás comprando con tarifa preferencial verificada para ${role}.`}
                     </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                     {role === 'Personas Naturales' ? (
                        <a href="/aplicar-negocio" className="whitespace-nowrap rounded-full bg-slate-900 px-5 py-2.5 text-xs font-black text-[#FFCC00] shadow-sm transition-colors hover:bg-slate-800">
                           Solicitar Tarifa Mayorista
                        </a>
                     ) : (
                        <a href="/dashboard" className="whitespace-nowrap rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-emerald-800">
                           Ir a Mi Portal B2B
                        </a>
                     )}
                  </div>
               </div>
            </div>

            {/* KITS NEGOCIOS & KIT CHÉVERE PROMINENT SHOWCASE SECTION */}
            <section 
              aria-label="Kits de Negocios y Combos Promocionales"
              className="mb-8 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 sm:p-8 text-white shadow-xl relative border border-amber-500/30"
            >
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 justify-between">
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-300 border border-amber-400/40">
                    <Sparkles size={14} className="text-amber-300" />
                    <span>Sección Destacada · Kits Negocios</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight text-white leading-tight">
                    Kit Chévere de la Semana 🧺
                  </h2>
                  <p className="max-w-xl text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {kitProduct.description || 'La combinación perfecta de frutas, hortalizas y verduras frescas seleccionadas a mano. Precio especial cerrado para alta rentabilidad de tu negocio o abastecimiento de hogar.'}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 pt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400">
                        {formatPrice(kitProduct.price)}
                      </span>
                      {kitProduct.previousPrice && kitProduct.previousPrice > kitProduct.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatPrice(kitProduct.previousPrice)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(kitProduct, 1);
                        setIsCartOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-xs sm:text-sm font-black text-white shadow-lg shadow-red-900/40 transition-all hover:bg-red-700 hover:scale-105 active:scale-95"
                    >
                      <ShoppingBag size={16} />
                      <span>¡Pedir Kit Chévere!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('KITS NEGOCIOS')}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                    >
                      <PackageCheck size={14} />
                      <span>Ver Kits Negocios</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="relative w-48 sm:w-60 md:w-64 aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/30 shrink-0 group">
                  <CatalogImage
                    src={kitProduct.imageUrl || '/IMAGES/kit-chevere-semana.jpg'}
                    alt={kitProduct.name}
                    fill
                    sizes="(max-width: 768px) 200px, 280px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-900 uppercase">
                    ⭐ Lo más vendido
                  </span>
                </div>
              </div>
            </section>

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 font-serif leading-tight break-words">
                    {selectedSubcategory ? selectedSubcategory : selectedCategory ? selectedCategory : "Catálogo Fresco"}
                  </h1>
                  <p className="text-sm text-gray-500 mt-2 font-medium">Precios estimados. Confirma disponibilidad y total al finalizar.</p>
               </div>
               <div className="flex items-center gap-2 self-start sm:self-auto">
                 {!desktopSidebarOpen && (
                   <button
                     type="button"
                     onClick={() => setDesktopSidebarOpen(true)}
                     className="hidden lg:inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors"
                   >
                     <SlidersHorizontal size={13} />
                     <span>Mostrar filtros</span>
                   </button>
                 )}
                 <span className="text-sm font-bold bg-[#E30613]/10 text-[#E30613] px-4 py-2 rounded-full whitespace-nowrap">
                   {filteredProducts.length} productos
                 </span>
               </div>
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
                <div className={`grid gap-3 sm:gap-4 lg:gap-5 ${
                  desktopSidebarOpen 
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                }`}>
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
