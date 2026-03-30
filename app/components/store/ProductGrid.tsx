'use client';

import React, { useState } from 'react';
import ProductCard, { Product } from './ProductCard';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Tomate Chonto Primera',
    category: 'Verduras',
    unit: '1 kg',
    image: '/images/tomate.jpg',
    prices: {
      'Personas Naturales': 4500,
      'Micromercados': 4100,
      'Restaurantes': 3800,
    }
  },
  {
    id: '2',
    name: 'Manzana Royal Gala',
    category: 'Frutas',
    unit: 'Bandeja x 4 und',
    image: '/images/manzana.jpg',
    prices: {
      'Personas Naturales': 6500,
      'Micromercados': 6000,
      'Restaurantes': 5500,
    }
  },
  {
    id: '3',
    name: 'Cebolla Larga',
    category: 'Verduras',
    unit: 'Atado 500g',
    image: '/images/cebolla.jpg',
    prices: {
      'Personas Naturales': 2500,
      'Micromercados': 2300,
      'Restaurantes': 2000,
    }
  },
  {
    id: '4',
    name: 'Kit Sancocho Familiar',
    category: 'Kits',
    unit: 'Bandeja 1.5kg',
    image: '/images/sancocho.jpg',
    prices: {
      'Personas Naturales': 12000,
      'Micromercados': 11000,
      'Restaurantes': 9500,
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
    name: 'Zanahoria',
    category: 'Verduras',
    unit: '1 kg',
    image: '/images/zanahoria.jpg',
    prices: {
      'Personas Naturales': 3200,
      'Micromercados': 2900,
      'Restaurantes': 2600,
    }
  }
];

export default function ProductGrid() {
  const [filter, setFilter] = useState<'Todos' | 'Frutas' | 'Verduras' | 'Kits'>('Todos');

  const filteredProducts = SAMPLE_PRODUCTS.filter(p => filter === 'Todos' || p.category === filter);

  return (
    <section className="py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-100 gap-4">
        <h2 className="text-2xl font-black text-slate-800 font-serif">Nuestros Productos Frescos</h2>
        
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['Todos', 'Frutas', 'Verduras', 'Kits'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat as typeof filter)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === cat 
                  ? 'bg-gaviota-red text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-gaviota-red hover:border-red-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No hay productos en esta categoría por ahora.
        </div>
      )}
    </section>
  );
}
