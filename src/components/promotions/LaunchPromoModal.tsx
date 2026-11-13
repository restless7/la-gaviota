'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Sparkles, CheckCircle2, ShoppingBag } from 'lucide-react';

interface LaunchPromoModalProps {
  onClose: () => void;
}

const PROMO_TIERS = [
  {
    percent: 15,
    minAmount: 100000,
    minAmountText: '$100.000',
    title: '¡Lanzamiento Web!',
    badge: '15% DE DESCUENTO',
    description: 'En compras superiores a $100.000 COP. ¡Merca más chévere!',
    posterUrl: '/PROMOTIONS/descuento-15-lanzamiento.jpg',
    colorClasses: 'from-amber-500 to-red-600 border-amber-300',
  },
  {
    percent: 25,
    minAmount: 200000,
    minAmountText: '$200.000',
    title: '¡Oferta de Lanzamiento!',
    badge: '25% DE DESCUENTO',
    description: 'En compras superiores a $200.000 COP. ¡Compra en nuestra web!',
    posterUrl: '/PROMOTIONS/descuento-25-lanzamiento.jpg',
    colorClasses: 'from-red-600 to-amber-600 border-red-300',
  },
  {
    percent: 35,
    minAmount: 300000,
    minAmountText: '$300.000',
    title: '¡Gran Lanzamiento!',
    badge: '35% DE DESCUENTO',
    description: 'En compras superiores a $300.000 COP. ¡El ahorro máximo para tu hogar!',
    posterUrl: '/PROMOTIONS/descuento-35-lanzamiento.jpg',
    colorClasses: 'from-red-700 to-yellow-600 border-yellow-300',
  },
];

export function LaunchPromoModal({ onClose }: LaunchPromoModalProps) {
  const [selectedTierIndex, setSelectedTierIndex] = useState(2); // default to 35%
  const currentTier = PROMO_TIERS[selectedTierIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col md:flex-row overflow-hidden">
        
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal de promociones"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
        >
          <X size={20} />
        </button>

        {/* Poster Showcase Left */}
        <div className="relative w-full md:w-1/2 min-h-[340px] md:min-h-[540px] bg-gradient-to-br from-red-700 via-amber-600 to-red-800 flex items-center justify-center p-4">
          <div className="relative w-full h-full min-h-[300px] md:min-h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={currentTier.posterUrl}
              alt={currentTier.badge}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Content & Tier Selector Right */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between bg-white">
          
          <div>
            <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              <Sparkles size={14} className="text-red-600" /> Válido por 1 Semana
            </div>

            <h2 id="promo-modal-title" className="text-2xl sm:text-3xl font-black text-slate-900 font-serif leading-tight">
              ¡Gran Lanzamiento Web La Gaviota!
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              Celebramos la apertura de nuestra tienda en línea con <strong>descuentos automáticos</strong> escalonados. ¡Entre más mercas, más ahorras!
            </p>

            {/* Interactive Tier Buttons */}
            <div className="mt-6 space-y-3">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Selecciona una escala de descuento:
              </span>
              
              {PROMO_TIERS.map((tier, idx) => {
                const isSelected = selectedTierIndex === idx;
                return (
                  <button
                    key={tier.percent}
                    type="button"
                    onClick={() => setSelectedTierIndex(idx)}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-red-600 bg-red-50/70 shadow-sm ring-2 ring-red-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm bg-gradient-to-br ${tier.colorClasses}`}>
                        {tier.percent}%
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-800">
                            {tier.badge}
                          </p>
                          {isSelected && <CheckCircle2 size={15} className="text-red-600" />}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Compras superiores a <strong>{tier.minAmountText}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-red-700">Ver Afiche</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>✓ Descuento se aplica automáticamente en carrito</span>
              <span>✓ Domicilio Gratis en AMB</span>
            </div>

            <Link
              href="/"
              onClick={onClose}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-center text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={18} />
              <span>¡Comenzar a Mercar con Descuento!</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
