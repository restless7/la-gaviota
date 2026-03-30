import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] relative pb-20 overflow-x-hidden">
      
      {/* Absolute Full-Width Sweeping Top Curve */}
      <div className="absolute top-0 left-[50%] w-[100vw] -ml-[50vw] h-[350px] z-0 overflow-hidden">
        <svg 
          className="absolute top-0 w-full h-full object-cover min-w-[1440px]" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="#CC0000" fillOpacity="1" d="M0,0L1440,0L1440,224C1280,320,800,96,0,192Z" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Top Header Layer (Stepper + Logo) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          
          {/* Progress Stepper */}
          <div className="w-full max-w-2xl">
            <div className="flex justify-between items-center relative text-white uppercase text-[10px] md:text-xs font-bold tracking-wider">
              {/* Connecting Line */}
              <div className="absolute top-2 left-0 w-full h-[2px] bg-white/30 z-0"></div>
              <div className="absolute top-2 left-0 w-1/3 h-[2px] bg-white z-0"></div>

              {/* Steps */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                 <div className="w-4 h-4 rounded-full bg-white opacity-100"></div>
                 <span>Tu Carrito</span>
              </div>
              
              <div className="relative z-10 flex flex-col items-center gap-2">
                 {/* Active Step Indicator (Double circle) */}
                 <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center bg-transparent">
                   <div className="w-2 h-2 rounded-full bg-white"></div>
                 </div>
                 <span>Datos de Envío</span>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-2 opacity-60">
                 <div className="w-4 h-4 rounded-full bg-white"></div>
                 <span>Medios de Pago</span>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-2 opacity-60">
                 <div className="w-4 h-4 rounded-full bg-white"></div>
                 <span>Confirmar Pedido</span>
              </div>
            </div>
          </div>

          {/* Logo Right Side */}
          <div className="hidden md:flex justify-end">
             <Link href="/">
               <Image 
                 src="/IMAGES/logo.jpeg" 
                 alt="La Gaviota Logo" 
                 width={160} 
                 height={64} 
                 className="object-contain drop-shadow-md bg-white rounded-xl p-2"
               />
             </Link>
          </div>
        </div>

        {/* Main Content Split: Form and Summary */}
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column: Form Section */}
          <div className="flex-1 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 relative overflow-hidden">
             
             {/* Shipping Section */}
             <div className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Dirección de Envío</h2>
                <p className="text-gray-500 text-sm mb-6">Por favor, ingresa tu dirección para un envío chévere.</p>
                
                <div className="flex flex-col gap-5">
                   {/* Address */}
                   <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-800 mb-2">Dirección de Envío</label>
                      <input type="text" className="border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#CC0000]/50 transition-all" placeholder="Dirección de Envío" />
                   </div>
                   
                   {/* City & Zip */}
                   <div className="flex gap-5">
                      <div className="flex flex-col flex-1">
                        <label className="text-sm font-semibold text-slate-800 mb-2">Ciudad</label>
                        <input type="text" className="border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#CC0000]/50 transition-all" placeholder="Ciudad" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <label className="text-sm font-semibold text-slate-800 mb-2">Código Postal</label>
                        <input type="text" className="border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#CC0000]/50 transition-all" placeholder="Código" />
                      </div>
                   </div>

                   {/* Shipping Method */}
                   <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-800 mb-2">Método de Envío</label>
                      <select className="border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#CC0000]/50 transition-all text-gray-500 bg-white">
                         <option>Método de Envío</option>
                         <option>Domicilio Local (Gratis $50k+)</option>
                         <option>Recogida en Bodega</option>
                      </select>
                   </div>
                </div>
             </div>

             <hr className="border-gray-100 mb-10" />

             {/* Payment Section */}
             <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Pago</h2>
                
                <div className="flex flex-col gap-5">
                   {/* Card Number */}
                   <div className="flex flex-col relative">
                      <label className="text-sm font-semibold text-slate-800 mb-2">Número de Tarjeta</label>
                      <input type="text" className="border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#CC0000]/50 transition-all pl-4 pr-12" placeholder="Número de Tarjeta" />
                      <div className="absolute right-4 bottom-3.5 text-gray-400">
                         {/* Simple Card Icon */}
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                         </svg>
                      </div>
                   </div>
                   
                   {/* Expiry & CVV */}
                   <div className="flex gap-5">
                      <div className="flex flex-col flex-1">
                        <label className="text-sm font-semibold text-slate-800 mb-2">Fecha de Expiración</label>
                        <select className="border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#CC0000]/50 transition-all text-gray-500 bg-white">
                           <option>Fecha / YYE</option>
                        </select>
                      </div>
                      <div className="flex flex-col flex-1">
                        <label className="text-sm font-semibold text-slate-800 mb-2">CVV</label>
                        <input type="text" className="border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#CC0000]/50 transition-all" placeholder="CVV" />
                      </div>
                   </div>
                </div>
             </div>

             {/* Submit Action */}
             <div className="flex justify-end mt-10">
                <button className="bg-[#CC0000] hover:bg-red-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 text-sm">
                   Continuar al Pago
                </button>
             </div>
          </div>

          {/* Right Column: Cart Summary Sidebar */}
          <div className="w-full lg:w-80">
             <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                   <h3 className="font-bold text-slate-900">Tu Carrito</h3>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                   </svg>
                </div>

                <div className="flex flex-col gap-6 mb-8">
                   {/* Item 1 */}
                   <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative border border-gray-200">
                         {/* Fallback box for placeholder */}
                         <div className="text-xl">🍅</div>
                      </div>
                      <div className="flex-1">
                         <h4 className="text-sm font-bold text-slate-800 leading-tight">Brachoxita<br/><span className="text-xs font-normal text-gray-500">Marrecoa</span></h4>
                         <p className="text-xs text-slate-500 mt-1">Qty: 1</p>
                      </div>
                      <div className="text-sm font-bold text-slate-800">$15.60</div>
                   </div>

                   {/* Item 2 */}
                   <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative border border-gray-200">
                         <div className="text-xl">🥬</div>
                      </div>
                      <div className="flex-1">
                         <h4 className="text-sm font-bold text-slate-800 leading-tight">Votancn<br/><span className="text-xs font-normal text-gray-500">Manscoa</span></h4>
                         <p className="text-xs text-slate-500 mt-1">Qty: 1</p>
                      </div>
                      <div className="text-sm font-bold text-slate-800">$12.50</div>
                   </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
                   <div className="flex justify-between text-sm text-gray-500 font-medium">
                      <span>Subtotal</span>
                      <span>$13.00</span>
                   </div>
                   <div className="flex justify-between text-base font-black text-slate-900 mt-2">
                      <span>Total</span>
                      <span>$35.30</span>
                   </div>
                </div>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
