'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function FloatingWhatsApp() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 isolate">
      {/* Tooltip/Hook Message */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="bg-white px-8 py-3 rounded-full shadow-2xl border-4 border-gaviota-green text-lg font-black text-slate-800 mb-1 flex items-center gap-3"
      >
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gaviota-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-gaviota-green"></span>
        </span>
        ¡Chatea con Gaviota! 24/7
      </motion.div>
      
      {/* FAB Button with Image */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-[0_15px_50px_-10px_rgba(37,211,102,0.5)] transition-all relative overflow-hidden border-4 border-gaviota-green group"
        aria-label="¡Chatea con Gaviota!"
      >
        <div className="absolute inset-0 bg-gaviota-green opacity-0 group-hover:opacity-10 transition-opacity z-0"></div>
        <Image 
          src="/IMAGES/whatsapp-button-seagull.jpeg"
          alt="WhatsApp Gaviota"
          fill
          className="object-cover p-1.5 rounded-full z-10"
        />
      </motion.button>
    </div>
  );
}
