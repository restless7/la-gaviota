import React from 'react';
import { fetchProducts } from '@/src/actions/products';
import { readPublicInventoryFlag } from '@/src/lib/server/database';
import ShopView from '@/src/components/store/ShopView';
import { Suspense } from 'react';
import { LiveMarketTicker } from '@/app/components/market/LiveMarketTicker';
import { PriceDropPopup } from '@/app/components/market/PriceDropPopup';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.lagaviotafruver.com/' },
  title: 'Inicio | Surtifruver La Gaviota',
  description: 'Explora nuestro catálogo fresco y haz tu pedido con precios mayoristas en Bucaramanga y Santander.',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://www.lagaviotafruver.com',
    siteName: 'Surtifruver La Gaviota',
    title: 'Surtifruver La Gaviota | Frutas y Verduras Frescas a Domicilio',
    description: 'Mercado fresco directo del campo a tu mesa. La forma chévere de mercar en Bucaramanga.',
    images: [
      {
        url: 'https://www.lagaviotafruver.com/IMAGES/og-lagaviota.jpg',
        secureUrl: 'https://www.lagaviotafruver.com/IMAGES/og-lagaviota.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'Surtifruver La Gaviota - La forma chévere de mercar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Surtifruver La Gaviota | Frescura de Santander a tu mesa',
    description: 'Frutas y verduras frescas directo del campo. La forma chévere de mercar en Bucaramanga.',
    images: ['https://www.lagaviotafruver.com/IMAGES/og-lagaviota.jpg'],
  },
};

export default async function Home() {
  const [products, { track_inventory }] = await Promise.all([
    fetchProducts(),
    readPublicInventoryFlag(),
  ]);

  const tickerItems = products.map(p => {
    const currentPrice = p.price;
    const previousPrice = p.previousPrice || currentPrice;
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
      const currentPrice = p.price;
      const previousPrice = p.previousPrice || currentPrice;
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
          <ShopView initialProducts={products} trackInventory={track_inventory} />
        </Suspense>

        <PriceDropPopup products={priceDrops} />
     </div>
  );
}
