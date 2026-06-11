'use client';
import React, { useState } from 'react';
import { Product } from '@/src/actions/products';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { useCart } from '@/src/contexts/CartContext';
import Image from 'next/image';

const CATEGORY_GRADIENTS: Record<string, string> = {
  'FRUTAS': 'from-orange-400 to-red-400',
  'VERDURAS Y HORTALIZAS': 'from-green-400 to-emerald-500',
  'PULPAS': 'from-purple-400 to-pink-400',
  'VARIOS': 'from-amber-400 to-orange-400',
  'CARNES X 500 GRAMOS': 'from-red-500 to-rose-600',
  'CONDIMENTOS X 125 GR': 'from-yellow-500 to-amber-500',
  'FRUTOS SECOS Y ESPECIAS': 'from-yellow-600 to-orange-500',
  'AROMÁTICAS Y HIERBAS X 125 GR': 'from-emerald-400 to-teal-500',
  'KITS NEGOCIOS': 'from-blue-400 to-indigo-500',
};

const CATEGORY_EMOJI: Record<string, string> = {
  'FRUTAS': '🍎',
  'VERDURAS Y HORTALIZAS': '🥬',
  'PULPAS': '🧃',
  'VARIOS': '🥗',
  'CARNES X 500 GRAMOS': '🥩',
  'CONDIMENTOS X 125 GR': '🌶️',
  'FRUTOS SECOS Y ESPECIAS': '🥜',
  'AROMÁTICAS Y HIERBAS X 125 GR': '🌿',
  'KITS NEGOCIOS': '📦',
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
       {/* Image Section — Dynamic Category Placeholder or Actual Image */}
       <div className={`aspect-square w-full relative bg-gradient-to-br ${gradient} overflow-hidden flex items-center justify-center`}>
          {product.imageUrl ? (
             <Image 
                src={product.imageUrl} 
                alt={product.name} 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
             />
          ) : (
             <>
                {/* Large emoji background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <span className="text-[120px] select-none">{emoji}</span>
                </div>
                {/* Product initial */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <span className="text-6xl font-black text-white/90 drop-shadow-lg">{initial}</span>
                  <span className="text-white/70 text-xs font-bold uppercase tracking-widest text-center px-2">
                    {product.subcategory || product.category.split(' ')[0]}
                  </span>
                </div>
             </>
          )}

          {/* Quick Add Overlay */}
          <div className={`absolute bottom-4 left-0 right-0 flex justify-center opacity-0 transform translate-y-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : ''}`}>

              {role === 'Personas Naturales' ? (
                 <button
                    onClick={handleAddToCart}
                    className="bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] hover:text-white px-3 py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg hover:-translate-y-0.5 transition-all w-[90%] truncate flex items-center justify-center gap-1.5"
                 >
                    <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                    <span className="sm:hidden font-black">+</span> Añadir
                 </button>
              ) : (
                 <div className="flex gap-1.5 w-[94%]">
                    <button
                       onClick={handleAddToCart}
                       className="bg-white border border-[#83b745] text-[#83b745] hover:bg-[#83b745] hover:text-white px-1 sm:px-2 py-1.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs shadow-md transition-all flex-1 text-center"
                    >
                       +1 {product.unit}
                    </button>
                    <button
                       onClick={() => { addToCart(product, 10); setIsCartOpen(true); }}
                       className="bg-[#83b745] hover:bg-[#6c9c36] text-white px-1 sm:px-2 py-1.5 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs shadow-md transition-all flex-1 text-center truncate"
                    >
                       +10 (Caja)
                    </button>
                 </div>
             )}
          </div>
       </div>

       {/* Content Section */}
       <div className="p-3 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-1.5">
             <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#4CAF50] bg-[#4CAF50]/10 px-1.5 py-0.5 rounded-md truncate max-w-full">
               {product.category} {product.subcategory ? `> ${product.subcategory}` : ''}
             </span>
          </div>
          <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug mb-2 line-clamp-2 min-h-[2rem]">
             {product.name}
          </h3>
          
          <div className="mt-auto flex items-end justify-between border-t border-gray-50 pt-2 sm:pt-3">
             <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                   {formatPrice(activePrice)}
                </span>
                <span className="text-[10px] font-semibold text-gray-500 mt-0.5 uppercase">
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
