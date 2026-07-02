import React from 'react';
import { fetchProducts } from '@/src/actions/products';
import ShopView from '@/src/components/store/ShopView';
import { Suspense } from 'react';
import { LiveMarketTicker } from '@/app/components/market/LiveMarketTicker';
import { PriceDropPopup } from '@/app/components/market/PriceDropPopup';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inicio | Surtifruver La Gaviota',
  description: 'Explora nuestro catálogo fresco y haz tu pedido con precios mayoristas en Bogotá y Bucaramanga.',
};

export default async function Home() {
  const products = await fetchProducts();

  const tickerItems = products.map(p => {
    const currentPrice = p.priceRetail;
    const previousPrice = p.previousPriceRetail || currentPrice;
    const delta = currentPrice - previousPrice;
    const percentage = previousPrice > 0 ? (delta / previousPrice) * 100 : 0;
    return {
      id: p.id,
      name: p.name,
      price: currentPrice,
      delta,
      percentage
    };
  });

  const priceDrops = products
    .map(p => {
      const currentPrice = p.priceRetail;
      const previousPrice = p.previousPriceRetail || currentPrice;
      const percentageDrop = previousPrice > 0 ? ((previousPrice - currentPrice) / previousPrice) * 100 : 0;
      return { ...p, percentageDrop: Number(percentageDrop.toFixed(1)) };
    })
    .filter(p => p.percentageDrop > 0)
    .sort((a, b) => b.percentageDrop - a.percentageDrop);

  return (
     <div className="w-full">
        {/* Soft decorative background element */}
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-[500px] bg-gradient-to-bl from-[#ff4d4d]/5 to-transparent rounded-bl-[100%] pointer-events-none -z-10"></div>
        
        <LiveMarketTicker items={tickerItems} />
        
        <Suspense fallback={<div className="py-24 text-center text-slate-500 font-bold">Cargando catálogo...</div>}>
          <ShopView initialProducts={products} />
        </Suspense>

        <PriceDropPopup products={priceDrops} />
     </div>
  );
}
