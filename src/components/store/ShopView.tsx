'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product } from '@/src/actions/products';
import { CATEGORIES, SUBCATEGORIES } from '@/src/constants/productConstants';
import { ProductCard } from './ProductCard';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { useCart } from '@/src/contexts/CartContext';
import { CatalogImage } from './CatalogImage';
import { KitIngredientsList } from './KitIngredientsList';
import { normalizeCategory } from '@/src/lib/categories';
import { matchesCatalogSearch } from '@/src/lib/searchUtils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  SlidersHorizontal, 
  Sparkles, 
  ShoppingBag, 
  X,
  PackageCheck,
  ArrowUpDown,
  ListChecks,
  ArrowRight
} from 'lucide-react';

const CATEGORY_BANNERS: Record<string, string[]> = {
  'FRUTAS': ['/IMAGES/frutas-banner.jpeg', '/IMAGES/frutas-banner1.jpeg', '/IMAGES/frutas-banner2.jpeg', '/IMAGES/frutas-banner3.jpeg'],
  'VERDURAS Y HORTALIZAS': ['/IMAGES/verduras-banner1.jpeg', '/IMAGES/verduras-banner2.jpeg', '/IMAGES/verduras-banner3.jpeg', '/IMAGES/verduras-banner4.jpeg'],
  'CARNES X 500 GRAMOS': ['/IMAGES/carnes-banner1.jpeg', '/IMAGES/carnes-banner2.jpeg', '/IMAGES/carnes-banner3.jpeg', '/IMAGES/carnes-banner4.jpeg'],
};

const formatPrice = (price: number) => 
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

