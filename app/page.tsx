import React from 'react';
import { fetchProducts } from '@/src/actions/products';
import ShopView from '@/src/components/store/ShopView';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inicio | Surtifruver La Gaviota',
  description: 'Explora nuestro catálogo fresco y haz tu pedido con precios mayoristas en Bogotá y Bucaramanga.',
};

export default async function Home() {
  const products = await fetchProducts();

  return (
     <div className="w-full">
        {/* Soft decorative background element */}
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-[500px] bg-gradient-to-bl from-[#ff4d4d]/5 to-transparent rounded-bl-[100%] pointer-events-none -z-10"></div>
        <Suspense fallback={<div className="py-24 text-center text-slate-500 font-bold">Cargando catálogo...</div>}>
          <ShopView initialProducts={products} />
        </Suspense>
     </div>
  );
}
