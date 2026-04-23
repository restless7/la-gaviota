'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface EmptyCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmptyCartModal({ isOpen, onClose }: EmptyCartModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 isolate">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden p-8 flex flex-col items-center text-center border-4 border-gaviota-red"
          >
            <div className="relative w-48 h-48 mb-6">
              <Image 
                src="/IMAGES/empty-cart-seagull.jpeg"
                alt="Carrito Vacío"
                fill
                className="object-contain"
              />
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-4 font-serif">¡Tu carrito está <span className="text-gaviota-red italic">vacío</span>!</h2>
            <p className="text-gray-600 mb-8 font-medium">
              Parece que la gaviota aún no ha recogido tus productos favoritos. ¡Explora lo mejor del campo y llena tu bolsa!
            </p>
            
            <button 
              onClick={onClose}
              className="w-full bg-gaviota-red hover:bg-red-700 text-white font-black py-4 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              Explorar Productos
            </button>
            
            <button 
              onClick={onClose}
              className="mt-4 text-gray-400 font-bold text-sm hover:text-slate-900 transition-colors underline decoration-dotted"
            >
              Cerrar
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
