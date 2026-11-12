'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/src/actions/products';
import { ProductCard } from '@/src/components/store/ProductCard';
import { B2BTemplatesSection, type BuyingTemplate } from '@/src/components/portals/B2BTemplatesSection';
import { initializeWompiBalancePayment } from '@/src/actions/wompi';
import Script from 'next/script';

interface CreditProfile {
  credit_balance?: number | null;
}

export default function RestauranteClient({ 
  wholesalePicks, 
  allProducts = [],
  monthlySpend, 
  creditProfile, 
  templates 
}: { 
  wholesalePicks: Product[]; 
  allProducts?: Product[];
  monthlySpend: number; 
  creditProfile: CreditProfile | null; 
  templates: BuyingTemplate[];
}) {
  const [notice, setNotice] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  const handlePayWithWompi = async () => {
    setNotice(null);
    const Widget = window.WidgetCheckout;
    if (!process.env.NEXT_PUBLIC_WOMPI_PUB_KEY || !Widget) {
      setNotice({ type: 'error', text: 'El pago en línea no está disponible en este momento.' });
      return;
    }
    const amount = creditProfile?.credit_balance || 0;
    if (amount <= 0) {
      setNotice({ type: 'info', text: 'No tiene saldo pendiente de pago.' });
      return;
    }
    
    try {
      const wompiData = await initializeWompiBalancePayment(amount);
      const widget = new Widget({
        currency: wompiData.currency,
        amountInCents: wompiData.amountInCents,
        reference: wompiData.reference,
        publicKey: wompiData.publicKey,
        signature: { integrity: wompiData.signature },
        customerData: wompiData.customerData
      });

      widget.open((result) => {
        const status = result.transaction?.status;
        if (status === 'APPROVED' || status === 'PENDING') {
           setNotice({
             type: 'info',
             text: `Respuesta de pago recibida. Verifica la confirmación de tu saldo en Mi Portal. Referencia #${wompiData.reference}.`,
           });
        } else {
           setNotice({ type: 'error', text: 'El pago no se completó. Revisa el estado antes de reintentar.' });
        }
      });
    } catch (error) {
      console.error(error);
      setNotice({ type: 'error', text: 'Error inicializando el pago de saldo.' });
    }
  };

  return (
    <div className="animate-fade-in">
      {process.env.NEXT_PUBLIC_WOMPI_PUB_KEY && <Script src="https://checkout.wompi.co/widget.js" strategy="lazyOnload" />}
      {/* Welcome & Wholesale Banner Premium UI */}
      <div className="w-full relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl mb-12 flex flex-col md:flex-row min-h-[400px] lg:min-h-[450px]">
        <div className="absolute inset-0 md:w-1/2 right-0 left-auto z-0 h-64 md:h-full">
           <Image src="/IMAGES/mi-portal.jpeg" alt="Portal Restaurantes" fill className="object-cover object-center" priority />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:hidden"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-8 md:p-16 lg:p-20 md:w-2/3">
           <div className="inline-flex items-center gap-2 mb-6">
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-black tracking-widest uppercase px-5 py-2 rounded-full backdrop-blur-md">
                 Dashboard Mayorista B2B
              </span>
           </div>
           <h1 className="text-5xl lg:text-7xl font-black text-white font-serif mb-6 leading-tight drop-shadow-md">
             Portal <span className="text-blue-400 block">Restaurantes</span>
           </h1>
           <p className="text-gray-300 font-medium text-lg max-w-xl md:mx-0">
             Gestione sus insumos diarios con la máxima eficiencia. Sus precios mayoristas ya han sido aplicados automáticamente a todo el catálogo.
           </p>
        </div>
      </div>

      {/* Professional Dashboard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Gasto Mes Actual</span>
            <span className="text-2xl font-black text-slate-800 mt-2">${monthlySpend.toLocaleString()}</span>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Plantillas de Menú</span>
            <span className="text-2xl font-black text-slate-800 mt-2">{templates.length} Activas</span>
         </div>
         <button onClick={handlePayWithWompi} className="bg-[#1C2059] hover:bg-[#151842] text-white p-5 rounded-2xl shadow-sm flex items-center justify-between group transition-colors">
            <span className="font-bold text-lg">Pagar Saldo <br/>con Wompi</span>
            <span className="text-3xl group-hover:translate-x-2 transition-transform">→</span>
         </button>
      </div>

      {/* Plantillas de Compra Rápida (Self-serve) */}
      {notice && (
        <div
          role={notice.type === 'error' ? 'alert' : 'status'}
          className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${
            notice.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-blue-200 bg-blue-50 text-blue-900'
          }`}
        >
          {notice.text}
        </div>
      )}
      <B2BTemplatesSection
        initialTemplates={templates}
        allProducts={allProducts.length > 0 ? allProducts : wholesalePicks}
        accent="blue"
      />

      {/* Suggested Products */}
      <div className="mb-6 flex justify-between items-end">
         <div>
           <h2 className="text-2xl font-black text-slate-800 font-serif">Catálogo Mayorista Relevante</h2>
           <p className="text-gray-500 text-sm mt-1">Recomendaciones dinámicas basadas en disponibilidad e historial</p>
         </div>
         <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-800 underline">Ir a compras</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {wholesalePicks.map(p => (
            <ProductCard key={p.id} product={p} />
         ))}
      </div>
    </div>
  );
}
