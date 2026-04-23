'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { DeliveryScheduler } from '@/src/components/checkout/DeliveryScheduler';
import { CheckoutUpsell } from '@/src/components/checkout/CheckoutUpsell';
import { submitCheckoutOrder } from '@/src/actions/checkoutAction';

export default function CheckoutPage() {
   const { items, cartTotal, remainingForFreeShipping } = useCart();
   const { role } = useUserRole();
   const [paymentMethod, setPaymentMethod] = useState<'bold' | 'cash'>('bold');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const formatPrice = (price: number) => {
     return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
   };

   const deliveryCost = items.length > 0 ? (remainingForFreeShipping === 0 ? 0 : 10000) : 0;
   const finalTotal = cartTotal + deliveryCost;

   const handleOrderSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
         const result = await submitCheckoutOrder(new FormData(e.target as HTMLFormElement));
         alert(`Pedido #${result.orderId} generado exitosamente.\nTotal cobrado: ${formatPrice(finalTotal)}`);
         window.location.href = '/';
      } catch (err) {
         console.error(err);
      } finally {
         setIsSubmitting(false);
      }
   };

   if (items.length === 0) {
      return (
         <div className="max-w-3xl mx-auto px-4 py-32 text-center text-slate-800">
            <span className="text-6xl mb-6 block">💳</span>
            <h1 className="text-3xl font-black font-serif mb-4">No hay pedido por finalizar</h1>
            <a href="/shop" className="text-[#83b745] font-bold underline hover:text-[#6c9c36]">Volver a la tienda</a>
         </div>
      );
   }

   return (
      <div className="bg-white min-h-screen">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full text-slate-800">
            
            {/* Breadcrumbs matching Cart */}
            <div className="flex justify-center items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-12 sm:mb-16 flex-wrap">
               <a href="/cart" className="text-gray-400 hover:text-slate-900 transition-colors">Shopping Cart</a>
               <span className="text-gray-300">›</span>
               <span className="text-slate-900 border-b-2 border-slate-900 pb-1">Checkout Details</span>
               <span className="text-gray-300">›</span>
               <span className="text-gray-400">Order Complete</span>
            </div>

            <p className="text-sm font-bold text-gray-500 mb-8 border-t border-gray-100 pt-8">
               ¿Tienes un cupón? <a href="#" className="text-slate-800 hover:text-[#83b745] underline">Haz clic aquí para introducir tu código</a>
            </p>

            <form onSubmit={handleOrderSubmit} className="flex flex-col lg:flex-row gap-12 items-start">
               {/* Checkout Form - Left */}
               <div className="w-full lg:w-7/12">
                  <DeliveryScheduler />

                  <h2 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-wider">Detalles de Facturación</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Nombre *</label>
                        <input required name="firstName" type="text" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] focus:ring-1 focus:ring-[#83b745] transition-colors" />
                     </div>
                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Apellidos *</label>
                        <input required name="lastName" type="text" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] focus:ring-1 focus:ring-[#83b745] transition-colors" />
                     </div>
                     
                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Nombre de la empresa (opcional)</label>
                        <input name="company" type="text" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">País / Región *</label>
                        <p className="font-bold text-slate-900 border border-transparent py-2">Colombia</p>
                        <input type="hidden" name="country" value="Colombia" />
                     </div>

                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Dirección de la calle *</label>
                        <input required name="address" type="text" placeholder="Número de la casa y nombre de la calle" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>
                     <div className="flex flex-col gap-1.5 justify-end min-w-0">
                        <input name="apartment" type="text" placeholder="Apartamento, habitación, etc. (opcional)" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Barrio (opcional)</label>
                        <input name="neighborhood" type="text" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Estado / Municipio *</label>
                        <select required name="state" className="w-full border border-gray-300 bg-white rounded-sm px-3 py-2 outline-none focus:border-[#83b745]">
                           <option>Santander</option>
                           <option>Bogotá D.C.</option>
                           <option>Cundinamarca</option>
                        </select>
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Localidad / Ciudad *</label>
                        <select required name="city" className="w-full border border-gray-300 bg-white rounded-sm px-3 py-2 outline-none focus:border-[#83b745]">
                           <option value="">Elige una opción...</option>
                           <option>Bucaramanga</option>
                           <option>Floridablanca</option>
                           <option>Bogotá Norte</option>
                           <option>Bogotá Sur</option>
                        </select>
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Código postal (opcional)</label>
                        <input name="zipcode" type="text" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Teléfono *</label>
                        <input required name="phone" type="tel" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>
                     <div className="flex flex-col gap-1.5 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Dirección de correo electrónico *</label>
                        <input required name="email" type="email" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors" />
                     </div>

                     <div className="flex items-center gap-3 md:col-span-2 mt-2">
                        <input type="checkbox" id="create-account" className="w-4 h-4 accent-[#83b745]" />
                        <label htmlFor="create-account" className="text-[13px] font-bold text-slate-800 cursor-pointer">¿Crear una cuenta?</label>
                     </div>
                     <div className="flex items-center gap-3 md:col-span-2">
                        <input type="checkbox" id="diff-address" className="w-4 h-4 accent-[#83b745]" />
                        <label htmlFor="diff-address" className="text-[13px] font-bold text-slate-800 cursor-pointer">¿Enviar a una dirección diferente?</label>
                     </div>

                     <div className="flex flex-col gap-1.5 md:col-span-2 mt-4 min-w-0">
                        <label className="text-[13px] font-bold text-slate-800">Notas del pedido (opcional)</label>
                        <textarea name="notes" className="w-full border border-gray-300 rounded-sm px-3 py-2 outline-none focus:border-[#83b745] transition-colors h-24 resize-none" placeholder="Notas sobre tu pedido, por ejemplo, notas especiales para la entrega."></textarea>
                     </div>
                  </div>
               </div>

               {/* Order Summary - Right */}
               <div className="w-full lg:w-5/12">
                  <div className="border border-green-700 p-6 md:p-8 bg-white top-8 z-10 sticky outline outline-4 outline-[#83b745] outline-offset-[-4px]">
                     <h2 className="text-xl font-bold mb-6 text-slate-800 border-b border-gray-300 pb-2 uppercase tracking-wide">
                        Tu Pedido
                     </h2>
                     
                     <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-200 pb-2">
                        <span>Producto</span>
                        <span>Subtotal</span>
                     </div>

                     <div className="flex flex-col gap-4 mb-6 pb-6 border-b border-gray-200">
                        {items.map(item => {
                           const price = role === 'Restaurantes' ? item.product.priceRestaurant : role === 'Micromercados' ? item.product.priceMicro : item.product.priceRetail;
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
                              <span>Envío BGA y AMB: <span className="font-bold">{formatPrice(10000)}</span></span>
                           </label>
                        </div>
                     </div>

                     <div className="flex justify-between items-end mb-8 pt-2">
                        <span className="text-[14px] font-bold text-slate-800">Total</span>
                        <span className="text-2xl font-black text-slate-900">{formatPrice(finalTotal)}</span>
                     </div>

                     <CheckoutUpsell />

                     <div className="mt-8 flex flex-col gap-3">
                        {/* Bold Payment Option Mockup */}
                        <label 
                           className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'bold' ? 'border-[#3898ec] bg-blue-50/30 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                           onClick={() => setPaymentMethod('bold')}
                        >
                           <div className="flex items-center justify-between mb-4">
                              <span className="font-black text-slate-800 text-sm flex items-center gap-3">
                                 <input type="radio" checked={paymentMethod === 'bold'} readOnly className="accent-[#3898ec] w-4 h-4 scale-125" />
                                 💳 Paga en línea con Bold
                              </span>
                              <div className="flex gap-1 opacity-50 shrink-0 hidden sm:flex">
                                 <div className="w-5 h-3 bg-red-400 rounded-sm"></div>
                                 <div className="w-5 h-3 bg-blue-400 rounded-sm"></div>
                                 <div className="w-5 h-3 bg-green-400 rounded-sm"></div>
                              </div>
                           </div>
                           
                           {/* Bold UI Dropdown Drawer */}
                           {paymentMethod === 'bold' && (
                              <div className="bg-white border border-blue-100 rounded-xl p-4 text-center mt-2 shadow-sm animate-in fade-in zoom-in-95">
                                 <h4 className="font-black text-[22px] tracking-tighter text-[#1C2059] mb-2 flex items-center justify-center gap-1">
                                    b<span className="text-[#3898ec]">●</span>ld
                                 </h4>
                                 <p className="text-[11px] text-gray-500 font-semibold leading-relaxed mb-4 max-w-[200px] mx-auto">
                                    Te llevaremos a la pasarela de pagos Bold para completar tu pago de forma fácil y segura
                                 </p>
                                 <div className="flex justify-center items-center gap-2 pt-2 border-t border-gray-100 uppercase text-[9px] font-extrabold tracking-widest text-[#3898ec]/70">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                    Compra 100% Protegida
                                 </div>
                              </div>
                           )}
                        </label>

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

                     <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-6 bg-[#83b745] hover:bg-[#6c9c36] text-white py-4 rounded-sm font-black tracking-wide text-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#83b745]/30"
                     >
                        {isSubmitting ? 'PROCESANDO...' : (paymentMethod === 'bold' ? 'PAGA EN LÍNEA CON BOLD' : 'CONFIRMAR PEDIDO CONTRA ENTREGA')}
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
