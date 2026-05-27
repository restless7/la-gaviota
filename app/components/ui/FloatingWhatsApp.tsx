'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingWhatsApp() {
  const [isHovered, setIsHovered] = useState(false);
  const [isShrunk, setIsShrunk] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShrunk(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const shouldBeLarge = !isShrunk || isHovered;

  return (
    <div 
      className="fixed bottom-4 left-4 md:bottom-6 md:right-6 md:left-auto z-50 flex flex-col md:items-end items-start gap-2 isolate"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip — only visible when large */}
      <AnimatePresence>
        {shouldBeLarge && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-white px-3 py-1.5 rounded-full shadow-lg border-2 border-gaviota-green flex items-center gap-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gaviota-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gaviota-green"></span>
            </span>
            <span className="text-xs font-bold text-slate-800 whitespace-nowrap">Chatea con Gaviota</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* FAB Button with Image */}
      <motion.button 
        initial={{ scale: 0, rotate: -15 }}
        animate={{ 
          scale: shouldBeLarge ? 1 : 0.55, 
          rotate: shouldBeLarge ? (isHovered ? 5 : 0) : 0
        }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{ 
          marginTop: shouldBeLarge ? 0 : '-30px',
          marginLeft: shouldBeLarge ? undefined : '-10px',
          transition: 'margin 0.4s ease'
        }}
        className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-white rounded-full flex items-center justify-center shadow-[0_15px_50px_-10px_rgba(37,211,102,0.5)] relative overflow-hidden border-2 md:border-4 border-gaviota-green group origin-bottom-left md:origin-bottom-right"
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

