'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function PromotionalBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative w-full aspect-square md:aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl group cursor-pointer"
      >
        <Image
          src="/IMAGES/kit-chevere-semana.jpg"
          alt="Kit Chévere de la Semana"
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-1000"
        />
        
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-12 items-center">
          <button className="bg-[#E30613] text-white font-black py-3 px-8 rounded-full shadow-[0_10px_30px_rgba(227,6,19,0.4)] hover:bg-white hover:text-[#E30613] transition-all transform hover:scale-105 active:scale-95 text-lg">
             ¡Lo quiero ya!
          </button>
        </div>
        
        {/* Floating elements decoration */}
        <div className="absolute top-10 right-10 opacity-20 hidden md:block">
           <svg className="w-32 h-32 text-white fill-current" viewBox="0 0 100 100">
              <path d="M50 0 L100 50 L50 100 L0 50 Z" />
           </svg>
        </div>
      </motion.div>
    </section>
  );
}
