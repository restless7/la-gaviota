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
  const [nextDelivery, setNextDelivery] = React.useState<string | null>(null);

  React.useEffect(() => {
    setNextDelivery(getNextBusinessDay());
  }, []);

  if (!nextDelivery) {
    return (
      <div className="bg-[#83b745]/50 animate-pulse text-transparent rounded-[2rem] p-8 md:p-10 mb-12 h-48">
        Cargando itinerario...
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#83b745] to-[#6da034] text-white rounded-2xl p-5 md:p-6 shadow-md relative overflow-hidden flex flex-col xl:flex-row items-center justify-between gap-6 border border-[#83b745]/20">
      {/* Decorative Shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-black/5 rounded-full blur-2xl translate-y-1/2 pointer-events-none"></div>

      {/* Left side: Icon & Title */}
      <div className="flex items-center gap-4 z-10 w-full xl:w-auto">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm hidden sm:flex shrink-0 shadow-inner">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
        <div className="text-center sm:text-left w-full">
          <p className="text-sm font-bold text-white/90 uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-2">
            <span className="sm:hidden">🚚</span> Tu pedido llegará el
          </p>
          <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none capitalize flex flex-col sm:flex-row sm:items-baseline gap-2">
             {nextDelivery} 
             <span className="text-base font-semibold text-white/90 normal-case bg-black/10 px-2 py-0.5 rounded-md mt-1 sm:mt-0 inline-block">De 10:00 AM a 5:00 PM</span>
          </h2>
        </div>
      </div>

      {/* Right side: Guarantee & Note */}
      <div className="flex flex-col sm:flex-row items-center gap-4 z-10 shrink-0 w-full xl:w-auto justify-center xl:justify-end">
         <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/30 text-sm font-bold shadow-sm whitespace-nowrap flex items-center gap-2 transition-transform hover:scale-105">
            <span className="text-lg">✅</span> Garantía Sí o Sí
         </div>
         <div className="text-xs text-white/90 font-medium text-center sm:text-left xl:text-right max-w-[240px] leading-snug bg-black/10 sm:bg-transparent p-3 sm:p-0 rounded-lg">
            <span className="mr-1">💡</span> Pedidos después de las <span className="font-bold underline decoration-white/50">8 PM</span> se programan para el siguiente día hábil.
         </div>
      </div>
    </div>
  );
}
