'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Timer, ArrowRight, X } from 'lucide-react';
import { LaunchPromoModal } from './LaunchPromoModal';

export function LaunchPromoBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    // Campaign ends in 7 days from launch (Nov 20, 2026)
    // We compute countdown against Nov 20, 2026 or localStorage/fallback
    const targetDate = new Date('2026-11-20T23:59:59-05:00').getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isDismissed || !timeLeft) return null;

  return (
    <>
      <aside aria-label="Anuncio de descuento de lanzamiento" className="relative z-40 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white py-2 px-3 text-xs sm:text-sm font-bold shadow-md transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center hover:opacity-95 transition-opacity cursor-pointer group"
          >
            <span className="inline-flex items-center gap-1 bg-yellow-300 text-red-900 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              <Sparkles size={12} className="fill-red-900" /> ¡Gran Lanzamiento!
            </span>

            <span className="text-white drop-shadow-xs">
              Hasta <strong>35% DE DESCUENTO</strong> en tu mercado por tiempo limitado
            </span>

            <span className="inline-flex items-center gap-1 bg-black/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-black text-yellow-200 border border-yellow-300/30">
              <Timer size={13} />
              <span>{timeLeft.days}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s</span>
            </span>

            <span className="hidden md:inline-flex items-center gap-0.5 text-xs text-yellow-200 underline group-hover:text-white font-black">
              Ver detalles <ArrowRight size={12} />
            </span>
          </button>

          <button
            type="button"
            aria-label="Cerrar aviso de promoción"
            onClick={() => setIsDismissed(true)}
            className="shrink-0 p-1 text-white/80 hover:text-white rounded-lg hover:bg-black/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </aside>

      {isOpen && (
        <LaunchPromoModal onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