export default function ShopView({ initialProducts, trackInventory = false }: { initialProducts: Product[]; trackInventory?: boolean }) {
   const [search, setSearch] = useState('');
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);
   const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
   const [sortOrder, setSortOrder] = useState<'asc'|'desc'|null>(null);
   const [visibleCount, setVisibleCount] = useState(24);
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

   const hasDynamicKits = useMemo(() => initialProducts.some(p => p.isKit), [initialProducts]);

   const filteredProducts = useMemo(() => {
     const filtered = initialProducts.filter(p => {
         if (hasDynamicKits && p.id === 'prd_0255') return false;
         const matchSearch = matchesCatalogSearch(p, search);
         const matchCategory = selectedCategory ? normalizeCategory(p.category) === selectedCategory : true;
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
   }, [initialProducts, hasDynamicKits, search, selectedCategory, selectedSubcategory, sortOrder]);

   // Find active Kit Chévere options configured by admins (fallback to legacy presets only when none exist)
   const kitOptions = useMemo<Product[]>(() => {
     const dynamicKits = initialProducts.filter(p => p.isKit);
     if (dynamicKits.length > 0) {
       return dynamicKits.slice(0, 3);
     }

     const foundKits = initialProducts.filter(p => 
       p.category === 'Kits Negocios' || 
       p.id === 'prd_0255' || 
       p.name.toLowerCase().includes('kit chévere') || 
       p.name.toLowerCase().includes('kit chevere')
     );

     if (foundKits.length > 0) {
       return foundKits.slice(0, 3);
     }

     const p1 = role === 'Restaurantes' ? 45000 : role === 'Micromercados' ? 52000 : 59000;
     const p2 = role === 'Restaurantes' ? 62000 : role === 'Micromercados' ? 70000 : 79000;
     const p3 = role === 'Restaurantes' ? 95000 : role === 'Micromercados' ? 105000 : 120000;

     return [
       {
         id: 'prd_0255',
         name: 'Kit Chévere de la Semana',
         category: 'Kits Negocios',
         subcategory: null,
         unit: 'Combo Semanal',
         price: p1,
         previousPrice: p1 + 12000,
         stockQuantity: 999,
         isActive: true,
         isInSeason: true,
         imageUrl: '/IMAGES/kit-chevere-semana.jpg',
         description: 'Surtido premium rotativo de frutas, verduras y hortalizas frescas de alta calidad seleccionado directamente en las granjas de Santander. Máximo rendimiento y ahorro.'
       },
       {
         id: 'prd_kit_familiar',
         name: 'Kit Chévere Familiar Extra',
         category: 'Kits Negocios',
         subcategory: null,
         unit: 'Combo Familiar',
         price: p2,
         previousPrice: p2 + 15000,
         stockQuantity: 999,
         isActive: true,
         isInSeason: true,
         imageUrl: '/IMAGES/kit-chevere-semana2.jpeg',
         description: 'Mayor variedad y porciones familiares completas para toda la semana. Incluye pulpas, tubérculos y frutas de estación seleccionadas.'
       },
       {
         id: 'prd_kit_negocio',
         name: 'Kit Chévere Negocios & Restaurantes',
         category: 'Kits Negocios',
         subcategory: null,
         unit: 'Combo Mayorista',
         price: p3,
         previousPrice: p3 + 25000,
         stockQuantity: 999,
         isActive: true,
         isInSeason: true,
         imageUrl: '/IMAGES/kit-chevere-semana3.jpeg',
         description: 'Volumen y estandarización para cocinas comerciales, restaurantes y micromercados. Precios preferenciales de bulto cerrado garantizados.'
       }
     ];
   }, [initialProducts, role]);

   const [selectedKitIndex, setSelectedKitIndex] = useState(0);
   const [showKitIngredients, setShowKitIngredients] = useState(false);
   const safeKitIndex = selectedKitIndex < kitOptions.length ? selectedKitIndex : 0;
   const kitProduct = kitOptions[safeKitIndex] || kitOptions[0];
   const kitIngredients = kitProduct?.kitItems ?? [];

   const handleCategorySelect = (cat: string | null) => {
      const query = new URLSearchParams(searchParams?.toString());
      if (cat) query.set('category', cat); else query.delete('category');
      router.replace(query.size ? `/?${query}` : '/', { scroll: false });
      setSelectedSubcategory(null);
      setVisibleCount(24);
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
                   const isMiscelanea = cat === 'MISCELÁNEA';
                   const isSelected = selectedCategory === cat;
                   return (
                     <button 
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`whitespace-nowrap text-xs py-1.5 px-4 rounded-full transition-all font-bold border shrink-0 flex items-center gap-1.5 ${
                          isSelected 
                            ? isKits 
                              ? 'bg-amber-500 border-amber-500 text-white shadow-md ring-2 ring-amber-300' 
                              : isMiscelanea
                                ? 'bg-emerald-700 border-emerald-600 text-white shadow-md ring-2 ring-amber-300'
                                : 'bg-[#4CAF50] border-[#4CAF50] text-white shadow-md'
                            : isKits
                              ? 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold hover:bg-amber-100 shadow-sm'
                              : isMiscelanea
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-extrabold hover:bg-emerald-100 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm'
                        }`}
                     >
                        {isKits && <span>🧺</span>}
                        {isMiscelanea && <span>🎄</span>}
                        <span>{isMiscelanea ? 'La Tiendita (Miscelánea)' : cat}</span>
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
                     onChange={e => { setSearch(e.target.value); setVisibleCount(24); }}
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
       <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6 lg:gap-8 pt-4 sm:pt-8">
         
         {/* Filter Sidebar (Desktop Only — Mobile uses sticky categories & magnifying glass search) */}
         {desktopSidebarOpen && (
           <aside className="hidden lg:block lg:w-72 flex-shrink-0 relative transition-all duration-300">
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
                         onChange={(e) => { setSearch(e.target.value); setVisibleCount(24); }}
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

            {/* KITS NEGOCIOS & KIT CHÉVERE PROMINENT SHOWCASE SECTION */}
            <section 
              aria-label="Kits de Negocios y Combos Promocionales"
              className="mb-6 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-4 sm:p-8 text-white shadow-xl relative border border-amber-500/30"
            >
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              
              {/* Option Selector Pills (Up to 3 Active Options) */}
              {kitOptions.length > 1 && (
                <div className="relative z-10 flex overflow-x-auto no-scrollbar items-center gap-2 mb-3.5 sm:mb-5 pb-3 border-b border-white/10">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300/80 mr-1 flex items-center gap-1 shrink-0">
                    <Sparkles size={13} className="text-amber-400" />
                    <span className="hidden sm:inline">Opciones de Kit:</span>
                  </span>
                  {kitOptions.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedKitIndex(idx)}
                      className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                        safeKitIndex === idx 
                          ? 'bg-amber-400 text-slate-950 shadow-md' 
                          : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10'
                      }`}
                    >
                      <span>{opt.name}</span>
                      <span className="opacity-80">({formatPrice(opt.price)})</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8 justify-between">
                <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3 text-left">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300 border border-amber-400/40">
                    <Sparkles size={12} className="text-amber-300" />
                    <span>Kit Chévere de la Semana</span>
                    {kitOptions.length > 1 && (
                      <span className="text-amber-200/80">· Opción {safeKitIndex + 1} de {kitOptions.length}</span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight text-white leading-tight">
                    {kitProduct.name} 🧺
                  </h2>
                  <p className="max-w-xl text-xs sm:text-sm text-slate-300 leading-snug">
                    {kitProduct.description || 'La combinación perfecta de frutas, hortalizas y verduras frescas seleccionadas a mano en Santander.'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400">
                        {formatPrice(kitProduct.price)}
                      </span>
                      {kitProduct.previousPrice && kitProduct.previousPrice > kitProduct.price && (
                        <span className="text-[11px] sm:text-xs text-slate-400 line-through">
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
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-white shadow-lg shadow-red-900/40 transition-all hover:bg-red-700 active:scale-95"
                    >
                      <ShoppingBag size={14} />
                      <span>¡Pedir Kit!</span>
                    </button>
                    {kitIngredients.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowKitIngredients(prev => !prev)}
                        aria-expanded={showKitIngredients}
                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-400/15 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-400/25 transition-colors"
                      >
                        <ListChecks size={14} />
                        <span>{showKitIngredients ? 'Ocultar ingredientes' : `Ver ingredientes (${kitIngredients.length})`}</span>
                        {showKitIngredients ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('KITS NEGOCIOS')}
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                    >
                      <PackageCheck size={14} />
                      <span>Ver Todos ({kitOptions.length})</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {kitIngredients.length > 0 && !showKitIngredients && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      {kitIngredients.slice(0, 5).map(item => (
                        <span
                          key={`${item.productId}-${item.name}`}
                          className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-200"
                        >
                          <span className="truncate max-w-[140px]">{item.name}</span>
                          <span className="text-amber-300 font-bold">×{Number.isInteger(item.quantity) ? item.quantity : item.quantity}</span>
                        </span>
                      ))}
                      {kitIngredients.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setShowKitIngredients(true)}
                          className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 px-1"
                        >
                          +{kitIngredients.length - 5} más · ver lista completa
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative w-full lg:w-[48%] xl:w-[50%] aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/30 bg-slate-950/60 shrink-0 group">
                  <CatalogImage
                    src={kitProduct.imageUrl || '/IMAGES/kit-chevere-semana.jpg'}
                    alt={kitProduct.name}
                    fill
                    sizes="(max-width: 1023px) 100vw, 560px"
                    className="object-contain group-hover:scale-[1.02] transition-transform duration-500"
                    priority
                  />
                </div>
              </div>

              {showKitIngredients && kitIngredients.length > 0 && (
                <div className="relative z-10 mt-5 pt-5 border-t border-white/15">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                      <ListChecks size={15} />
                      <span>Productos incluidos en {kitProduct.name} ({kitIngredients.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowKitIngredients(false)}
                      className="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      Cerrar lista
                    </button>
                  </div>
                  <KitIngredientsList items={kitIngredients} theme="dark" maxHeightClass="max-h-80" />
                </div>
              )}

              {/* Bottom Mini Cards for Quick Option Switch & 1-Click Add (Desktop/Tablet only to keep Mobile compact) */}
              {kitOptions.length > 1 && (
                <div className="hidden sm:grid relative z-10 grid-cols-3 gap-3 pt-5 mt-5 border-t border-white/10">
                  {kitOptions.map((opt, idx) => (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedKitIndex(idx)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        safeKitIndex === idx 
                          ? 'bg-amber-400/20 border-amber-400 shadow-md ring-1 ring-amber-400' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="relative h-12 w-20 rounded-xl overflow-hidden shrink-0 bg-slate-900">
                        <CatalogImage src={opt.imageUrl || '/IMAGES/kit-chevere-semana.jpg'} alt={opt.name} fill className="object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">Opción {idx + 1}: {opt.name}</p>
                        <p className="text-xs font-black text-amber-400">{formatPrice(opt.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(opt, 1);
                          setIsCartOpen(true);
                        }}
                        className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shrink-0 transition-all hover:scale-110 active:scale-95 shadow-sm"
                        title={`Agregar ${opt.name} al carrito`}
                        aria-label={`Pedir ${opt.name}`}
                      >
                        <ShoppingBag size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Christmas Spotlight Callout to La Tiendita Navideña */}
            {(!selectedCategory || selectedCategory === 'MISCELÁNEA') && (
              <Link
                href="/tiendita"
                className="mb-8 block rounded-3xl bg-gradient-to-r from-amber-50/90 via-white to-emerald-50/90 border-2 border-emerald-500 p-5 sm:p-6 shadow-md hover:shadow-xl hover:border-emerald-600 transition-all group overflow-hidden relative"
              >
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl sm:text-4xl p-2.5 bg-white rounded-2xl border-2 border-emerald-400 shadow-sm">
                      🎄
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          Nueva Colección Navideña 2026
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                          Edición Limitada
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 font-serif mt-1">
                        La Tiendita de La Gaviota: Cojines Navideños Premium
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Cojines de lujo 45x45 cm en terciopelo suave con relleno siliconado. Diseños de Pesebre, Papá Noel y Duendecillos desde <span className="font-extrabold text-emerald-700">$40.000 COP</span>.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700 group-hover:text-emerald-800 bg-white border border-emerald-300 px-4 py-2 rounded-full shadow-sm group-hover:bg-emerald-50">
                    <span>Ver Colección Completa</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            )}

            {/* Catalog Header + Quick Sort right above Product Grid */}
            <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
               <div>
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-800 font-serif leading-tight break-words">
                    {selectedSubcategory ? selectedSubcategory : selectedCategory ? selectedCategory : "Catálogo Fresco"}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">Directo del campo de Santander a tu mesa.</p>
               </div>
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc')}
                   className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                     sortOrder
                       ? 'bg-red-50 border-red-200 text-red-700'
                       : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                   }`}
                 >
                   <ArrowUpDown size={13} />
                   <span>{sortOrder === 'asc' ? 'Precio: Menor a Mayor' : sortOrder === 'desc' ? 'Precio: Mayor a Menor' : 'Ordenar precio'}</span>
                 </button>
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
                 <span className="text-xs sm:text-sm font-bold bg-[#E30613]/10 text-[#E30613] px-3 sm:px-4 py-1.5 rounded-full whitespace-nowrap">
                   {filteredProducts.length} prod.
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
                <>
                  <div className={`grid gap-3 sm:gap-4 lg:gap-5 ${
                    desktopSidebarOpen 
                      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                  }`}>
                     {filteredProducts.slice(0, visibleCount).map(product => (
                        <ProductCard key={product.id} product={product} trackInventory={trackInventory} />
                     ))}
                  </div>

                  {visibleCount < filteredProducts.length && (
                     <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                           type="button"
                           onClick={() => setVisibleCount(c => c + 24)}
                           className="w-full sm:w-auto px-8 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.99]"
                        >
                           Cargar más productos ({Math.min(visibleCount, filteredProducts.length)} de {filteredProducts.length})
                        </button>
                        <button
                           type="button"
                           onClick={() => setVisibleCount(filteredProducts.length)}
                           className="text-xs text-slate-500 hover:text-slate-800 font-bold underline py-2 px-3"
                        >
                           Ver todos ({filteredProducts.length})
                        </button>
                     </div>
                  )}
                </>
            )}

            {/* Customer Tiers Identification & Partnership Banner (Bottom of Catalog) */}
            <div className="mt-10 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
         </div>
       </div>
     </div>
   );
}
