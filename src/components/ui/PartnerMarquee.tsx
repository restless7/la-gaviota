'use client';

import React from 'react';

const partners = [
  "La Chispa Roja", "UNAB", "Helados", "San Res", 
  "Universidad Santo Tomás", "La Niñería", "BACCA", "UPB", 
  "Crepes & Waffles", "Restaurante Internacional", "La Reserva"
];

export function PartnerMarquee() {
  return (
    <section className="w-full bg-white py-12 border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
         <h2 className="text-xl md:text-2xl font-black text-gaviota-green tracking-wide uppercase">
            ¡Ellos también confían en nosotros!
         </h2>
      </div>
      
      {/* Seamless infinite marquee container */}
      <div className="relative w-full flex overflow-hidden mask-image-linear-edges group">
         <div className="flex w-max animate-marquee shadow-inner py-4 group-hover:[animation-play-state:paused]">
            {/* Render 2 sets for perfect seamless looping */}
            <div className="flex gap-12 sm:gap-20 items-center px-10 shrink-0">
               {partners.map((partner, i) => (
                  <div key={`set1-${i}`} className="text-gray-400 font-bold text-lg whitespace-nowrap grayscale hover:grayscale-0 transition-all hover:text-[#E30613] cursor-pointer">
                     {partner}
                  </div>
               ))}
            </div>
            <div className="flex gap-12 sm:gap-20 items-center px-10 shrink-0">
               {partners.map((partner, i) => (
                  <div key={`set2-${i}`} className="text-gray-400 font-bold text-lg whitespace-nowrap grayscale hover:grayscale-0 transition-all hover:text-[#E30613] cursor-pointer">
                     {partner}
                  </div>
               ))}
            </div>
         </div>
      </div>
    </section>
  );
}
