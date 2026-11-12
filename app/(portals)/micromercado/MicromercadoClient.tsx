'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/src/actions/products';
import { ProductCard } from '@/src/components/store/ProductCard';
import { B2BTemplatesSection, type BuyingTemplate } from '@/src/components/portals/B2BTemplatesSection';
import { useCart } from '@/src/contexts/CartContext';
import { useRouter } from 'next/navigation';

interface B2BOrderItem {
  product_id: string;
  product_name?: string;
  quantity: number;
  products?: Product;
}

interface B2BOrderSummary {
  id: string;
  status: string;
  order_items?: B2BOrderItem[];
}

export default function MicromercadoClient({ 
  bulkPicks, 
  allProducts = [],
  lastOrder,
  templates
}: { 
  bulkPicks: Product[]; 
  allProducts?: Product[];
  lastOrder: B2BOrderSummary | null;
  templates: BuyingTemplate[];
}) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [notice, setNotice] = useState<{ type: 'info' | 'warning'; text: string } | null>(null);

  const handleQuickReorder = () => {
    setNotice(null);
    if (!lastOrder || !lastOrder.order_items || lastOrder.order_items.length === 0) {
      setNotice({ type: 'warning', text: 'No se encontró una orden previa para repetir.' });
      return;
    }
    
    let addedCount = 0;
    const catalogPool = allProducts.length > 0 ? allProducts : bulkPicks;
    lastOrder.order_items.forEach((item) => {
       const matchedProduct = item.products || catalogPool.find((p) => p.id === item.product_id);
       if (matchedProduct && item.quantity) {
         addToCart(matchedProduct, item.quantity);
         addedCount++;
       }
    });
    if (addedCount > 0) {
      router.push('/cart');
    } else {
      setNotice({ type: 'warning', text: 'No pudimos encontrar los productos de su orden anterior en el catálogo activo.' });
    }
  };

  const handleRouteStatus = () => {
    if (!lastOrder) {
      setNotice({ type: 'info', text: 'No tiene órdenes activas en ruta en este momento.' });
      return;
    }
    if (lastOrder.status === 'En Ruta') {
      setNotice({
        type: 'info',
        text: '¡El camión de La Gaviota está en camino hacia su negocio! Llegada estimada: hoy antes de las 5:00 PM.',
      });
    } else if (lastOrder.status === 'En Preparación' || lastOrder.status === 'Pendiente') {
      setNotice({
        type: 'info',
        text: `Su orden #${lastOrder.id.slice(0, 8).toUpperCase()} (${lastOrder.status}) está siendo preparada en bodega y pronto saldrá a ruta.`,
      });
    } else if (lastOrder.status === 'Pago Pendiente') {
      setNotice({
        type: 'warning',
        text: `Su última orden #${lastOrder.id.slice(0, 8).toUpperCase()} está pendiente de confirmación de pago en Wompi.`,
      });
    } else {
      setNotice({
        type: 'info',
        text: `Estado de su última orden #${lastOrder.id.slice(0, 8).toUpperCase()}: ${lastOrder.status}.`,
      });
    }
  };

  const scrollToHistory = () => {
    const el = document.getElementById('order-history');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="animate-fade-in relative">
      {/* Welcome & Wholesale Banner Premium UI */}
      <div className="w-full relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl mb-12 flex flex-col md:flex-row min-h-[400px] lg:min-h-[450px]">
        <div className="absolute inset-0 md:w-1/2 right-0 left-auto z-0 h-64 md:h-full">
           <Image src="/IMAGES/mi-portal.jpeg" alt="Portal Micromercado" fill className="object-cover object-center" priority />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:hidden"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-8 md:p-16 lg:p-20 md:w-2/3">
           <div className="inline-flex items-center gap-2 mb-6">
              <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-sm font-black tracking-widest uppercase px-5 py-2 rounded-full backdrop-blur-md">
                 Portal Bodega & Micromercados
              </span>
           </div>
           <h1 className="text-5xl lg:text-7xl font-black text-white font-serif mb-6 leading-tight drop-shadow-md">
             Surta su negocio <span className="text-yellow-600 block">con la mejor calidad</span>
           </h1>
           <p className="text-gray-300 font-medium text-lg max-w-xl md:mx-0">
             Inventario fresco garantizado. Disfrute de su tarifa especial &quot;Micromercados&quot; en todos nuestros productos.
           </p>
        </div>
      </div>

      {/* Action Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <button type="button" onClick={handleQuickReorder} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📦</span>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Pedidos Rápidos</h3>
            <p className="text-xs text-gray-500">Repita su última compra al instante.</p>
         </button>
         <button type="button" onClick={scrollToHistory} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</span>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Mis Facturas</h3>
            <p className="text-xs text-gray-500">Historial y comprobantes de compra.</p>
         </button>
         <button type="button" onClick={handleRouteStatus} className="bg-[#4CAF50] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:bg-green-600 transition-all cursor-pointer group relative overflow-hidden">
            {lastOrder?.status === 'En Ruta' && (
              <div className="absolute inset-0 bg-green-500 animate-pulse opacity-50 z-0"></div>
            )}
            <span className="text-4xl mb-2 z-10">🚚</span>
            <h3 className="font-bold text-white text-lg z-10">Ver estado de Ruta</h3>
         </button>
      </div>

      {notice && (
        <div
          role="status"
          className={`mb-8 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            notice.type === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Plantillas de Compra Rápida (Self-serve) */}
      <B2BTemplatesSection
        initialTemplates={templates}
        allProducts={allProducts.length > 0 ? allProducts : bulkPicks}
        accent="yellow"
      />

      {/* Suggested Products */}
      <div className="mb-6 flex justify-between items-end">
         <div>
           <h2 className="text-2xl font-black text-slate-800 font-serif">Catálogo Mayorista Relevante</h2>
           <p className="text-gray-500 text-sm mt-1">Recomendaciones dinámicas basadas en disponibilidad e historial</p>
         </div>
         <Link href="/" className="text-sm font-bold text-yellow-600 hover:text-yellow-700 underline">Ver todo el catálogo</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {bulkPicks.map(p => (
            <ProductCard key={p.id} product={p} />
         ))}
      </div>
    </div>
  );
}
