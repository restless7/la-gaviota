'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileCheck2,
  Package,
  CreditCard,
  Building2,
  RotateCcw,
  AlertCircle,
  Tag
} from 'lucide-react';
import { fetchOrderById, Order } from '@/src/actions/orders';
import { buildWhatsAppChatUrl, buildOrderConfirmationMessage } from '@/src/lib/whatsapp';
import { WhatsAppIcon } from '@/src/components/ui/WhatsAppIcon';

interface InvoiceClientViewProps {
  orderId: string;
  initialOrder: Order | null;
  initialError?: string | null;
}

export default function InvoiceClientView({
  orderId,
  initialOrder,
  initialError
}: InvoiceClientViewProps) {
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [loading, setLoading] = useState<boolean>(!initialOrder);
  const [error, setError] = useState<string | null>(initialError || null);

  useEffect(() => {
    if (order) return;

    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrderById(orderId);
        if (isMounted) {
          setOrder(data);
          if (!data) {
            setError('No pudimos encontrar el pedido solicitado en la base de datos.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('[InvoiceClientView] Error fetching order:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Ocurrió un error inesperado al consultar la orden.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [orderId, order]);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrderById(orderId);
      setOrder(data);
      if (!data) {
        setError('No pudimos encontrar el pedido solicitado en la base de datos.');
      }
    } catch (err: unknown) {
      console.error('[InvoiceClientView] Retry error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error al reintentar la carga del pedido.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E30613] mx-auto mb-4" />
          <p className="text-slate-700 font-black text-sm">Generando Factura y Remisión...</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">Orden: #{orderId.slice(0, 8)}</p>
        </div>
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-50 text-[#E30613] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Orden no encontrada</h1>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            {error || 'No pudimos encontrar el pedido solicitado o no tienes permisos activos de administración.'}
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-xs text-slate-500 font-mono break-all">
            ID: {orderId}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E30613] hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Reintentar Cargar
            </button>
            <Link
              href="/admin/orders"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1C2059] hover:bg-slate-900 text-white rounded-xl font-bold text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a Pedidos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalItemsCount = order.order_items?.length || 0;
  const totalUnitsCount =
    order.order_items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
  const tierLabel =
    order.customer_tier || (order.clerk_user_id ? 'Cliente Registrado' : 'Personas Naturales');
  const isPaid =
    order.payment_status === 'APPROVED' ||
    order.notes?.includes('[PAGO CONFIRMADO]') ||
    order.status === 'Entregado';

  // Calculate product subtotal from items (or fall back to total_amount + discount)
  const calculatedItemsSubtotal =
    order.order_items && order.order_items.length > 0
      ? order.order_items.reduce(
          (sum, item) => sum + Number(item.quantity || 0) * Number(item.price_at_purchase || 0),
          0
        )
      : Number(order.total_amount || 0);

  const discountAmount = Number(order.discount_amount || 0);
  const discountLabel = order.discount_label || 'Descuento de Campaña';

  return (
    <div className="bg-slate-100 min-h-screen py-8 px-4 sm:px-6 print:bg-white print:p-0 print:min-h-0">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 print:hidden">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Tablero de Pedidos
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          {order.customer_phone && (
            <a
              href={buildWhatsAppChatUrl(order.customer_phone, buildOrderConfirmationMessage(order))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black py-2.5 px-4 rounded-xl shadow-sm transition-all text-xs uppercase tracking-wider"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              Enviar Confirmación WhatsApp
            </a>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-[#E30613] hover:bg-red-700 text-white font-black py-2.5 px-5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider"
          >
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Printable Commercial Invoice & Remission Sheet */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none print:max-w-none">
        {/* Top Brand Accent Bar */}
        <div className="h-3 bg-gradient-to-r from-[#E30613] via-[#4CAF50] to-[#1C2059] print:h-2" />

        <div className="p-8 sm:p-10 print:p-6">
          {/* Header: Brand Logo + Official Credentials vs Document Number */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-8 border-b-2 border-slate-900">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Official Logo */}
              <div className="w-36 h-24 rounded-2xl border border-gray-200 bg-white p-2 flex items-center justify-center shrink-0 shadow-sm print:shadow-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/IMAGES/logo.jpeg"
                  alt="Surtifruver La Gaviota"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    Surtifruver La Gaviota
                  </h1>
                </div>
                <p className="text-xs font-black text-[#E30613] uppercase tracking-widest">
                  NIT: 1007193202-05
                </p>
                <div className="text-xs text-slate-600 space-y-0.5 pt-1 font-medium">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Plaza de Mercado San Francisco, Calle 13 #22-49, Local 10 — Bucaramanga, Santander
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Tel / WhatsApp: <span className="font-bold text-slate-800">+57 311 2694676</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Correo: <span className="font-bold text-slate-800">lagaviotaverduras@gmail.com</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Document Metadata Box */}
            <div className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 md:text-right shrink-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1C2059] text-white text-[10px] font-black uppercase tracking-widest mb-2">
                <FileCheck2 className="w-3 h-3" /> Factura & Remisión
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Consecutivo de Orden
              </p>
              <p className="text-2xl font-black text-[#E30613] font-mono tracking-tight">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]" title={order.id}>
                ID: {order.id}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-0.5">
                <p>
                  <span className="font-bold text-slate-500">Emisión:</span>{' '}
                  {new Date(order.created_at).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {order.scheduled_delivery_date && (
                  <p>
                    <span className="font-bold text-slate-500">Fecha Entrega:</span>{' '}
                    <span className="font-black text-slate-800">{order.scheduled_delivery_date}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Logistics Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-gray-200">
            {/* Left Card: Client Details */}
            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Datos del Cliente
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {tierLabel}
                </span>
              </div>

              {order.customer_business_name ? (
                <>
                  <p className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#1C2059]" />
                    {order.customer_business_name}
                  </p>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">
                    Contacto: {order.customer_name}
                  </p>
                </>
              ) : (
                <p className="text-lg font-black text-slate-900">{order.customer_name}</p>
              )}

              <div className="mt-3 space-y-1 text-xs text-slate-600 font-medium">
                <p>
                  <span className="font-bold text-slate-500">Teléfono / WhatsApp:</span>{' '}
                  <span className="font-bold text-slate-800">{order.customer_phone || 'No registrado'}</span>
                </p>
                {order.customer_email && (
                  <p>
                    <span className="font-bold text-slate-500">Correo:</span> {order.customer_email}
                  </p>
                )}
              </div>
            </div>

            {/* Right Card: Shipping & Payment Details */}
            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Destino de Despacho & Pago
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      order.status === 'Entregado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Estado: {order.status}
                  </span>
                </div>

                <p className="text-sm font-black text-slate-900">{order.delivery_address}</p>
                <p className="text-xs font-bold text-[#1C2059] mt-0.5">
                  {order.delivery_municipality}, Santander — Colombia
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Método de Pago:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800 uppercase">
                    {order.payment_method === 'cash' ? 'Efectivo / Contra Entrega' : 'Pago en Línea (Wompi)'}
                  </span>
                  {isPaid && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase">
                      <CheckCircle2 className="w-3 h-3" /> Pagado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Products Table */}
          <div className="my-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#4CAF50]" />
                Detalle de Productos Despachados
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {totalItemsCount} referencia(s) • {totalUnitsCount} unidad(es) totales
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4 w-10 text-center">#</th>
                    <th className="py-3 px-4">Descripción del Producto</th>
                    <th className="py-3 px-3 text-center w-20">Cant.</th>
                    <th className="py-3 px-3 text-center w-20">Verif.</th>
                    <th className="py-3 px-4 text-right w-32">V. Unitario</th>
                    <th className="py-3 px-4 text-right w-36">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {order.order_items?.map((item, idx) => {
                    const lineTotal = Number(item.quantity || 0) * Number(item.price_at_purchase || 0);
                    return (
                      <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="py-3 px-4 text-center font-bold text-slate-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {item.product_name}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block w-4 h-4 border-2 border-slate-400 rounded-sm" />
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 font-medium">
                          ${Number(item.price_at_purchase).toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          ${lineTotal.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
            {/* Left 7 Cols: Delivery Notes & Observations */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Observaciones / Ventana de Entrega
                </h4>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {order.notes
                    ? order.notes
                    : 'Sin observaciones adicionales registradas por el cliente. Producto revisado bajo estándar de calidad fresca La Gaviota.'}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-slate-700">Garantía de Frescura La Gaviota:</strong> Por tratarse de productos
                perecederos de campo, agradecemos verificar el estado y cantidades al momento de la entrega. Cualquier
                novedad comunícala de inmediato a nuestra línea de atención WhatsApp <strong>+57 311 2694676</strong>.
              </div>
            </div>

            {/* Right 5 Cols: Totals Box */}
            <div className="md:col-span-5 bg-slate-900 text-white rounded-2xl p-6 shadow-md print:bg-slate-100 print:text-slate-900 print:border-2 print:border-slate-900">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-300 print:text-slate-600 font-medium">
                  <span>Subtotal Productos ({totalItemsCount} ítems)</span>
                  <span className="font-bold text-white print:text-slate-900">
                    ${calculatedItemsSubtotal.toLocaleString('es-CO')}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-yellow-300 print:text-red-700 font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {discountLabel}
                    </span>
                    <span>-${discountAmount.toLocaleString('es-CO')}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-300 print:text-slate-600 font-medium">
                  <span>Domicilio / Logística</span>
                  <span className="font-bold text-[#4CAF50] print:text-slate-900">Incluido ($0)</span>
                </div>

                <div className="pt-3 border-t border-white/15 print:border-slate-300 flex justify-between items-baseline">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-300 print:text-slate-700">
                    Total a Pagar (COP)
                  </span>
                  <span className="text-2xl font-black text-[#4CAF50] print:text-slate-900">
                    ${Number(order.total_amount).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Physical Delivery Sign-Off / Remission Box */}
          <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 text-center">
              Constancia de Despacho y Recibido a Conformidad (Remisión Física)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
              <div className="border border-slate-300 rounded-xl p-4 h-24 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">
                  Alistado y Despachado por (Bodega)
                </span>
                <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-400">
                  Nombre y Firma Responsable
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-4 h-24 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">
                  Transportador / Ruta
                </span>
                <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-400">
                  Nombre y Hora de Salida
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-4 h-24 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">
                  Recibido a Conformidad (Cliente)
                </span>
                <div className="border-t border-slate-300 pt-1 text-[10px] text-slate-400">
                  Firma, Nombre, C.C. y Sello
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-[11px] text-slate-400 font-bold">
              Surtifruver La Gaviota • NIT: 1007193202-05 • +57 311 2694676 • lagaviotaverduras@gmail.com • www.lagaviotafruver.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
