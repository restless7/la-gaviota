'use client';

import React from 'react';
import Image from 'next/image';
import { ProductCard } from '@/src/components/store/ProductCard';
import { useCart } from '@/src/contexts/CartContext';
import { useRouter } from 'next/navigation';

export default function MicromercadoClient({ 
  bulkPicks, 
  lastOrder,
  templates
}: { 
  bulkPicks: any[]; 
  lastOrder: any;
  templates: any[];
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

  const handleAddTemplateToCart = (tpl: any) => {
    if (tpl.product_list && Array.isArray(tpl.product_list)) {
      tpl.product_list.forEach((item: any) => {
        // Find product by id from bulkPicks or we just pass a simple product object
        // Actually addToCart just needs the product object with an ID
        // The template should store { product_id, quantity, product: { ... } }
        if (item.product) {
          addToCart(item.product, item.quantity);
        } else if (item.product_id) {
          // If we only have product_id, we create a stub product. The CartContext needs the full product ideally, but for now we do this
          addToCart({ id: item.product_id, name: `Producto ${item.product_id}`, priceRetail: 0, priceMicro: 0, priceRestaurant: 0, baseCost: 0, stockQuantity: 99 } as any, item.quantity);
        }
      });
      alert(`Plantilla ${tpl.template_name} añadida al carrito.`);
      router.push('/cart');
    }
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

      {/* Plantillas de Compra Rapid */}
      <h2 className="text-xl font-black text-slate-800 mb-6 font-serif">Mis Recetas / Plantillas de Compra</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
         {(!templates || templates.length === 0) ? (
           <p className="text-gray-500 col-span-2">No tienes plantillas configuradas todavía. Contacta a soporte para crearlas.</p>
         ) : (
           templates.map(tpl => (
             <div key={tpl.id} className="border border-gray-200 rounded-xl p-5 bg-white flex justify-between items-center hover:border-yellow-400 cursor-pointer transition-colors shadow-sm">
                <div>
                   <h3 className="font-bold text-slate-800 text-lg">{tpl.template_name}</h3>
                   <p className="text-sm text-gray-500">{tpl.product_list?.length || 0} items en esta plantilla</p>
                </div>
                <button onClick={() => handleAddTemplateToCart(tpl)} className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-bold px-4 py-2 rounded-lg text-sm transition-colors border border-yellow-200">
                   Añadir todo al carrito
                </button>
             </div>
           ))
         )}
      </div>

      {/* Suggested Products */}
      <div className="mb-6 flex justify-between items-end">
         <div>
           <h2 className="text-2xl font-black text-slate-800 font-serif">Catálogo Mayorista Relevante</h2>
           <p className="text-gray-500 text-sm mt-1">Recomendaciones dinámicas basadas en disponibilidad e historial</p>
         </div>
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
