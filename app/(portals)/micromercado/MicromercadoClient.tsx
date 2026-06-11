'use client';

import React from 'react';
import Image from 'next/image';
import { ProductCard } from '@/src/components/store/ProductCard';
import { useCart } from '@/src/contexts/CartContext';
import { useRouter } from 'next/navigation';

export default function MicromercadoClient({ 
  bulkPicks, 
  lastOrder
}: { 
  bulkPicks: any[]; 
  lastOrder: any;
}) {
  const { addToCart } = useCart();
  const router = useRouter();

  const handleQuickReorder = () => {
    if (!lastOrder || !lastOrder.order_items) {
      alert('No se encontró una orden previa para repetir.');
      return;
    }
    
    lastOrder.order_items.forEach((item: any) => {
       if (item.products && item.quantity) {
         addToCart(item.products, item.quantity);
       }
    });
    alert(`Se agregaron ${lastOrder.order_items.length} productos al carrito exitosamente.`);
    router.push('/cart');
  };

  const handleRouteStatus = () => {
    if (!lastOrder) {
      alert('No tiene órdenes activas en ruta.');
      return;
    }
    if (lastOrder.status === 'SHIPPED') {
      alert('¡El camión de La Gaviota está en camino hacia su negocio! Llegada estimada: Hoy antes de las 5:00 PM.');
    } else if (lastOrder.status === 'PENDING' || lastOrder.status === 'PAID') {
      alert('Su orden está siendo preparada en bodega y pronto saldrá a ruta.');
    } else {
      alert(`Estado de su última orden: ${lastOrder.status}`);
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
      {/* Welcome & Wholesale Banner */}
      <div className="flex flex-col md:flex-row items-center bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-200 gap-8 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFCC00]/20 rounded-full blur-3xl -mr-20 -mt-20 z-0"></div>
        <div className="w-32 h-32 md:w-48 md:h-48 relative shrink-0 z-10 bg-slate-100 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
           <Image src="/images/frutas-banner.jpg" alt="Micromercado Banner" fill className="object-cover" />
        </div>
        <div className="flex-1 z-10 text-center md:text-left">
           <span className="text-yellow-600 font-black tracking-widest uppercase text-xs sm:text-sm mb-2 block">Portal Bodega & Micromercados</span>
           <h1 className="text-3xl lg:text-5xl font-black text-slate-800 font-serif mb-4 leading-tight">
             Surta su negocio <span className="text-yellow-600">con la mejor calidad</span>
           </h1>
           <p className="text-gray-500 font-medium max-w-xl mx-auto md:mx-0">
             Inventario fresco garantizado. Disfrute de su tarifa especial &quot;Micromercados&quot; en todos nuestros productos.
           </p>
        </div>
      </div>

      {/* Action Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         <div onClick={handleQuickReorder} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📦</span>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Pedidos Rápidos</h3>
            <p className="text-xs text-gray-500">Repita su última compra al instante.</p>
         </div>
         <div onClick={scrollToHistory} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-yellow-400 hover:shadow-lg transition-all cursor-pointer group">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</span>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Mis Facturas</h3>
            <p className="text-xs text-gray-500">Historial y comprobantes de compra.</p>
         </div>
         <div onClick={handleRouteStatus} className="bg-[#4CAF50] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg hover:bg-green-600 transition-all cursor-pointer group relative overflow-hidden">
            {lastOrder?.status === 'SHIPPED' && (
              <div className="absolute inset-0 bg-green-500 animate-pulse opacity-50 z-0"></div>
            )}
            <span className="text-4xl mb-2 z-10">🚚</span>
            <h3 className="font-bold text-white text-lg z-10">Ver estado de Ruta</h3>
         </div>
      </div>

      {/* Suggested Products */}
      <div className="mb-6 flex justify-between items-end">
         <h2 className="text-2xl font-black text-slate-800 font-serif">Sugeridos para Inventario</h2>
         <a href="/" className="text-sm font-bold text-yellow-600 hover:text-yellow-700 underline">Ver todo el catálogo</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {bulkPicks.map(p => (
            <ProductCard key={p.id} product={p} />
         ))}
      </div>
    </div>
  );
}
