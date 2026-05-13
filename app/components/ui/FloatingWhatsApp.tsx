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
        className="bg-white px-12 py-6 rounded-full shadow-2xl border-4 border-gaviota-green text-2xl font-black text-slate-800 mb-1 flex items-center gap-4"
      >
        <span className="relative flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gaviota-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-6 w-6 bg-gaviota-green"></span>
        </span>
        ¡Chatea con Gaviota! 24/7
      </motion.div>
      
      {/* FAB Button with Image */}
      <motion.button 
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        className="w-80 h-80 bg-white rounded-full flex items-center justify-center shadow-[0_20px_60px_-10px_rgba(37,211,102,0.5)] transition-all relative overflow-hidden border-8 border-gaviota-green group"
        aria-label="¡Chatea con Gaviota!"
      >
        <div className="absolute inset-0 bg-gaviota-green opacity-0 group-hover:opacity-10 transition-opacity z-0"></div>
        <Image 
          src="/IMAGES/whatsapp-button-seagull.jpeg"
          alt="WhatsApp Gaviota"
          fill
          className="object-cover p-2 rounded-full z-10"
        />
      </motion.button>
    </div>
  );
}
