'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { DeliveryScheduler } from '@/src/components/checkout/DeliveryScheduler';
import { CheckoutUpsell } from '@/src/components/checkout/CheckoutUpsell';
import { submitCheckoutOrder } from '@/src/actions/checkoutAction';
import { initializeWompiTransaction } from '@/src/actions/wompi';
import Script from 'next/script';

const wompiConfigured = Boolean(process.env.NEXT_PUBLIC_WOMPI_PUB_KEY);

export default function CheckoutPage() {
   const { items, cartTotal, remainingForFreeShipping, clearCart, cartRestoreError } = useCart();
   const { role, firstName, lastName, userEmail, businessName } = useUserRole();
   const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'cash'>('cash');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [selectedCity, setSelectedCity] = useState('Bucaramanga');
   const [wompiReady, setWompiReady] = useState(false);
   const [submitError, setSubmitError] = useState('');
   const [confirmation, setConfirmation] = useState<{
      orderId: string;
      total: number;
      paymentPending: boolean;
      customerName?: string;
      city?: string;
      address?: string;
   } | null>(null);

   const formatPrice = (price: number) => {
     return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
   };

   let deliveryCost = 10000;
   if (items.length === 0 || remainingForFreeShipping === 0) {
      deliveryCost = 0;
   } else {
      if (selectedCity === 'Bucaramanga') deliveryCost = 5000;
      else if (selectedCity === 'Floridablanca' || selectedCity === 'Girón') deliveryCost = 8000;
   }
   
   const finalTotal = cartTotal + deliveryCost;



   const handleOrderSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isSubmitting) return;
      setSubmitError('');
      if (paymentMethod === 'wompi' && (!wompiReady || !window.WidgetCheckout)) {
         setSubmitError('El pago en línea aún no está listo. Espera un momento o elige contra entrega.');
         return;
      }
      setIsSubmitting(true);
      try {
         const formData = new FormData(e.currentTarget);
         const checkoutItems = items.map(i => ({ product: i.product, quantity: i.quantity }));
         if (paymentMethod === 'wompi') {
            const wompiData = await initializeWompiTransaction(formData, checkoutItems, finalTotal);
            const Widget = window.WidgetCheckout;
            if (!Widget) throw new Error('No se pudo abrir el medio de pago.');
            const widget = new Widget({
               currency: wompiData.currency,
               amountInCents: wompiData.amountInCents,
               reference: wompiData.reference,
               publicKey: wompiData.publicKey,
               signature: { integrity: wompiData.signature },
               customerData: wompiData.customerData,
            });
            widget.open((result) => {
               const status = result.transaction?.status;
               if (status === 'APPROVED' || status === 'PENDING') {
                  // The widget response is not authoritative payment confirmation.
                  setConfirmation({ orderId: wompiData.orderId, total: wompiData.totalAmount, paymentPending: true });
                  if (status === 'APPROVED') clearCart();
               } else {
                  setSubmitError('El pago no se completó. Tu carrito se conserva; revisa el estado del pedido en Mi Portal antes de reintentar.');
               }
               setIsSubmitting(false);
            });
         } else {
            const idempotencyKey = `CHK-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const result = await submitCheckoutOrder(formData, checkoutItems, finalTotal, idempotencyKey);
            const customerFullName = `${formData.get('firstName') || ''} ${formData.get('lastName') || ''}`.trim();
            const customerCity = String(formData.get('city') || selectedCity || '');
            const customerAddress = String(formData.get('address') || '');
            setConfirmation({
               orderId: result.orderId,
               total: result.totalAmount,
               paymentPending: false,
               customerName: customerFullName,
               city: customerCity,
               address: customerAddress,
            });
            clearCart();
            setIsSubmitting(false);
         }
      } catch (error) {
         setSubmitError(error instanceof Error ? error.message : 'No pudimos procesar tu pedido. Intenta nuevamente.');
         setIsSubmitting(false);
      }
   };

   if (confirmation) {
      const whatsappMessage = encodeURIComponent(
         `¡Hola Surtifruver La Gaviota! 🧺 Acabo de registrar mi pedido #${confirmation.orderId} (${role}) por valor de ${formatPrice(confirmation.total)}${confirmation.city ? ` para entrega en ${confirmation.city}` : ''}${confirmation.address ? ` (${confirmation.address})` : ''}. ¡Gracias!`
      );
      const whatsappUrl = `https://wa.me/573184990826?text=${whatsappMessage}`;

      return (
         <section className="mx-auto max-w-2xl px-4 py-16 text-center" aria-live="polite">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
               ✅
            </div>
            <span className="mb-2 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
               Nivel de Cliente: {role}
            </span>
            <h1 className="mb-3 text-3xl font-black text-slate-900">¡Tu pedido está registrado!</h1>
            <p className="break-all font-mono text-sm font-bold text-slate-600">Pedido #{confirmation.orderId}</p>
            <div className="my-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
               <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Confirmado</p>
               <p className="mt-1 text-3xl font-black text-slate-900">{formatPrice(confirmation.total)}</p>
               {confirmation.city && (
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                     Destino: {confirmation.address ? `${confirmation.address}, ` : ''}{confirmation.city}
                  </p>
               )}
            </div>
            <p className="mb-8 text-sm text-slate-600">{confirmation.paymentPending
               ? 'El estado definitivo del pago se confirma en Mi Portal. Una respuesta del medio de pago puede tardar en actualizarse.'
               : 'Elegiste Pago Contra Entrega. Alistaremos tus productos frescos del campo y puedes consultar el estado en Mi Portal o confirmar por WhatsApp.'}</p>
            <div className="flex flex-wrap justify-center gap-3">
               <Link 
                  href={`/pedidos/${confirmation.orderId}`}
                  className="rounded-xl bg-slate-900 px-6 py-3 font-black text-white shadow-md hover:bg-slate-800 transition-colors flex items-center gap-2"
               >
                  <span>🚚 Rastrear Pedido en Vivo</span>
               </Link>
               <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#25D366] px-6 py-3 font-black text-white shadow-md hover:bg-[#1ebe57]"
               >
                  📲 Enviar Comprobante por WhatsApp
               </a>
               <Link href="/dashboard" className="rounded-xl bg-[#E30613] px-6 py-3 font-bold text-white shadow-sm hover:bg-[#c90510]">
                  Ver Mi Portal
               </Link>
               <Link href="/" className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-800 hover:bg-slate-50">
                  Seguir comprando
               </Link>
            </div>
         </section>
      );
   }

   if (cartRestoreError) return <div role="alert" className="p-8">{cartRestoreError}</div>;

   if (items.length === 0) {
      return (
         <div className="max-w-3xl mx-auto px-4 py-32 text-center text-slate-800">
            <span className="text-6xl mb-6 block">💳</span>
            <h1 className="text-3xl font-black font-serif mb-4">No hay pedido por finalizar</h1>
            <Link href="/" className="text-[#83b745] font-bold underline hover:text-[#6c9c36]">Volver a la tienda</Link>
         </div>
      );
   }

   const minOrderMicromercados = 150000;
   const minOrderRestaurantes = 300000;

   if (role === 'Micromercados' && cartTotal < minOrderMicromercados) {
      return (
         <div className="max-w-3xl mx-auto px-4 py-32 text-center text-slate-800">
            <span className="text-6xl mb-6 block">⚠️</span>
            <h1 className="text-3xl font-black font-serif mb-4">No se ha alcanzado el pedido mínimo</h1>
            <p className="text-gray-500 mb-6">El pedido mínimo para tu perfil (Micromercados) es de {formatPrice(minOrderMicromercados)}.</p>
            <p className="font-bold text-yellow-600 mb-8">Faltan {formatPrice(minOrderMicromercados - cartTotal)} para poder proceder.</p>
            <Link href="/" className="text-[#83b745] font-bold underline hover:text-[#6c9c36]">Seguir comprando</Link>
         </div>
      );
   }

   if (role === 'Restaurantes' && cartTotal < minOrderRestaurantes) {
      return (
         <div className="max-w-3xl mx-auto px-4 py-32 text-center text-slate-800">
            <span className="text-6xl mb-6 block">⚠️</span>
            <h1 className="text-3xl font-black font-serif mb-4">No se ha alcanzado el pedido mínimo</h1>
            <p className="text-gray-500 mb-6">El pedido mínimo para tu perfil (Restaurantes) es de {formatPrice(minOrderRestaurantes)}.</p>
            <p className="font-bold text-green-600 mb-8">Faltan {formatPrice(minOrderRestaurantes - cartTotal)} para poder proceder.</p>
            <Link href="/" className="text-[#83b745] font-bold underline hover:text-[#6c9c36]">Seguir comprando</Link>
         </div>
      );
   }

   return (
      <div className="bg-white min-h-screen">
         {wompiConfigured && <Script src="https://checkout.wompi.co/widget.js" strategy="lazyOnload" onReady={() => setWompiReady(true)} onError={() => setSubmitError('No se pudo cargar el pago en línea. Puedes elegir contra entrega.')} />}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full text-slate-800">
            
            {/* Breadcrumbs matching Cart */}
            <div className="flex justify-center items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-12 sm:mb-16 flex-wrap">
               <Link href="/cart" className="text-gray-400 hover:text-slate-900 transition-colors">Carrito</Link>
               <span className="text-gray-300">›</span>
               <span className="text-slate-900 border-b-2 border-slate-900 pb-1">Finalizar pedido</span>
               <span className="text-gray-300">›</span>
               <span className="text-gray-400">Confirmación</span>
            </div>


            <form onSubmit={handleOrderSubmit} className="flex flex-col lg:flex-row gap-12 items-start">
               <input type="hidden" name="paymentMethod" value={paymentMethod} />
               {/* Checkout Form - Left */}
               <div className="w-full lg:w-7/12">
                  <DeliveryScheduler />

                  <h2 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-wider">Detalles de Facturación y Entrega</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label htmlFor="checkout-firstName" className="text-[13px] font-bold text-slate-800">Nombre *</label>
                        <input required id="checkout-firstName" name="firstName" type="text" defaultValue={firstName || ''} className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] focus:ring-1 focus:ring-[#83b745] transition-colors" />
                     </div>
                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label htmlFor="checkout-lastName" className="text-[13px] font-bold text-slate-800">Apellidos *</label>
                        <input required id="checkout-lastName" name="lastName" type="text" defaultValue={lastName || ''} className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] focus:ring-1 focus:ring-[#83b745] transition-colors" />
                     </div>
                     
                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label htmlFor="checkout-company" className="text-[13px] font-bold text-slate-800">Nombre de la empresa (opcional)</label>
                        <input id="checkout-company" name="company" type="text" defaultValue={businessName || ''} className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">País / Región *</label>
                        <p className="font-bold text-slate-900 border border-transparent py-2">Colombia</p>
                        <input type="hidden" name="country" value="Colombia" />
                     </div>

                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label htmlFor="checkout-address" className="text-[13px] font-bold text-slate-800">Dirección de la calle *</label>
                        <input required id="checkout-address" name="address" type="text" placeholder="Número de la casa y nombre de la calle" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>
                     <div className="flex flex-col gap-1.5 justify-end min-w-0">
                        <input aria-label="Apartamento, habitación u otra indicación" name="apartment" type="text" placeholder="Apartamento, habitación, etc. (opcional)" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label htmlFor="checkout-neighborhood" className="text-[13px] font-bold text-slate-800">Barrio (opcional)</label>
                        <input id="checkout-neighborhood" name="neighborhood" type="text" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label htmlFor="checkout-state" className="text-[13px] font-bold text-slate-800">Estado / Municipio *</label>
                        <select required id="checkout-state" name="state" className="w-full border border-gray-300 bg-white rounded-sm px-3 py-2 outline-none focus:border-[#83b745]">
                           <option>Santander</option>
                           <option>Bogotá D.C.</option>
                           <option>Cundinamarca</option>
                        </select>
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label htmlFor="checkout-city" className="text-[13px] font-bold text-slate-800">Localidad / Ciudad *</label>
                        <select required id="checkout-city" name="city" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full border border-gray-300 bg-white rounded-sm px-3 py-2 outline-none focus:border-[#83b745]">
                           <option value="">Elige una opción...</option>
                           <option value="Bucaramanga">Bucaramanga</option>
                           <option value="Floridablanca">Floridablanca</option>
                           <option value="Girón">Girón</option>
                           <option value="Piedecuesta">Piedecuesta</option>
                           <option value="Bogotá Norte">Bogotá Norte</option>
                           <option value="Bogotá Sur">Bogotá Sur</option>
                        </select>
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label htmlFor="checkout-zipcode" className="text-[13px] font-bold text-slate-800">Código postal (opcional)</label>
                        <input id="checkout-zipcode" name="zipcode" type="text" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label htmlFor="checkout-phone" className="text-[13px] font-bold text-slate-800">Teléfono *</label>
                        <input required id="checkout-phone" name="phone" type="tel" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>
                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label htmlFor="checkout-email" className="text-[13px] font-bold text-slate-800">Dirección de correo electrónico *</label>
                        <input required id="checkout-email" name="email" type="email" defaultValue={userEmail || ''} className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 mt-4 min-w-0">
                        <label htmlFor="checkout-notes" className="text-[13px] font-bold text-slate-800">Notas del pedido (opcional)</label>
                        <textarea id="checkout-notes" name="notes" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors h-24 resize-none" placeholder="Notas sobre tu pedido, por ejemplo, notas especiales para la entrega."></textarea>
                     </div>
                  </div>
               </div>

               {/* Order Summary - Right */}
               <div className="w-full lg:w-5/12">
                  <div className="border border-green-700 p-6 md:p-8 bg-white top-8 z-10 sticky outline outline-4 outline-[#83b745] outline-offset-[-4px]">
                     <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b border-gray-300 pb-3">
                        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
                           Tu Pedido
                        </h2>
                        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-800">
                           Tarifa: {role}
                        </span>
                     </div>
                     
                     <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">
                        <span>Producto</span>
                        <span>Subtotal</span>
                     </div>

                     <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-gray-200">
                        {items.map(item => {
                           const price = role === 'Restaurantes' ? item.product.price : role === 'Micromercados' ? item.product.price : item.product.price;
                           return (
                              <div key={item.product.id} className="flex justify-between items-start gap-4">
                                 <div className="text-[13px] text-gray-600 font-semibold leading-tight pr-6">
                                    <span className="text-slate-800">{item.product.name}</span>
                                    <span className="text-gray-400 font-black ml-2 whitespace-nowrap">× {item.quantity}</span>
                                 </div>
                                 <span className="text-[13px] font-bold text-slate-800 whitespace-nowrap">{formatPrice(price * item.quantity)}</span>
                              </div>
                           );
                        })}
                     </div>

                     <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-200">
                        <span className="text-[13px] font-bold text-slate-800">Subtotal</span>
                        <span className="text-[13px] font-bold text-slate-800">{formatPrice(cartTotal)}</span>
                     </div>

                     <div className="mb-6 pb-6 border-b border-gray-200">
                        <span className="text-[13px] font-bold text-slate-800 block mb-3">Envío</span>
                        <div className="flex flex-col gap-2">
                           <label className="flex items-start gap-2 text-[13px] text-slate-800 font-medium">
                              <input type="radio" readOnly checked={remainingForFreeShipping === 0} className="mt-0.5 accent-[#83b745]" />
                              <span>
                                 <span className="font-bold">&apos;Pa los amigos el domicilio es gratis</span>
                                 {remainingForFreeShipping > 0 && <span className="block text-gray-500 font-normal">Faltan {formatPrice(remainingForFreeShipping)} para activar.</span>}
                              </span>
                           </label>
                           <label className="flex items-center gap-2 text-[13px] text-slate-800 font-medium">
                              <input type="radio" readOnly checked={remainingForFreeShipping > 0} className="mt-0.5 accent-[#83b745]" />
                              <span>Envío Estimado {selectedCity ? `(${selectedCity})` : ''}: <span className="font-bold">{remainingForFreeShipping > 0 ? formatPrice(deliveryCost) : formatPrice(0)}</span></span>
                           </label>
                        </div>
                     </div>

                     <div className="flex justify-between items-end mb-8 pt-2">
                        <span className="text-[14px] font-bold text-slate-800">Total</span>
                        <span className="text-2xl font-black text-slate-900">{formatPrice(finalTotal)}</span>
                     </div>

                     <CheckoutUpsell />

                     <div className="mt-8 flex flex-col gap-3">
                        {/* Wompi Payment Option */}
                        <label 
                           className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'wompi' ? 'border-[#1C2059] bg-blue-50/30 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                           onClick={() => { if (wompiConfigured) setPaymentMethod('wompi'); }}
                        >
                           <div className="flex items-center justify-between mb-4">
                              <span className="font-black text-slate-800 text-sm flex items-center gap-3">
                                 <input type="radio" checked={paymentMethod === 'wompi'} disabled={!wompiConfigured} readOnly className="accent-[#1C2059] w-4 h-4 scale-125" />
                                 💳 Paga en línea de forma segura
                              </span>
                              <div className="flex gap-2 shrink-0 h-6">
                                 <span className="font-black tracking-tight text-[#1C2059]">Wompi</span>
                              </div>
                           </div>
                           
                           {/* Wompi UI Dropdown Drawer */}
                           {paymentMethod === 'wompi' && (
                              <div className="bg-white border border-blue-100 rounded-xl p-4 text-center mt-2 shadow-sm animate-in fade-in zoom-in-95">
                                 <h4 className="font-black text-[22px] tracking-tighter text-[#1C2059] mb-2 flex items-center justify-center gap-1">
                                    Pagos con <span className="text-blue-600">Wompi</span>
                                 </h4>
                                 <p className="text-[11px] text-gray-500 font-semibold leading-relaxed mb-4 max-w-[200px] mx-auto">
                                    Tarjetas de Crédito, PSE, Nequi y más. Pago procesado por Wompi.
                                 </p>
                                 <div className="flex justify-center items-center gap-2 pt-2 border-t border-gray-100 uppercase text-[9px] font-extrabold tracking-widest text-blue-600/70">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                    Pago en línea con Wompi
                                 </div>
                              </div>
                           )}
                        </label>

                        {!wompiConfigured && <p className="text-sm text-slate-600">El pago en línea todavía no está habilitado. Puedes elegir contra entrega.</p>}
                        {/* Cash on Delivery Option */}
                        <label 
                           className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-[#83b745] bg-[#83b745]/5' : 'border-gray-200 hover:border-gray-300'}`}
                           onClick={() => setPaymentMethod('cash')}
                        >
                           <div className="flex items-center justify-between">
                              <span className="font-black text-slate-800 text-sm flex items-center gap-3">
                                 <input type="radio" checked={paymentMethod === 'cash'} readOnly className="accent-[#83b745] w-4 h-4 scale-125" />
                                 💵 Pago Contra Entrega
                              </span>
                           </div>
                        </label>
                     </div>

                     {submitError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{submitError}</p>}
                     <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-6 bg-[#83b745] hover:bg-[#6c9c36] text-white py-4 rounded-sm font-black tracking-wide text-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#83b745]/30"
                     >
                        {isSubmitting ? 'PROCESANDO...' : (paymentMethod === 'wompi' ? 'PAGAR DE FORMA SEGURA' : 'CONFIRMAR PEDIDO CONTRA ENTREGA')}
                     </button>
                     
                     <p className="text-[9px] text-gray-500 font-medium leading-relaxed mt-6 text-justify">
                        En La Gaviota SAS, estamos comprometidos con la protección de tus datos personales. 
                        Recopilamos información como nombre, dirección, teléfono y correo electrónico para 
                        procesar pedidos, gestionar envíos y brindarte una mejor experiencia como usuario. 
                        Uso de datos: Utilizamos tus datos exclusivamente con fines comerciales para gestionar 
                        ventas, realizar entregas y ofrecerte información sobre productos o promociones. 
                     </p>
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
}
