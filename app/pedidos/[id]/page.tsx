import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchOrderTrackingById } from '@/src/actions/tracking';
import { ActiveOrderStatusTracker } from '@/src/components/orders/ActiveOrderStatusTracker';
import { ArrowLeft, Home, ShoppingBag, Package } from 'lucide-react';

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tracking = await fetchOrderTrackingById(id);

  if (!tracking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-lg text-center">
          <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Pedido No Encontrado</h1>
          <p className="text-slate-600 text-sm mb-6">
            No encontramos ningún pedido registrado con el identificador #{id}. Verifica el código o comunícate con nosotros.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-700 text-white font-bold text-sm hover:bg-red-800 transition-colors shadow-sm"
            >
              <Home size={15} /> Ir a la Tienda
            </Link>
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              <ShoppingBag size={15} /> Mis Pedidos
            </Link>
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

