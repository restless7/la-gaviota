import React from 'react';
import { products } from '@/src/data/products';
import ShopView from '@/src/components/store/ShopView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tienda | Surtifruver La Gaviota',
  description: 'Explora nuestro catálogo fresco y haz tu pedido con precios mayoristas en Bogotá.',
};

export default function ShopPage() {
  return (
     <div className="w-full">
        {/* Soft decorative background element */}
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-[500px] bg-gradient-to-bl from-[#ff4d4d]/5 to-transparent rounded-bl-[100%] pointer-events-none -z-10"></div>
        <ShopView initialProducts={products} />
     </div>
  );
}
