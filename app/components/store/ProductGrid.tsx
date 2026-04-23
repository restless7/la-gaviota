'use client';

import React, { useState } from 'react';
import { ProductCard } from '@/src/components/store/ProductCard';
import { Product } from '@/src/data/products';
import Image from 'next/image';

const CATEGORY_BANNERS: Record<string, string> = {
  'Frutas': '/IMAGES/frutas-banner.jpeg',
  'Verduras Y Hortalizas': '/IMAGES/verduras-banner.jpeg',
  'Verduras': '/IMAGES/verduras-banner.jpeg',
  'Carnes': '/IMAGES/carnes-banner1.jpeg',
};

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    slug: 'tomate-chonto',
    name: 'Tomate Chonto',
    category: 'Verduras Y Hortalizas',
    unit: '1 kg',
    imagePlaceholder: '/IMAGES/product-display.jpeg',
    description: 'Fresco tomate chonto.',
    priceRetail: 12000,
    priceMicro: 11000,
    priceRestaurant: 9500,
  },
  {
    id: '2',
    slug: 'aguacate-hass',
    name: 'Aguacate Hass',
    category: 'Frutas',
    unit: '1 kg',
    imagePlaceholder: '/IMAGES/product-display.jpeg',
    description: 'Aguacate hass de calidad.',
    priceRetail: 12000,
    priceMicro: 10500,
    priceRestaurant: 9000,
  },
  {
    id: '3',
    slug: 'manzana-roja',
    name: 'Manzana Roja',
    category: 'Frutas',
    unit: '1 kg',
    imagePlaceholder: '/IMAGES/product-display.jpeg',
    description: 'Manzana roja fresca.',
    priceRetail: 15000,
    priceMicro: 13500,
    priceRestaurant: 12000,
  },
  {
    id: '4',
    slug: 'zanahoria',
    name: 'Zanahoria',
    category: 'Verduras Y Hortalizas',
    unit: '1 kg',
    imagePlaceholder: '/IMAGES/product-display.jpeg',
    description: 'Zanahoria fresca.',
    priceRetail: 3200,
    priceMicro: 2900,
    priceRestaurant: 2600,
  },
  {
    id: '5',
    slug: 'banano-criollo',
    name: 'Banano Criollo',
    category: 'Frutas',
    unit: '1 kg',
    imagePlaceholder: '/IMAGES/product-display.jpeg',
    description: 'Banano criollo dulce.',
    priceRetail: 2800,
    priceMicro: 2500,
    priceRestaurant: 2200,
  },
  {
    id: '6',
    slug: 'kit-sancocho',
    name: 'Kit Sancocho Familiar',
    category: 'Kits Negocios',
    unit: 'Bandeja',
    imagePlaceholder: '/IMAGES/product-display.jpeg',
    description: 'Kit completo para sancocho.',
    priceRetail: 12000,
    priceMicro: 11000,
    priceRestaurant: 9500,
  }
];

export default function ProductGrid() {
  const [filter, setFilter] = useState<'Todos' | 'Frutas' | 'Verduras' | 'Verduras Y Hortalizas' | 'Carnes' | 'Kits'>('Todos');

  const filteredProducts = SAMPLE_PRODUCTS.filter(p => {
    if (filter === 'Todos') return true;
    if (filter === 'Verduras') return p.category === 'Verduras Y Hortalizas';
    return p.category === filter;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full mt-10">
      {/* Left Sidebar Layout */}
      <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-8 bg-slate-50/50 p-6 rounded-3xl border border-gray-100">
        <h2 className="text-xl font-bold text-slate-900 border-b border-gray-200 pb-3">Filtros</h2>
        
        {/* Categorías */}
        <div className="flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-3 text-[15px]">Categorías</h3>
          <div className="flex flex-col gap-1.5 pl-1">
            {['Todos', 'Frutas', 'Verduras', 'Carnes', 'Kits'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat as any)}
                className={`text-left px-4 py-2 rounded-full text-[14px] font-medium transition-all ${
                  filter === cat 
                    ? 'bg-[#CC0000] text-white shadow-md' 
                    : 'text-gray-600 hover:bg-red-50 hover:text-[#CC0000]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Origen */}
        <div className="flex flex-col border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-slate-800 mb-3 text-[15px]">Origen</h3>
          <div className="flex flex-col pl-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#CC0000] focus:ring-[#CC0000]" defaultChecked />
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">🇨🇴</span>
                <span className="text-[14px] text-gray-700 group-hover:text-slate-900">Nacional</span>
              </div>
            </label>
          </div>
        </div>

        {/* Precio */}
        <div className="flex flex-col border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-[15px]">Precio</h3>
          <div className="px-2">
            <div className="relative h-1 bg-gray-200 rounded-full mb-4">
               {/* Simulating UI range slider line */}
               <div className="absolute left-0 right-10 h-1 bg-[#CC0000] rounded-full"></div>
               {/* Handles */}
               <div className="absolute left-0 -ml-2 -mt-1.5 w-4 h-4 bg-white border-2 border-[#CC0000] rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
               <div className="absolute right-10 -mr-2 -mt-1.5 w-4 h-4 bg-white border-2 border-[#CC0000] rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
            </div>
            <div className="flex justify-between text-[12px] font-semibold text-gray-500">
               <span>$5.000</span>
               <span>$25.000</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Grid Area */}
      <section className="flex-1">
        {/* Dynamic Category Banner */}
        {filter !== 'Todos' && CATEGORY_BANNERS[filter] && (
          <div className="w-full relative aspect-[21/9] md:aspect-[16/4] rounded-3xl overflow-hidden shadow-md mb-8 group cursor-pointer">
             <Image 
               src={CATEGORY_BANNERS[filter]} 
               alt={`${filter} Banner`} 
               fill 
               className="object-cover object-center group-hover:scale-105 transition-transform duration-1000"
               sizes="(max-width: 768px) 100vw, 80vw"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 flex flex-col justify-end p-6 md:p-8">
               <h2 className="text-3xl md:text-5xl font-black text-white font-serif drop-shadow-lg uppercase tracking-tight">{filter}</h2>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <span className="text-4xl mb-4 block">🧐</span>
            <p className="text-lg font-medium text-gray-500">
              No encontramos productos con estos filtros.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
