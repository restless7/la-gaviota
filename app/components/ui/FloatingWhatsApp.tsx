'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function FloatingWhatsApp() {
  return (
    <div className="fixed bottom-4 left-4 md:bottom-6 md:right-6 md:left-auto z-50 flex flex-col md:items-end items-start gap-2 md:gap-3 isolate">
      {/* Tooltip/Hook Message */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="bg-white px-4 py-2 md:px-8 md:py-3 rounded-full shadow-2xl border-2 md:border-4 border-gaviota-green text-sm md:text-lg font-black text-slate-800 mb-0 md:mb-1 flex items-center gap-2 md:gap-3"
      >
        <span className="relative flex h-3 w-3 md:h-4 md:w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gaviota-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-gaviota-green"></span>
        </span>
        <span className="hidden md:inline">¡Chatea con Gaviota! 24/7</span>
        <span className="md:hidden">¡Chatea aquí!</span>
      </motion.div>
      
      {/* FAB Button with Image */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className="w-20 h-20 md:w-32 md:h-32 lg:w-48 lg:h-48 bg-white rounded-full flex items-center justify-center shadow-[0_15px_50px_-10px_rgba(37,211,102,0.5)] transition-all relative overflow-hidden border-2 md:border-4 border-gaviota-green group ml-2 md:ml-0"
        aria-label="¡Chatea con Gaviota!"
      >
        <div className="absolute inset-0 bg-gaviota-green opacity-0 group-hover:opacity-10 transition-opacity z-0"></div>
        <Image 
          src="/IMAGES/whatsapp-button-seagull.jpeg"
          alt="WhatsApp Gaviota"
          fill
          className="object-cover p-1 md:p-1.5 rounded-full z-10"
        />
      </motion.button>
    </div>
  );
}
