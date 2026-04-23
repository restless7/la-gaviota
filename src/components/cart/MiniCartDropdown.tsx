'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';

export function MiniCartDropdown({ onClose }: { onClose: () => void }) {
  const { items, updateQuantity, removeFromCart, cartTotal, remainingForFreeShipping, progressPercent } = useCart();
  const { role } = useUserRole();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatPrice = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={dropdownRef} className="absolute top-[130%] right-0 w-[400px] bg-white border-2 border-[#1B5E20] rounded-xl shadow-2xl z-50 p-5 animate-in fade-in zoom-in-95 duration-200">
      {/* Decorative Caret pointing up */}
      <div className="absolute -top-[10px] right-6 w-4 h-4 bg-white border-l-2 border-t-2 border-[#1B5E20] rotate-45 transform origin-center"></div>

      <div className="flex justify-between items-center mb-4">
         <h3 className="font-extrabold text-[#1B5E20] text-sm uppercase tracking-wider">Tu Carrito</h3>
         <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold p-1">✕</button>
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
         {items.length === 0 ? (
            <p className="text-center text-gray-400 py-6 font-bold">No hay productos en tu carrito.</p>
         ) : (
            items.map(item => {
               const price = role === 'Restaurantes' ? item.product.priceRestaurant : role === 'Micromercados' ? item.product.priceMicro : item.product.priceRetail;
               return (
                  <div key={item.product.id} className="flex gap-4 border-b border-gray-100 py-4 relative group">
                     <button onClick={() => removeFromCart(item.product.id)} className="absolute top-4 right-0 w-6 h-6 flex justify-center items-center rounded-full border border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 text-xs font-bold transition-all">
                        ✕
                     </button>
                     <div className="w-16 h-16 relative bg-slate-50 border border-gray-100 rounded-lg overflow-hidden shrink-0">
                        <Image src={`/IMAGES/product-display.jpeg`} alt={item.product.name} fill className="object-cover mix-blend-multiply" />
                     </div>
                     <div className="flex-1 pr-6">
                        <h4 className="font-extrabold text-[13px] text-[#1B5E20] leading-tight mb-2">{item.product.name}</h4>
                        <div className="flex items-center justify-between">
                           {/* Quantity controls matching the mock */}
                           <div className="flex items-center border border-gray-200 rounded-md bg-white h-7 w-20 shrink-0 shadow-sm">
                              <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="flex-1 text-gray-400 hover:text-slate-800 font-bold text-xs">-</button>
                              <span className="flex-1 text-center font-bold text-[11px] border-x border-gray-100">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="flex-1 text-gray-400 hover:text-slate-800 font-bold text-xs">+</button>
                           </div>
                           <span className="font-bold text-[13px] text-gray-600">{formatPrice(price * item.quantity)}</span>
                        </div>
                     </div>
                  </div>
               );
            })
         )}
      </div>

      {items.length > 0 && (
         <div className="mt-4 pt-2">
            <div className="mb-4">
               {remainingForFreeShipping > 0 ? (
                  <p className="text-[12px] font-bold text-gray-700 mb-2">
                     Your order <span className="text-red-500 font-black">needs {formatPrice(remainingForFreeShipping)}</span> for free shipping 🎉
                  </p>
               ) : (
                  <p className="text-[12px] font-bold text-[#1B5E20] mb-2">
                     Your order qualifies for free shipping 🎉
                  </p>
               )}
               <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden border border-gray-300">
                  <div className="bg-[#1B5E20] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>

            <div className="flex justify-between items-center border-y border-gray-100 py-3 mb-4">
               <span className="font-black text-[15px] text-slate-800">Subtotal:</span>
               <span className="font-black text-[17px] text-slate-900">{formatPrice(cartTotal)}</span>
            </div>

            <div className="flex flex-col gap-2">
               <button onClick={onClose} className="w-full bg-[#8bc34a] hover:bg-[#7cb342] text-white py-2.5 rounded-sm font-black text-[13px] uppercase tracking-wide transition-colors">
                  Seguir Comprando
               </button>
               <Link href="/cart" onClick={onClose} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white flex items-center justify-center py-2.5 rounded-sm font-black text-[13px] uppercase tracking-wide transition-colors">
                  Ver Carrito
               </Link>
               <Link href="/checkout" onClick={onClose} className="w-full bg-[#8bc34a] hover:bg-[#7cb342] text-white flex items-center justify-center py-2.5 rounded-sm font-black text-[13px] uppercase tracking-wide transition-colors">
                  Finalizar Compra
               </Link>
            </div>
         </div>
      )}
    </div>
  );
}
