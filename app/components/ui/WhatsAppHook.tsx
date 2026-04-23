'use client';

import React from 'react';
import Image from 'next/image';

export default function WhatsAppHook() {
  return (
    <a
      href="https://wa.me/573000000000" // Replace with actual WhatsApp number
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 group flex items-center gap-3 bg-white pr-4 pl-1 py-1 rounded-full shadow-2xl border-2 border-[#4CAF50] hover:scale-105 transition-transform duration-300"
    >
      <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
         <Image 
           src="/IMAGES/mascota.jpeg" 
           alt="Chatea con Gaviota" 
           fill 
           className="object-cover"
         />
      </div>
      <div className="flex flex-col">
         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">24/7 AI Asistente</span>
         <span className="text-sm font-black text-[#4CAF50]">¡Chatea con Gaviota!</span>
      </div>
      {/* Notification Dot */}
      <span className="absolute top-0 right-2 w-3 h-3 bg-[#E30613] rounded-full animate-ping"></span>
      <span className="absolute top-0 right-2 w-3 h-3 bg-[#E30613] border-2 border-white rounded-full"></span>
    </a>
  );
}
