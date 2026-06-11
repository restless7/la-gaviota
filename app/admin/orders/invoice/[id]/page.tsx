"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchOrderById, Order } from '@/src/actions/orders';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function InvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (id) {
        const data = await fetchOrderById(id);
        setOrder(data);
        setLoading(false);
        // Auto print after a short delay to let layout compute
        setTimeout(() => {
          window.print();
        }, 500);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center font-bold text-gray-500">Cargando Factura...</div>;
  }

  if (!order) {
    return <div className="p-10 text-center font-bold text-red-500">Pedido no encontrado</div>;
  }

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 print:p-0 text-slate-800">
      {/* Non-printable controls */}
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link href="/admin/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-bold">
          <ArrowLeft className="w-4 h-4" /> Volver a Pedidos
        </Link>
        <button 
          onClick={() => window.print()} 
          className="bg-[#1C2059] hover:bg-[#2A2F7A] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> Imprimir Documento
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div className="max-w-4xl mx-auto border border-gray-200 print:border-none p-8 sm:p-12 print:p-0 rounded-2xl">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-black text-[#E30613] font-serif tracking-tight mb-2">LA GAVIOTA</h1>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Fruver & Distribución</p>
            <div className="mt-4 text-sm text-gray-600">
              <p>NIT: 900.000.000-1</p>
              <p>Bucaramanga, Santander</p>
              <p>Tel: +57 300 000 0000</p>
              <p>ventas@lagaviotafruver.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black text-slate-800 mb-2">REMISIÓN</h2>
            <p className="text-sm font-bold text-gray-500 uppercase">Documento de Venta</p>
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Nº de Orden</p>
              <p className="text-lg font-black font-mono text-slate-800">{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Fecha de Emisión</p>
              <p className="font-bold text-slate-800">{new Date(order.created_at).toLocaleDateString('es-CO')}</p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-slate-50 p-6 rounded-xl border border-gray-100 mb-8">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Facturar a:</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="font-black text-lg text-slate-800 mb-1">{order.customer_name}</p>
              <p className="text-sm text-gray-600 mb-1">{order.customer_email}</p>
              <p className="text-sm text-gray-600">{order.customer_phone}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 mb-1">Dirección de Entrega:</p>
              <p className="text-sm text-gray-600 mb-1">{order.delivery_address}</p>
              <p className="text-sm text-gray-600">{order.delivery_municipality}</p>
              <p className="text-sm font-bold mt-2 text-slate-500">Método de Pago: <span className="uppercase text-slate-800">{order.payment_method}</span></p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Descripción del Producto</th>
                <th className="py-3 text-center text-xs font-black text-gray-500 uppercase tracking-wider">Cant.</th>
                <th className="py-3 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                <th className="py-3 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.order_items?.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 font-bold text-slate-800">{item.product_name}</td>
                  <td className="py-4 text-center font-bold text-slate-600">{item.quantity}</td>
                  <td className="py-4 text-right text-gray-600">${item.price_at_purchase.toLocaleString('es-CO')}</td>
                  <td className="py-4 text-right font-black text-slate-800">${(item.quantity * item.price_at_purchase).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer & Totals */}
        <div className="flex justify-end border-t-2 border-gray-800 pt-8 mt-12">
          <div className="w-1/2">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-gray-500 uppercase">Subtotal</span>
              <span className="font-bold text-slate-800">${order.total_amount.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-gray-500 uppercase">Envío / Logística</span>
              <span className="font-bold text-slate-800">$0</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-4 mt-2">
              <span className="text-lg font-black text-slate-800 uppercase">Total Final</span>
              <span className="text-3xl font-black text-[#E30613]">${order.total_amount.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Notas del Pedido:</h4>
            <p className="text-sm text-gray-600 italic">{order.notes}</p>
          </div>
        )}

        <div className="mt-16 text-center text-xs text-gray-400 font-bold">
          <p>Este documento es un soporte de operación logística y venta.</p>
          <p>Gracias por confiar en La Gaviota Fruver.</p>
        </div>
      </div>
    </div>
  );
}
