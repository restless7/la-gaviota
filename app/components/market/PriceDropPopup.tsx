'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ShoppingCart } from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { Product } from '@/src/actions/products';

export interface MarketAlertProduct extends Product {
  percentageDrop: number;
}

export function PriceDropPopup({ products }: { products: MarketAlertProduct[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || products.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
        
        {/* Header */}
        <div className="p-6 bg-[#f0fdf4] border-b border-green-100 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 font-serif">
              <span className="text-2xl">🥦</span> ¡Hoy está barato!
            </h2>
            <p className="text-sm font-medium text-green-800 mt-1">
              Estos productos bajaron de precio hoy. Aprovecha antes que suban.
            </p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-800 shadow-sm border border-green-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {products.slice(0, 3).map((product) => (
              <div key={product.id} className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-40 w-full bg-gray-50">
                  <Image 
                    src={product.imageUrl || '/IMAGES/placeholder.png'} 
                    alt={product.name} 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#10b981] text-white text-[11px] font-black px-2 py-1 rounded-full shadow-md">
                    ↓ {product.percentageDrop}%
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-800 leading-tight mb-1">{product.name}</h3>
                  <div className="font-black text-[#10b981] mb-3">
                    ${product.priceRetail.toLocaleString('es-CO')} <span className="text-xs text-gray-400 font-medium">/{product.unit}</span>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(product, 1);
                      setIsOpen(false);
                    }}
                    className="mt-auto w-full bg-[#10b981] hover:bg-[#059669] text-white text-sm font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" /> Agregar al carrito
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs font-medium text-gray-400">Variación calculada vs el precio promedio de ayer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
