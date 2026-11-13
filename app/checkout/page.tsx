'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { DeliveryScheduler, DELIVERY_TIME_RANGES } from '@/src/components/checkout/DeliveryScheduler';
import { CheckoutUpsell } from '@/src/components/checkout/CheckoutUpsell';
import { submitCashCheckoutAction } from '@/src/actions/checkoutAction';
import { initializeWompiTransaction } from '@/src/actions/wompi';
import { calculateDeliverySchedule } from '@/src/lib/deliveryCutoff';
import { CHECKOUT_CITIES, calculateCheckoutDeliveryCost } from '@/src/lib/checkoutValidation';
import Script from 'next/script';

const wompiConfigured = Boolean(process.env.NEXT_PUBLIC_WOMPI_PUB_KEY);

interface SavedCheckoutProfile {
   firstName?: string;
   lastName?: string;
   company?: string;
   address?: string;
   apartment?: string;
   neighborhood?: string;
   city?: string;
   phone?: string;
   email?: string;
}

export default function CheckoutPage() {
   const { items, cartTotal, remainingForFreeShipping, clearCart, cartRestoreError, discountInfo } = useCart();
   const { role, isSignedIn, firstName, lastName, userEmail, businessName } = useUserRole();
   const [paymentMethod, setPaymentMethod] = useState<'wompi' | 'cash'>('cash');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [selectedCity, setSelectedCity] = useState('Bucaramanga');
   const [selectedTimeRange, setSelectedTimeRange] = useState<string>(DELIVERY_TIME_RANGES[0].value);
   const [savedProfile, setSavedProfile] = useState<SavedCheckoutProfile>({});
   const [wompiReady, setWompiReady] = useState(false);
   const [submitError, setSubmitError] = useState('');
   const [confirmation, setConfirmation] = useState<{
      orderId: string;
      total: number;
      paymentPending: boolean;
      paymentMethod: 'wompi' | 'cash';
      customerName?: string;
      city?: string;
      address?: string;
      timeRange?: string;
      scheduledDateText?: string;
      isAfterCutoff?: boolean;
   } | null>(null);

   useEffect(() => {
      let active = true;
      Promise.resolve().then(() => {
         if (!active) return;
         try {
            const raw = localStorage.getItem('gaviota_saved_checkout_profile');
            if (raw) {
               const parsed = JSON.parse(raw) as SavedCheckoutProfile;
               setSavedProfile(parsed);
               if (parsed.city && (CHECKOUT_CITIES as readonly string[]).includes(parsed.city)) {
                  setSelectedCity(parsed.city);
               }
            }
         } catch {
            // ignore localStorage read errors
         }
      });
      return () => {
         active = false;
      };
   }, []);

   const formatPrice = (price: number) => {
     return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
   };

   const effectiveSubtotal = discountInfo?.hasDiscount ? discountInfo.finalCartTotal : cartTotal;
   const deliveryCost =
      items.length === 0 || remainingForFreeShipping === 0
         ? 0
         : calculateCheckoutDeliveryCost(selectedCity, effectiveSubtotal);

   const finalTotal = effectiveSubtotal + deliveryCost;



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
         // Persist customer details locally so repeat orders prefill automatically
         try {
            const profileToSave: SavedCheckoutProfile = {
               firstName: String(formData.get('firstName') || ''),
               lastName: String(formData.get('lastName') || ''),
               company: String(formData.get('company') || ''),
               address: String(formData.get('address') || ''),
               apartment: String(formData.get('apartment') || ''),
               neighborhood: String(formData.get('neighborhood') || ''),
               city: String(formData.get('city') || selectedCity || 'Bucaramanga'),
               phone: String(formData.get('phone') || ''),
               email: String(formData.get('email') || ''),
            };
            localStorage.setItem('gaviota_saved_checkout_profile', JSON.stringify(profileToSave));
         } catch {
            // ignore storage errors
         }

         const checkoutItems = items.map(i => ({ product: i.product, quantity: i.quantity }));
         const customerFullName = `${formData.get('firstName') || ''} ${formData.get('lastName') || ''}`.trim();
         const customerCity = String(formData.get('city') || selectedCity || '');
         const customerAddress = String(formData.get('address') || '');
         const customerTimeRange = String(formData.get('deliveryTimeRange') || selectedTimeRange || '');
         const markCartRecovered = () => {
            if (!isSignedIn) return;
            fetch('/api/marketing/abandoned-cart/sync', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               keepalive: true,
               body: JSON.stringify({
                  items: checkoutItems,
                  cartTotal,
                  phone: String(formData.get('phone') || ''),
                  email: String(formData.get('email') || ''),
                  isCompleted: true,
               }),
            }).catch(() => {});
         };

         if (paymentMethod === 'wompi') {
            const wompiIdempotencyKey = `WOMPI-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const wompiData = await initializeWompiTransaction(formData, checkoutItems, finalTotal, wompiIdempotencyKey);
            if (!wompiData.ok) {
               setSubmitError(wompiData.error || 'No pudimos procesar tu pago con Wompi. Por favor intenta de nuevo.');
               setIsSubmitting(false);
               return;
            }
            const Widget = window.WidgetCheckout;
            if (!Widget) {
               setSubmitError('No se pudo cargar el medio de pago en línea. Por favor recarga la página o elige Pago Contra Entrega.');
               setIsSubmitting(false);
               return;
            }
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
                  const schedule = calculateDeliverySchedule();
                  setConfirmation({
                     orderId: wompiData.orderId,
                     total: wompiData.totalAmount,
                     paymentPending: status !== 'APPROVED',
                     paymentMethod: 'wompi',
                     customerName: customerFullName,
                     city: customerCity,
                     address: customerAddress,
                     timeRange: customerTimeRange,
                     scheduledDateText: schedule.formattedDate,
                     isAfterCutoff: schedule.isAfterCutoff,
                  });
                  markCartRecovered();
                  clearCart();
               } else {
                  setSubmitError('El pago no se completó. Tu carrito se conserva; revisa el estado del pedido en Mi Portal antes de reintentar.');
               }
               setIsSubmitting(false);
            });
         } else {
            const idempotencyKey = `CHK-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            const result = await submitCashCheckoutAction(formData, checkoutItems, idempotencyKey);
            if (!result.ok) {
               setSubmitError(result.error || 'No pudimos procesar tu pedido. Verifica tus datos e intenta nuevamente.');
               setIsSubmitting(false);
               return;
            }
            const schedule = calculateDeliverySchedule();
            setConfirmation({
               orderId: result.orderId,
               total: result.totalAmount,
               paymentPending: false,
               paymentMethod: 'cash',
               customerName: customerFullName,
               city: customerCity,
               address: customerAddress,
               timeRange: customerTimeRange,
               scheduledDateText: schedule.formattedDate,
               isAfterCutoff: schedule.isAfterCutoff,
            });
            markCartRecovered();
            clearCart();
            setIsSubmitting(false);
         }
      } catch (error) {
         const msg = error instanceof Error && !error.message.includes('Minified React error')
            ? error.message
            : 'No pudimos procesar tu pedido en este momento. Verifica tus datos e intenta nuevamente.';
         setSubmitError(msg);
         setIsSubmitting(false);
      }
   };

   if (confirmation) {
      const deliveryDatePart = confirmation.scheduledDateText ? ` · Entrega programada: ${confirmation.scheduledDateText}` : '';
      const cutoffPart = confirmation.isAfterCutoff ? ' (Pedido realizado después de las 10:00 PM)' : '';
      const whatsappMessage = encodeURIComponent(
         `¡Hola Surtifruver La Gaviota! 🧺 Acabo de registrar mi pedido #${confirmation.orderId} (${role}) por valor de ${formatPrice(confirmation.total)}${confirmation.city ? ` para entrega en ${confirmation.city}` : ''}${confirmation.address ? ` (${confirmation.address})` : ''}${deliveryDatePart}${cutoffPart}${confirmation.timeRange ? ` · Franja: ${confirmation.timeRange}` : ''}. ¡Gracias!`
      );
      const whatsappUrl = `https://wa.me/573112694676?text=${whatsappMessage}`;

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
                     Destino: {confirmation.address ? `${confirmation.address}, ` : ''}{confirmation.city.startsWith('Bogotá') ? confirmation.city : `${confirmation.city}, Santander`}
                  </p>
               )}
               {confirmation.scheduledDateText && (
                  <p className="mt-2 text-xs font-bold text-slate-800">
                     🚚 Entrega estimada: <span className="capitalize font-black underline text-emerald-800">{confirmation.scheduledDateText}</span>
                  </p>
               )}
               {confirmation.isAfterCutoff && (
                  <div className="mt-2 rounded-xl bg-amber-100 p-2.5 text-xs text-amber-900 border border-amber-300 font-medium text-left">
                     ⚠️ <strong>Aviso de corte nocturno:</strong> Al haberse realizado después de las 10:00 PM, este pedido no califica para entrega mañana y ha sido programado para pasado mañana.
                  </div>
               )}
               {confirmation.timeRange && (
                  <p className="mt-1 text-xs font-bold text-emerald-700">
                     ⏰ Franja horaria deseada: {confirmation.timeRange}
                  </p>
               )}
            </div>
            <p className="mb-6 text-sm text-slate-600">{confirmation.paymentPending
               ? 'Tu transacción está pendiente de confirmación (PSE/Nequi). El estado definitivo del pago se actualiza automáticamente y puedes consultarlo en Mi Portal.'
               : confirmation.paymentMethod === 'wompi'
                  ? '¡Pago aprobado con Wompi! Ya enviamos tu pedido a alistamiento en plaza. Puedes seguirlo en vivo desde el rastreador.'
                  : 'Elegiste Pago Contra Entrega. Alistaremos tus productos frescos del campo y puedes consultar el estado en Mi Portal o confirmar por WhatsApp.'}</p>

            {!isSignedIn && (
               <div className="mb-8 rounded-2xl border-2 border-[#83b745]/40 bg-emerald-50/60 p-5 text-left shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div>
                        <p className="text-xs font-black uppercase tracking-wider text-[#5b8726] mb-1">
                           ⚡ Ahorra tiempo en tu próximo mercado
                        </p>
                        <h3 className="text-base font-black text-slate-900">
                           ¡Crea tu cuenta gratis y guarda tu dirección!
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                           No vuelvas a digitar tus datos en futuros pedidos, consulta tu historial y repite tu mercado en 1 clic.
                        </p>
                     </div>
                     <Link
                        href="/sign-up"
                        className="shrink-0 rounded-xl bg-[#83b745] hover:bg-[#6c9c36] px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition-colors"
                     >
                        Crear Cuenta Gratis →
                     </Link>
                  </div>
               </div>
            )}

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
                  <DeliveryScheduler
                     selectedTimeRange={selectedTimeRange}
                     onTimeRangeChange={setSelectedTimeRange}
                  />

                  {/* Account Creation Incentive Banner for Guest Shoppers */}
                  {!isSignedIn ? (
                     <div className="mb-8 rounded-2xl border-2 border-[#83b745]/35 bg-gradient-to-r from-[#f4faeb] via-white to-[#f4faeb] p-5 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                           <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-[#83b745]/30 bg-white hidden sm:block">
                              <Image
                                 src="/IMAGES/checkoutimage.jpeg"
                                 alt="Cuenta La Gaviota"
                                 fill
                                 sizes="64px"
                                 unoptimized
                                 className="object-cover"
                              />
                           </div>
                           <div className="flex-1 min-w-0">
                              <span className="inline-block rounded-full bg-[#83b745]/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#4d751f] mb-1">
                                 ⚡ Compra más rápido la próxima vez
                              </span>
                              <h3 className="text-base font-black text-slate-900 leading-snug">
                                 ¿No quieres volver a digitar tus datos en futuros pedidos?
                              </h3>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                 Crea tu cuenta gratis en segundos con Google o tu correo para guardar tu dirección en Bucaramanga, Floridablanca o Girón y repetir tu mercado en 1 clic.
                              </p>
                           </div>
                           <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                              <Link
                                 href="/sign-up?redirect_url=/checkout"
                                 className="flex-1 sm:flex-none text-center rounded-xl bg-[#83b745] hover:bg-[#6c9c36] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-sm transition-colors"
                              >
                                 Crear Cuenta Gratis
                              </Link>
                              <Link
                                 href="/sign-in?redirect_url=/checkout"
                                 className="flex-1 sm:flex-none text-center rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                              >
                                 Iniciar Sesión
                              </Link>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-bold text-emerald-900">
                           ✅ Sesión activa{firstName ? ` como ${firstName}` : ''} — Tus datos de entrega se guardarán automáticamente para tus próximos pedidos.
                        </p>
                     </div>
                  )}

                  <h2 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-wider">Detalles de Facturación y Entrega</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label htmlFor="checkout-firstName" className="text-[13px] font-bold text-slate-800">Nombre *</label>
                        <input required id="checkout-firstName" name="firstName" type="text" key={`fn-${firstName || savedProfile.firstName || ''}`} defaultValue={firstName || savedProfile.firstName || ''} className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] focus:ring-1 focus:ring-[#83b745] transition-colors" />
                     </div>
                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label htmlFor="checkout-lastName" className="text-[13px] font-bold text-slate-800">Apellidos *</label>
                        <input required id="checkout-lastName" name="lastName" type="text" key={`ln-${lastName || savedProfile.lastName || ''}`} defaultValue={lastName || savedProfile.lastName || ''} className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] focus:ring-1 focus:ring-[#83b745] transition-colors" />
                     </div>
                     
                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label htmlFor="checkout-company" className="text-[13px] font-bold text-slate-800">Nombre de la empresa (opcional)</label>
                        <input id="checkout-company" name="company" type="text" key={`co-${businessName || savedProfile.company || ''}`} defaultValue={businessName || savedProfile.company || ''} className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Región de Cobertura</label>
                        <p className="font-bold text-slate-900 bg-slate-50 border border-gray-200 rounded-sm px-3 py-2 text-sm flex items-center gap-2">
                           <span>🇨🇴</span> Colombia — Santander (AMB) y Bogotá
                        </p>
                        <input type="hidden" name="country" value="Colombia" />
                        <input type="hidden" name="state" value="Santander" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label htmlFor="checkout-city" className="text-[13px] font-bold text-slate-800">Localidad / Ciudad *</label>
                        <select required id="checkout-city" name="city" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full border border-gray-300 bg-white rounded-sm px-3 py-2 outline-none focus:border-[#83b745] font-semibold text-slate-800">
                           {CHECKOUT_CITIES.map((city) => (
                              <option key={city} value={city}>{city}</option>
                           ))}
                        </select>
                     </div>

                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label htmlFor="checkout-address" className="text-[13px] font-bold text-slate-800">Dirección de la calle *</label>
                        <input required id="checkout-address" name="address" type="text" key={`ad-${savedProfile.address || ''}`} defaultValue={savedProfile.address || ''} placeholder="Número de la casa y nombre de la calle" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>
                     <div className="flex flex-col gap-1.5 justify-end min-w-0">
                        <input aria-label="Apartamento, habitación u otra indicación" name="apartment" type="text" key={`ap-${savedProfile.apartment || ''}`} defaultValue={savedProfile.apartment || ''} placeholder="Apartamento, conjunto, torre, etc. (opcional)" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label htmlFor="checkout-neighborhood" className="text-[13px] font-bold text-slate-800">Barrio (opcional)</label>
                        <input id="checkout-neighborhood" name="neighborhood" type="text" key={`nb-${savedProfile.neighborhood || ''}`} defaultValue={savedProfile.neighborhood || ''} placeholder="Ej. Cabecera, Cañaveral, Provenza..." className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label htmlFor="checkout-phone" className="text-[13px] font-bold text-slate-800">Teléfono / WhatsApp *</label>
                        <input required id="checkout-phone" name="phone" type="tel" key={`ph-${savedProfile.phone || ''}`} defaultValue={savedProfile.phone || ''} placeholder="Ej. 311 269 4676" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>
                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label htmlFor="checkout-email" className="text-[13px] font-bold text-slate-800">Dirección de correo electrónico *</label>
                        <input required id="checkout-email" name="email" type="email" key={`em-${userEmail || savedProfile.email || ''}`} defaultValue={userEmail || savedProfile.email || ''} className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 mt-4 min-w-0">
                        <label htmlFor="checkout-notes" className="text-[13px] font-bold text-slate-800">Notas del pedido (opcional)</label>
                        <textarea id="checkout-notes" name="notes" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors h-24 resize-none" placeholder="Notas sobre tu pedido, por ejemplo, portería, punto de referencia o indicaciones de madurez de la fruta."></textarea>
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

                     <div className="flex justify-between items-center mb-3">
                        <span className="text-[13px] font-bold text-slate-800">Subtotal Catálogo</span>
                        <span className="text-[13px] font-bold text-slate-800">{formatPrice(cartTotal)}</span>
                     </div>

                     {discountInfo?.hasDiscount && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <span className="text-base">⚡</span>
                              <div>
                                 <p className="text-xs font-black text-red-800 uppercase tracking-wide">
                                    {discountInfo.discountLabel}
                                 </p>
                                 <p className="text-[10px] text-red-600 font-semibold">
                                    ¡Ahorras {formatPrice(discountInfo.discountAmount)} de Lanzamiento!
                                 </p>
                              </div>
                           </div>
                           <span className="text-sm font-black text-red-700 whitespace-nowrap">
                              -{formatPrice(discountInfo.discountAmount)}
                           </span>
                        </div>
                     )}

                     {discountInfo?.nextTier && (
                        <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-bold flex items-center justify-between">
                           <span>¡Agrega {formatPrice(discountInfo.nextTier.needed)} más para ganar {discountInfo.nextTier.nextPercent}% OFF!</span>
                           <Link href="/" className="underline text-amber-950 font-black ml-2 whitespace-nowrap">Ver más</Link>
                        </div>
                     )}

                     <div className="border-b border-gray-200 mb-6 pb-2" />

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
