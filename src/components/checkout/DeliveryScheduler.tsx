'use client';
import React from 'react';

/**
 * Calculates next business day logic according to Verdulero's parameters.
 */
function getNextBusinessDay() {
  const date = new Date();
  const currentHour = date.getHours();
  
  // Rule: Orders after 8 PM are scheduled for the next-next business day technically
  const addDays = currentHour >= 20 ? 2 : 1;
  date.setDate(date.getDate() + addDays);
  
  // Skip Sundays (0)
  if (date.getDay() === 0) {
     date.setDate(date.getDate() + 1);
  }
  
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
}

export function DeliveryScheduler() {
  const nextDelivery = getNextBusinessDay();

  return (
    <div className="bg-[#83b745] text-white rounded-[2rem] p-8 md:p-10 mb-12 shadow-lg relative overflow-hidden">
      {/* Decorative Circles matching the mockup */}
      <div className="absolute top-4 left-1/4 w-8 h-8 rounded-full bg-white/10 blur-[1px]"></div>
      <div className="absolute top-8 right-16 w-12 h-12 rounded-full bg-white/10 blur-[2px]"></div>
      <div className="absolute bottom-4 right-1/3 w-6 h-6 rounded-full bg-white/10 blur-sm"></div>

      <h2 className="text-center text-xl md:text-[22px] font-black tracking-tight mb-8 relative z-10 flex items-center justify-center gap-3">
        <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        ¡Tu pedido se programa para nuestro siguiente día hábil!
      </h2>

      <div className="flex flex-col gap-4 relative z-10">
         {/* Green Delivery Block */}
         <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center border border-white/30 shadow-sm border-l-4 border-l-white">
            <h3 className="font-bold text-lg mb-2">Tu pedido llegará:</h3>
            <p className="font-black text-xl md:text-2xl capitalize">{nextDelivery} de 10:00 AM a 5:00 PM</p>
         </div>

         {/* Guarantee Block */}
         <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 text-center border border-white/30 shadow-sm border-l-4 border-l-white">
            <p className="font-black md:text-lg flex items-center justify-center gap-2">
               ✅ Garantía de entrega: Tu pedido Sí o Sí llegará el <span className="capitalize">{nextDelivery}</span>
            </p>
         </div>

         {/* Warning Box */}
         <div className="bg-white/10 rounded-xl p-4 text-center mt-2">
            <p className="font-bold italic text-sm md:text-base text-white/90 font-serif">
               💡 Los pedidos después de las 8 PM se programan para el siguiente día hábil de trabajo.
            </p>
         </div>
      </div>
    </div>
  );
}
