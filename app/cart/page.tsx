'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';

export default function CartPage() {
   const { items, updateQuantity, removeFromCart, cartTotal, remainingForFreeShipping, progressPercent } = useCart();
   const { role } = useUserRole();

   const formatPrice = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);

   if (items.length === 0) {
      return (
         <div className="max-w-4xl mx-auto px-4 py-24 text-center">
            <h1 className="text-3xl font-black mb-6">Tu carrito está vacío</h1>
            <Link href="/shop" className="bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] font-bold py-3 px-8 rounded-full">
               Comprar Productos
            </Link>
         </div>
      );
   }

   return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
         
         {/* Checkout Breadcrumbs matching mockups */}
         <div className="flex justify-center items-center gap-4 text-sm font-bold tracking-widest uppercase mb-16">
            <span className="text-slate-900 border-b-2 border-slate-900 pb-1">Shopping Cart</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-400">Checkout Details</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-400">Order Complete</span>
         </div>

         <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Left side: Cart Items */}
            <div className="w-full lg:w-2/3">
               <div className="flex justify-between border-b border-gray-200 pb-4 mb-6">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Producto</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
               </div>

               <div className="flex flex-col gap-8">
                  {items.map(item => {
                     const price = role === 'Restaurantes' ? item.product.priceRestaurant : role === 'Micromercados' ? item.product.priceMicro : item.product.priceRetail;
                     return (
                        <div key={item.product.id} className="flex gap-6 border-b border-gray-100 pb-8 relative group">
                           <div className="w-24 h-24 sm:w-32 sm:h-32 relative bg-slate-50 border border-gray-100 rounded-2xl overflow-hidden shrink-0">
                              <Image src={item.product.imagePlaceholder || `/IMAGES/product-display.jpeg`} alt={item.product.name} fill className="object-cover mix-blend-multiply" />
                           </div>
                           <div className="flex-1 flex flex-col justify-start">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <h3 className="font-bold text-lg text-indigo-950 leading-tight mb-2 pr-8">{item.product.name}</h3>
                                    <span className="text-sm font-bold text-gray-600 block mb-2">{formatPrice(price)} / {item.product.unit}</span>
                                    {role !== 'Personas Naturales' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-3">Tarifa {role}</span>}
                                 </div>
                                 <span className="font-black text-lg text-slate-800 shrink-0">{formatPrice(price * item.quantity)}</span>
                              </div>
                              
                              <div className="flex items-center gap-6 mt-auto">
                                 <div className="flex items-center border border-gray-200 rounded-lg bg-white h-10 w-32 shrink-0">
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="flex-1 text-gray-400 hover:text-slate-800 hover:bg-slate-50 font-black">-</button>
                                    <span className="flex-1 text-center font-bold text-sm">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="flex-1 text-gray-400 hover:text-slate-800 hover:bg-slate-50 font-black">+</button>
                                 </div>
                                 <button onClick={() => removeFromCart(item.product.id)} className="text-xs font-bold text-gray-400 hover:text-[#E30613] transition-colors border-b border-transparent hover:border-[#E30613]">
                                    Eliminar artículo
                                 </button>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* Right side: Shopping Cart Totals */}
            <div className="w-full lg:w-1/3">
               <div className="bg-slate-50 border border-gray-100 rounded-3xl p-8 sticky top-28">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-200 pb-4">Total del Carrito</h2>
                  
                  <div className="flex justify-between items-center py-4 border-b border-gray-200 text-sm font-bold text-gray-600 cursor-pointer hover:text-slate-900 group">
                     <span>Add coupons</span>
                     <span className="text-gray-300 group-hover:text-slate-900 transition-colors">⌄</span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-b border-gray-200">
                     <span className="text-sm font-bold text-slate-700">Envío / Domicilio</span>
                     {remainingForFreeShipping === 0 ? (
                        <span className="text-sm font-black text-[#4CAF50] uppercase tracking-wide">Gratis</span>
                     ) : (
                        <span className="text-sm font-bold text-gray-500">{formatPrice(8000)}</span>
                     )}
                  </div>

                  {remainingForFreeShipping > 0 && (
                     <div className="mt-4 bg-[#4CAF50]/10 rounded-xl p-4">
                        <p className="text-xs font-bold text-gray-700 mb-2">
                           Agrega <span className="text-[#E30613]">{formatPrice(remainingForFreeShipping)}</span> para envío gratis
                        </p>
                        <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
                           <div className="bg-[#4CAF50] h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                     </div>
                  )}

                  <div className="flex justify-between items-end my-8">
                     <span className="text-lg font-black text-slate-800 font-serif">Estimated total</span>
                     <span className="text-3xl font-black text-slate-900">{formatPrice(cartTotal + (remainingForFreeShipping === 0 ? 0 : 8000))}</span>
                  </div>

                  <Link 
                     href="/checkout"
                     className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-4 flex items-center justify-center font-bold text-lg transition-all shadow-md hover:shadow-xl hover:-translate-y-1"
                  >
                     Proceder al pago
                  </Link>
               </div>
            </div>
         </div>

      </div>
   );
}
