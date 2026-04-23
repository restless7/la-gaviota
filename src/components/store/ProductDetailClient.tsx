'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/src/data/products';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { useCart } from '@/src/contexts/CartContext';
import { ProductCard } from './ProductCard';

export default function ProductDetailClient({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
   const { role } = useUserRole();
   const { addToCart } = useCart();
   const [qty, setQty] = useState(1);
   const [activeTab, setActiveTab] = useState('info'); // info, nutrition, reviews

   const activePrice = role === 'Restaurantes' ? product.priceRestaurant : role === 'Micromercados' ? product.priceMicro : product.priceRetail;

   const formatPrice = (price: number) => {
     return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
   };

   return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-16">
         
         <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
            {/* Image Gallery */}
            <div className="w-full md:w-1/2">
               <div className="aspect-square w-full relative bg-slate-100 rounded-3xl overflow-hidden border border-gray-100 flex items-center justify-center">
                  <Image 
                     src={`/IMAGES/product-display.jpeg`}
                     alt={product.name}
                     fill
                     className="object-cover mix-blend-multiply"
                     priority
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#4CAF50] shadow-sm uppercase tracking-wide">
                     100% Fresco
                  </div>
               </div>
            </div>

            {/* Product Info Setup */}
            <div className="w-full md:w-1/2 flex flex-col">
               <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-extrabold text-gray-400 tracking-widest uppercase">{product.category}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs font-bold text-[#E30613] bg-[#E30613]/10 px-2 py-0.5 rounded-md">Stock Verificado</span>
               </div>
               
               <h1 className="text-4xl lg:text-5xl font-black text-slate-800 font-serif leading-tight mb-4">
                  {product.name}
               </h1>
               
               <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {product.description} Este producto es seleccionado hermosamente desde nuestras fincas aliadas garantizando la mejor durabilidad y frescura en tu cocina.
               </p>

               <div className="bg-slate-50 border border-gray-100 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div>
                     {role !== 'Personas Naturales' && (
                        <div className="text-xs font-bold text-yellow-700 bg-[#FFCC00]/20 px-3 py-1 rounded-full mb-2 inline-block">
                           {role === 'Restaurantes' ? 'Tarifa Mayorista Aplicada' : 'Tarifa Micro Aplicada'}
                        </div>
                     )}
                     <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900 tracking-tight">{formatPrice(activePrice)}</span>
                        <span className="text-sm font-bold text-gray-500">/ {product.unit}</span>
                     </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cantidad</span>
                     <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white h-12 w-full sm:w-32">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex-1 hover:bg-gray-50 font-bold text-gray-500 h-full text-lg">-</button>
                        <span className="flex-1 text-center font-bold text-slate-800">{qty}</span>
                        <button onClick={() => setQty(qty + 1)} className="flex-1 hover:bg-red-50 font-bold text-[#E30613] h-full text-lg">+</button>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <button 
                     onClick={() => addToCart(product, qty)}
                     className="flex-1 bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] hover:text-white h-14 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                  >
                     <span className="relative z-10 w-full flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                        Añadir al Carrito
                     </span>
                  </button>
               </div>

               {/* Tabs matching mockup spec */}
               <div className="border-b border-gray-200 flex gap-8 mb-6">
                  <button onClick={() => setActiveTab('info')} className={`pb-3 text-sm font-bold transition-all ${activeTab === 'info' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-gray-400 hover:text-gray-600'}`}>Información</button>
                  <button onClick={() => setActiveTab('nutrition')} className={`pb-3 text-sm font-bold transition-all ${activeTab === 'nutrition' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-gray-400 hover:text-gray-600'}`}>Nutrición</button>
                  <button onClick={() => setActiveTab('reviews')} className={`pb-3 text-sm font-bold transition-all ${activeTab === 'reviews' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-gray-400 hover:text-gray-600'}`}>Reseñas (4.8)</button>
               </div>

               <div className="text-gray-600 text-sm leading-relaxed min-h-[100px]">
                  {activeTab === 'info' && <p>Producto cultivado localmente. Sujeto a disponibilidad según temporada climatológica.</p>}
                  {activeTab === 'nutrition' && (
                     <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="font-bold mb-2">Valores Típicos por 100g:</p>
                        <ul className="space-y-1">
                           <li className="flex justify-between border-b border-gray-200 py-1"><span>Energía</span> <span>45 kcal</span></li>
                           <li className="flex justify-between border-b border-gray-200 py-1"><span>Vitamina C</span> <span>Alto</span></li>
                        </ul>
                     </div>
                  )}
                  {activeTab === 'reviews' && (
                     <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl">
                           <div className="flex gap-1 text-[#FFCC00] mb-1">★★★★★</div>
                           <p className="italic text-gray-500">&quot;¡Súper fresco! Llegó en perfecto estado para mi local.&quot;</p>
                           <p className="text-xs font-bold mt-2">- Cliente Verificado</p>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Related Products Grid */}
         {relatedProducts.length > 0 && (
            <div className="border-t border-gray-100 pt-16 pb-12">
               <h2 className="text-3xl font-black text-slate-800 font-serif mb-8 text-center md:text-left">Productos Similares</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedProducts.map(p => (
                     <ProductCard key={p.id} product={p} />
                  ))}
               </div>
            </div>
         )}
      </div>
   );
}
