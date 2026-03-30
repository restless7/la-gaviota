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
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all p-4 flex flex-col group relative overflow-hidden">
      {/* Category Badge */}
      <span className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm text-gaviota-green text-xs font-bold px-3 py-1 rounded-full shadow-sm">
        {product.category}
      </span>
      
      {/* Image Container */}
      <div className="bg-slate-50 w-full h-48 rounded-2xl mb-4 relative flex items-center justify-center overflow-hidden">
        {/* Placeholder for local image. Ideally use next/image with real URLs */}
        <div className="w-full h-full bg-slate-200 animate-pulse hidden"></div>
        <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
           {product.category === 'Frutas' ? '🍎' : product.category === 'Verduras' ? '🥦' : '📦'}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-lg text-slate-800 mb-1">{product.name}</h3>
        <p className="text-sm text-slate-500 mb-3">{product.unit}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xl font-black text-gaviota-red">
              ${currentPrice.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              {role}
            </span>
          </div>
          
          <button className="bg-gaviota-green hover:bg-green-600 text-white p-3 rounded-full shadow-sm transition-colors active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
