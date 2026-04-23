'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_IMAGES = [
  '/IMAGES/hero-main1.jpeg',
  '/IMAGES/hero-main2.jpeg',
];

export default function HeroBanner() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 8000); // Slow rotation every 8 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full aspect-video bg-[#f8f9fa] overflow-hidden">
      {/* Background Image Rotation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImage}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <Image
            src={HERO_IMAGES[currentImage]}
            alt="La Gaviota Hero"
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        </motion.div>
      </AnimatePresence>

      {/* Red Wave Overlay (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
        <svg viewBox="0 0 1440 320" className="w-full h-auto translate-y-2" preserveAspectRatio="none">
          <path 
            fill="#E30613" 
            fillOpacity="1" 
            d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,176C672,160,768,160,864,181.3C960,203,1056,245,1152,245.3C1248,245,1344,203,1392,181.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Content Overlay - Just the button now since text is on the image */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end items-center pb-12 md:pb-24 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="pointer-events-auto"
        >
          <button className="bg-[#E30613] hover:bg-red-700 text-white font-black py-4 px-10 rounded-full text-lg shadow-[0_10px_30px_rgba(227,6,19,0.5)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 border-2 border-white/20">
            Comprar Ahora
            <span className="text-2xl">→</span>
          </button>
        </motion.div>
      </div>

      {/* Floating Mascot */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute bottom-24 right-4 md:right-20 z-30 w-32 md:w-56 pointer-events-none drop-shadow-2xl"
      >
        <Image 
          src="/IMAGES/mascota.jpeg" 
          alt="Gaviota Mascot" 
          width={224} 
          height={224} 
          className="object-contain"
        />
      </motion.div>
    </section>
  );
}
