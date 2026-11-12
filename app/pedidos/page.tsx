'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Search, ArrowLeft, Truck, HelpCircle, PhoneCall, ShoppingBag } from 'lucide-react';

export default function OrderLookupPage() {
  const [orderCode, setOrderCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = orderCode.trim();
    if (!clean) {
      setError('Por favor ingresa tu código o identificador de pedido.');
      return;
    }
    setError(null);
    router.push(`/pedidos/${encodeURIComponent(clean)}`);
  };

  const whatsappSupportUrl =
    'https://wa.me/573112694676?text=' +
    encodeURIComponent('¡Hola Surtifruver La Gaviota! 🧺 Quisiera consultar el estado de mi pedido. ¿Me pueden ayudar por favor?');

  return (
    <div className="min-h-[75vh] bg-slate-50 py-12 px-4 sm:px-6 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-700 transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Volver a la Tienda
        </Link>

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Truck size={26} />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Seguimiento en Vivo
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif mt-1">
                Rastrear Mi Pedido
              </h1>
            </div>
          </div>

          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Ingresa el código o identificador de tu compra (lo encuentras en tu confirmación de pantalla o mensaje de WhatsApp) para ver el estado de alistamiento y entrega en tiempo real.
          </p>

          <form onSubmit={handleSearch} className="space-y-4 mb-8">
            <div className="relative">
              <label htmlFor="order-code-input" className="sr-only">
                Código o ID de Pedido
              </label>
              <input
                id="order-code-input"
                type="text"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="Ejemplo: ord_01abcde o tu número de pedido"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-600 focus:ring-0 outline-none text-slate-900 font-medium placeholder-slate-400 text-sm sm:text-base transition-colors"
                autoFocus
              />
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-wider py-4 shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Package size={18} /> Consultar Estado en Vivo
            </button>
          </form>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <HelpCircle size={20} className="text-slate-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">¿Dónde encuentro mi código de pedido?</p>
                <p>
                  Aparece al finalizar la compra como <span className="font-mono font-bold text-slate-700">Pedido #...</span> y en el mensaje resumen enviado por WhatsApp. Si tienes cuenta registrada, puedes verlo en <Link href="/dashboard" className="text-red-700 font-bold underline">Mi Portal</Link>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
              <div className="text-xs text-emerald-900">
                <p className="font-bold flex items-center gap-1.5">
                  <PhoneCall size={14} /> ¿Necesitas ayuda con tu entrega?
                </p>
                <p className="text-emerald-700">Escríbenos directamente a la línea oficial de atención.</p>
              </div>
              <a
                href={whatsappSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-4 py-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-xs rounded-xl shadow-sm transition-colors whitespace-nowrap"
              >
                📲 WhatsApp Soporte
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-slate-800 transition-colors flex items-center gap-1">
            <ShoppingBag size={14} /> Ir a la Tienda
          </Link>
          <span>•</span>
          <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
            Mi Cuenta / Portal
          </Link>
          <span>•</span>
          <Link href="/pqrs" className="hover:text-slate-800 transition-colors">
            Radicar PQRS
          </Link>
        </div>
      </div>
    </div>
  );
}

