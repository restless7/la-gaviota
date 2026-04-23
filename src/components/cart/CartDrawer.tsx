'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, cartTotal, itemCount, remainingForFreeShipping, progressPercent } = useCart();
  const { role } = useUserRole();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end md:hidden">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col transform animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
           <h2 className="text-xl font-black text-slate-800 font-serif flex items-center gap-2">
              🛒 Tu Canasta
              <span className="bg-[#E30613] text-white text-xs px-2 py-0.5 rounded-full">{itemCount}</span>
           </h2>
           <button 
              onClick={() => setIsCartOpen(false)}
              className="text-gray-400 hover:text-slate-800 transition-colors p-2"
           >
              ✕
           </button>
        </div>

        {/* Phase 5.2 Enterprise Features: Free Shipping Gamification Tooltip */}
        {items.length > 0 && (
           <div className="bg-[#4CAF50]/10 border-b border-[#4CAF50]/20 p-4 shrink-0 transition-all">
              {remainingForFreeShipping > 0 ? (
                 <p className="text-sm font-bold text-gray-700 mb-2">
                    Agrega <span className="text-[#E30613]">{formatPrice(remainingForFreeShipping)}</span> para envío gratis
                 </p>
              ) : (
                 <p className="text-sm font-bold text-[#4CAF50] mb-2 flex items-center gap-1">
                    🎉 ¡Tu pedido tiene envío gratis!
                 </p>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                 <div 
                    className="bg-gradient-to-r from-[#4CAF50] to-green-400 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                 ></div>
              </div>
           </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
           {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                 <span className="text-6xl mb-4">🧺</span>
                 <p className="text-slate-500 font-medium">Tu canasta está vacía.</p>
                 <button onClick={() => setIsCartOpen(false)} className="mt-4 text-[#E30613] font-bold hover:underline">
                    Ir a comprar
                 </button>
              </div>
           ) : (
              <ul className="space-y-4">
                 {items.map(item => {
                    const price = role === 'Restaurantes' ? item.product.priceRestaurant : role === 'Micromercados' ? item.product.priceMicro : item.product.priceRetail;
                    return (
                       <li key={item.product.id} className="flex gap-4 border border-gray-100 rounded-xl p-3 shadow-sm bg-slate-50/50">
                          <div className="w-20 h-20 relative bg-white rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                             <Image src={`/IMAGES/product-display.jpeg`} alt={item.product.name} fill className="object-cover mix-blend-multiply" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                             <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-sm text-slate-800 line-clamp-2">{item.product.name}</h4>
                                <button onClick={() => removeFromCart(item.product.id)} className="text-gray-400 hover:text-[#E30613]">🗑️</button>
                             </div>
                             <div className="flex justify-between items-end mt-2">
                                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
                                   <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 text-gray-500 hover:bg-gray-50 font-bold">-</button>
                                   <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                   <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1 text-[#E30613] hover:bg-red-50 font-bold">+</button>
                                </div>
                                <span className="font-black text-slate-900">{formatPrice(price * item.quantity)}</span>
                             </div>
                          </div>
                       </li>
                    );
                 })}
              </ul>
           )}
        </div>

        {items.length > 0 && (
           <div className="p-5 border-t border-gray-100 bg-slate-50 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-4 text-slate-600">
                 <span className="font-medium">Subtotal de productos:</span>
                 <span className="text-xl font-black text-slate-900">{formatPrice(cartTotal)}</span>
              </div>
              <Link 
                 href="/cart"
                 onClick={() => setIsCartOpen(false)}
                 className="w-full border-2 border-gray-200 text-slate-600 hover:border-[#E30613] hover:text-[#E30613] py-2 rounded-xl font-bold text-sm transition-all mb-3 text-center block"
              >
                 Ver página de carrito
              </Link>
              <Link 
                 href="/checkout"
                 onClick={() => setIsCartOpen(false)}
                 className="w-full bg-[#E30613] hover:bg-[#c90510] text-amber-300 py-4 rounded-xl font-black tracking-wide text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                 <span>Proceder al pago</span>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </Link>
           </div>
        )}
      </div>
    </div>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(price);
}
