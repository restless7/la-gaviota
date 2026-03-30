'use client';

import React, { useState } from 'react';
import ProductCard, { Product } from './ProductCard';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Tomate Chonto',
    category: 'Verduras',
    unit: '1 kg',
    image: '/images/tomate.jpg',
    prices: {
      'Personas Naturales': 12000,
      'Micromercados': 11000,
      'Restaurantes': 9500,
    }
  },
  {
    id: '2',
    name: 'Aguacate Hass',
    category: 'Verduras',
    unit: '1 kg',
    image: '/images/aguacate.jpg',
    prices: {
      'Personas Naturales': 12000,
      'Micromercados': 10500,
      'Restaurantes': 9000,
    }
  },
  {
    id: '3',
    name: 'Manzana Roja',
    category: 'Frutas',
    unit: '1 kg',
    image: '/images/manzana.jpg',
    prices: {
      'Personas Naturales': 15000,
      'Micromercados': 13500,
      'Restaurantes': 12000,
    }
  },
  {
    id: '4',
    name: 'Zanahoria',
    category: 'Verduras',
    unit: '1 kg',
    image: '/images/zanahoria.jpg',
    prices: {
      'Personas Naturales': 3200,
      'Micromercados': 2900,
      'Restaurantes': 2600,
    }
  },
  {
    id: '5',
    name: 'Banano Criollo',
    category: 'Frutas',
    unit: '1 kg',
    image: '/images/banano.jpg',
    prices: {
      'Personas Naturales': 2800,
      'Micromercados': 2500,
      'Restaurantes': 2200,
    }
  },
  {
    id: '6',
    name: 'Kit Sancocho Familiar',
    category: 'Kits',
    unit: 'Bandeja',
    image: '/images/sancocho.jpg',
    prices: {
      'Personas Naturales': 12000,
      'Micromercados': 11000,
      'Restaurantes': 9500,
    }
  }
];

export default function ProductGrid() {
  const [filter, setFilter] = useState<'Todos' | 'Frutas' | 'Verduras' | 'Kits'>('Todos');

  const filteredProducts = SAMPLE_PRODUCTS.filter(p => filter === 'Todos' || p.category === filter);

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full mt-10">
      {/* Left Sidebar Layout */}
      <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-8 bg-slate-50/50 p-6 rounded-3xl border border-gray-100">
        <h2 className="text-xl font-bold text-slate-900 border-b border-gray-200 pb-3">Filtros</h2>
        
        {/* Categorías */}
        <div className="flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-3 text-[15px]">Categorías</h3>
          <div className="flex flex-col gap-1.5 pl-1">
            {['Todos', 'Frutas', 'Verduras', 'Kits'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat as typeof filter)}
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
