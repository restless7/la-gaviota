'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/src/contexts/CartContext';
import { CartItems } from '@/src/components/cart/CartItems';

export default function CartPage() {
   const { items, cartTotal, cartReady } = useCart();

   const formatPrice = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);

   const emptyImage = '/IMAGES/empty-cart-seagull.jpeg';

   if (!cartReady) return <div role="status" className="mx-auto max-w-4xl px-4 py-20 text-center text-slate-600">Verificando tu selección. Si no podemos restaurarla, conservaremos tu carrito para reintentar.</div>;

   if (items.length === 0) {
      return (
         <div className="max-w-4xl mx-auto px-4 py-24 text-center flex flex-col items-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
               <Image 
                 src={emptyImage}
                 alt="Carrito Vacío" 
                 fill 
                 className="object-contain drop-shadow-xl"
                 priority
               />
            </div>
            <h1 className="text-3xl font-black mb-6 font-serif text-slate-800">Tu carrito está vacío</h1>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">¡Es hora de llenarlo con lo mejor del campo colombiano! Descubre nuestros vegetales y frutas más frescos.</p>
            <Link href="/" className="bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg tracking-wide">
               Comprar Productos
            </Link>
         </div>
      );
   }

   return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
         
         {/* Checkout Breadcrumbs matching mockups */}
         <div className="flex justify-center items-center gap-2 text-[10px] sm:text-sm font-bold uppercase mb-8 flex-wrap">
            <span className="text-slate-900 border-b-2 border-slate-900 pb-1">Carrito</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-400">Datos de compra</span>
            <span className="text-gray-300">›</span>
            <span className="text-gray-400">Confirmación</span>
         </div>

         <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Left side: Cart Items */}
            <div className="w-full lg:w-2/3">
               <div className="w-full h-48 md:h-64 relative rounded-3xl overflow-hidden mb-8 shadow-md">
                  <Image src="/IMAGES/fill-cart.jpeg" alt="Tus Productos" fill className="object-cover object-center" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 md:p-8">
                     <h2 className="text-3xl md:text-4xl font-black text-white font-serif drop-shadow-md">Tus Selecciones</h2>
                  </div>
               </div>

               <div className="flex justify-between border-b border-gray-200 pb-4 mb-6">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Producto</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
               </div>

               <CartItems />
            </div>

            {/* Right side: Carrito Totals */}
            <div className="w-full lg:w-1/3">
               <div className="bg-slate-50 border border-gray-100 rounded-3xl p-5 sm:p-8 sticky top-28">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-200 pb-4">Total del Carrito</h2>
                  
                  <p className="text-sm leading-relaxed text-slate-600">El envío, los precios y la disponibilidad se confirman al finalizar.</p>
                  <div className="my-8 flex flex-wrap items-end justify-between gap-3">
                     <span className="text-lg font-black text-slate-800">Subtotal estimado</span>
                     <span className="text-3xl font-black text-slate-900">{formatPrice(cartTotal)}</span>
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
