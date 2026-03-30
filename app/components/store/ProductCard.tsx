'use client';

import React from 'react';
import { useUserRole } from '@/app/context/UserContext';

export interface Product {
  id: string;
  name: string;
  category: 'Frutas' | 'Verduras' | 'Kits';
  unit: string;
  image: string;
  prices: {
    'Personas Naturales': number;
    'Micromercados': number;
    'Restaurantes': number;
  };
}

export default function ProductCard({ product }: { product: Product }) {
  const { role } = useUserRole();
  const currentPrice = product.prices[role];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all flex flex-col overflow-hidden w-full max-w-[280px] mx-auto group">
      {/* Product Image Box */}
      {/* Fallback to gray box, but conceptually represents the lush image from the reference */}
      <div className="w-full aspect-square bg-slate-100 relative flex items-center justify-center overflow-hidden">
        {/* Placeholder Emoji representation of image */}
        <div className="text-6xl group-hover:scale-110 transition-transform duration-500 ease-out z-10 relative">
          {product.category === 'Frutas' ? '🍎' : product.category === 'Verduras' ? '🥦' : '📦'}
        </div>
        {/* Simulating the dark moody background of the reference images */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10 mix-blend-multiply opacity-50 z-0 hidden group-hover:block transition-opacity"></div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col items-center flex-1 text-center bg-white">
        <h3 className="font-semibold text-[17px] text-slate-800 tracking-tight leading-snug mb-1">
          {product.name}
        </h3>
        
        {/* Exact Format: $12.000 COP / kg */}
        <div className="flex items-center gap-1 mb-4">
           <span className="text-[15px] font-black text-[#B88A44]">
              ${currentPrice.toLocaleString('es-CO')} COP
           </span>
           <span className="text-[13px] text-[#B88A44] font-medium">
             / {product.unit.includes('kg') ? 'kg' : 'und'}
           </span>
        </div>

        <div className="w-full mt-auto">
          <button className="w-full bg-[#CC0000] hover:bg-red-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
            Añadir al Carrito
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
