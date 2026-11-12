import React from 'react';
import Link from 'next/link';
import { fetchOrderTrackingById } from '@/src/actions/tracking';
import { ActiveOrderStatusTracker } from '@/src/components/orders/ActiveOrderStatusTracker';
import { ArrowLeft, Home, Search, Package, PhoneCall } from 'lucide-react';

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tracking = await fetchOrderTrackingById(id);

  if (!tracking) {
    const whatsappHelpUrl =
      'https://wa.me/573112694676?text=' +
      encodeURIComponent(`¡Hola Surtifruver La Gaviota! 🧺 Tengo dudas con el rastreo de mi pedido #${id}. ¿Me ayudan a verificarlo?`);

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-lg text-center">
          <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Pedido No Encontrado</h1>
          <p className="text-slate-600 text-sm mb-6">
            No encontramos ningún pedido registrado con el identificador #{id}. Verifica el código o comunícate con nosotros por WhatsApp.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/pedidos"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Search size={15} /> Rastrear Otro Pedido
              </Link>
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                <Home size={15} /> Ir a la Tienda
              </Link>
            </div>
            <a
              href={whatsappHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs transition-colors"
            >
              <PhoneCall size={14} /> Consultar con un Asesor por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-700 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Volver a Mis Pedidos</span>
        </Link>
        <span className="text-xs text-slate-400 font-mono">ID: {tracking.orderId}</span>
      </div>

      <ActiveOrderStatusTracker 
        tracking={tracking} 
        title={`Seguimiento en Vivo: Pedido ${tracking.displayNumber}`} 
      />
    </div>
  );
}

