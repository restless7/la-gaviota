'use client';
import React, { useState } from 'react';
import { Product } from '@/src/actions/products';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { useCart } from '@/src/contexts/CartContext';

const CATEGORY_GRADIENTS: Record<string, string> = {
  'Frutas': 'from-orange-400 to-red-400',
  'Verduras Y Hortalizas': 'from-green-400 to-emerald-500',
  'Pulpas': 'from-purple-400 to-pink-400',
  'Varios Preparados': 'from-amber-400 to-orange-400',
  'Carnes': 'from-red-500 to-rose-600',
  'Condimentos Frutos Secos Aromaticas': 'from-yellow-500 to-amber-500',
  'Kits Negocios': 'from-blue-400 to-indigo-500',
};

const CATEGORY_EMOJI: Record<string, string> = {
  'Frutas': '🍎',
  'Verduras Y Hortalizas': '🥬',
  'Pulpas': '🧃',
  'Varios Preparados': '🥗',
  'Carnes': '🥩',
  'Condimentos Frutos Secos Aromaticas': '🌶️',
  'Kits Negocios': '📦',
};

export function ProductCard({ product }: { product: Product }) {
  const { role } = useUserRole();
  const { addToCart, setIsCartOpen } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic Pricing Logic directly integrated via Context Switch
  const activePrice = role === 'Restaurantes'
        ? product.priceRestaurant
        : role === 'Micromercados'
           ? product.priceMicro
           : product.priceRetail;

  const handleAddToCart = () => {
     addToCart(product, 1);
     setIsCartOpen(true); // Triggers Modal automatically
  };

  const gradient = CATEGORY_GRADIENTS[product.category] || 'from-slate-400 to-slate-500';
  const emoji = CATEGORY_EMOJI[product.category] || '📦';
  const initial = product.name.charAt(0).toUpperCase();

  return (
    <div
       className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative"
       onMouseEnter={() => setIsHovered(true)}
       onMouseLeave={() => setIsHovered(false)}
    >
       {/* Image Section — Dynamic Category Placeholder */}
       <div className={`aspect-[4/3] w-full relative bg-gradient-to-br ${gradient} overflow-hidden flex items-center justify-center`}>
          {/* Large emoji background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span className="text-[120px] select-none">{emoji}</span>
          </div>
          {/* Product initial */}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <span className="text-6xl font-black text-white/90 drop-shadow-lg">{initial}</span>
            <span className="text-white/70 text-xs font-bold uppercase tracking-widest">{product.category.split(' ')[0]}</span>
          </div>

          {/* Quick Add Overlay */}
          <div className={`absolute bottom-4 left-0 right-0 flex justify-center opacity-0 transform translate-y-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : ''}`}>

             {role === 'Personas Naturales' ? (
                <button
                   onClick={handleAddToCart}
                   className="bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] hover:text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg hover:-translate-y-0.5 transition-all w-[85%] truncate flex items-center justify-center gap-2"
                >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                   Añadir al carrito
                </button>
             ) : (
                <div className="flex gap-2 w-[90%]">
                   <button
                      onClick={handleAddToCart}
                      className="bg-white border border-[#83b745] text-[#83b745] hover:bg-[#83b745] hover:text-white px-2 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex-1 text-center"
                   >
                      +1 {product.unit}
                   </button>
                   <button
                      onClick={() => { addToCart(product, 10); setIsCartOpen(true); }}
                      className="bg-[#83b745] hover:bg-[#6c9c36] text-white px-2 py-2 rounded-xl font-black text-xs shadow-md transition-all flex-1 text-center truncate"
                   >
                      +10 (Caja)
                   </button>
                </div>
             )}
          </div>
       </div>

       {/* Content Section */}
       <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
             <span className="text-[10px] font-bold uppercase tracking-wider text-[#4CAF50] bg-[#4CAF50]/10 px-2 py-0.5 rounded-md">{product.category}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-base leading-snug mb-3 line-clamp-2 min-h-[2.5rem]">
             {product.name}
          </h3>
          
          <div className="mt-auto flex items-end justify-between border-t border-gray-50 pt-4">
             <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                   {formatPrice(activePrice)}
                </span>
                <span className="text-[11px] font-semibold text-gray-500 mt-1 uppercase">
                   / {product.unit}
                </span>
             </div>
             
             {/* Dynamic Badge indicating tier */}
             {role !== 'Personas Naturales' && (
                <div className="bg-[#FFCC00]/20 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-md text-right max-w-[80px] leading-tight">
                   {role === 'Restaurantes' ? 'Tarifa Mayorista' : 'Tarifa Micro'}
                </div>
             )}
          </div>
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
