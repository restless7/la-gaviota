import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/src/components/store/ProductCard';
import { fetchProducts } from '@/src/actions/products';
import { CustomerOrderHistory } from '@/src/components/portals/CustomerOrderHistory';
import { ActiveCustomerOrderBanner } from '@/src/components/orders/ActiveCustomerOrderBanner';

export default async function RetailDashboard() {
  const products = await fetchProducts();

  // Consumer-friendly: Filter active seasonal fruits & vegetables
  const quickPicks = products.filter(p => p.category === 'FRUTAS' || p.category === 'VERDURAS Y HORTALIZAS').slice(0, 4);

  return (
    <div className="animate-fade-in">
      {/* Active Live Order Tracker (Senior Level Service) */}
      <ActiveCustomerOrderBanner />

      {/* Welcome & Mascot */}
      <div className="flex flex-col md:flex-row items-center bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-100 gap-8 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-20 -mt-20 z-0"></div>
        <div className="w-32 h-32 md:w-48 md:h-48 relative shrink-0 z-10 bg-slate-100 rounded-full overflow-hidden border-4 border-white shadow-lg">
           <Image src="/IMAGES/mascota.jpeg" alt="Mascot Waving" fill className="object-cover" />
        </div>
        <div className="flex-1 z-10 text-center md:text-left">
           <span className="text-[#CC0000] font-black tracking-widest uppercase text-xs sm:text-sm mb-2 block">¡Mercar Chévere! · Tarifa Personas Naturales</span>
           <h1 className="text-3xl lg:text-5xl font-black text-slate-800 font-serif mb-4 leading-tight">
             ¡Hola Familia! <br /> <span className="text-[#4CAF50]">Lo mejor del campo para su mesa</span>
           </h1>
           <p className="text-gray-500 font-medium max-w-xl mx-auto md:mx-0">
             Descubre nuestros kits de la semana y los productos más frescos seleccionados directamente para ti.
           </p>
        </div>
      </div>

      <div id="order-history" className="mb-12">
        <CustomerOrderHistory />
      </div>

      {/* Promos & B2B Upgrade Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         <Link href="/?category=KITS+NEGOCIOS" className="bg-[#FFCC00]/10 border border-[#FFCC00]/30 hover:border-[#FFCC00] rounded-3xl p-6 flex items-center justify-between group overflow-hidden relative transition-all">
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FFCC00]/20 to-transparent"></div>
            <div>
               <h3 className="font-black text-slate-800 text-xl mb-1">Kit Chévere 🧺</h3>
               <p className="text-gray-600 text-sm mb-3">Ahorra con el combo semanal.</p>
               <span className="text-[11px] font-black uppercase tracking-widest text-[#ca8a04] group-hover:underline">Ver Oferta →</span>
            </div>
         </Link>
         <Link href="/" className="bg-[#4CAF50]/10 border border-[#4CAF50]/30 hover:border-[#4CAF50] rounded-3xl p-6 flex items-center justify-between group overflow-hidden relative transition-all">
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#4CAF50]/20 to-transparent"></div>
            <div>
               <h3 className="font-black text-slate-800 text-xl mb-1">Ir al Catálogo 🛒</h3>
               <p className="text-gray-600 text-sm mb-3">Frutas, verduras y carnes frescas.</p>
               <span className="text-[11px] font-black uppercase tracking-widest text-[#4CAF50] group-hover:underline">Comprar Ahora →</span>
            </div>
         </Link>
         <Link href="/aplicar-negocio" className="bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-3xl p-6 flex items-center justify-between group overflow-hidden relative transition-all text-white">
            <div>
               <h3 className="font-black text-[#FFCC00] text-xl mb-1">¿Tienes un Negocio? 🏪</h3>
               <p className="text-slate-300 text-sm mb-3">Activa tarifas para Restaurantes o Micromercados.</p>
               <span className="text-[11px] font-black uppercase tracking-widest text-white group-hover:underline">Solicitar Tarifa Mayorista →</span>
            </div>
         </Link>
      </div>

      {/* Quick Picks Component Call */}
      <h2 className="text-2xl font-black text-slate-800 mb-6 font-serif">Recomendados para el Hogar</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
         {quickPicks.map(p => (
            <ProductCard key={p.id} product={p} />
         ))}
      </div>
    </div>
  );
}
