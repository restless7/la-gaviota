'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/src/contexts/CartContext';
import type { Product } from '@/src/actions/products';

export function CheckoutUpsell() {
  const { addToCart, items } = useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Real catalog SKU recommendations (Limón Tahití, Aguacate Papelillo, Miel Pura)
  const recommendations: (Product & { details: string; isEco?: boolean })[] = React.useMemo(() => {
    return [
      {
        id: 'prd_0023',
        name: 'Limón Tahití',
        category: 'FRUTAS',
        subcategory: 'Cítricos',
        unit: '500 gr',
        price: 2100,
        previousPrice: null,
        stockQuantity: 100,
        isActive: true,
        isInSeason: true,
        imageUrl: '/PRODUCTS/prd_0023-limon-tahiti.jpg',
        description: 'Limón Tahití fresco y jugoso de Santander.',
        details: '500 gr · Fresco del campo',
        isEco: true,
      },
      {
        id: 'prd_0003',
        name: 'Aguacate Papelillo',
        category: 'FRUTAS',
        subcategory: null,
        unit: '500 gr',
        price: 6125,
        previousPrice: null,
        stockQuantity: 100,
        isActive: true,
        isInSeason: true,
        imageUrl: '/PRODUCTS/prd_0003-aguacate-papelillo.jpg',
        description: 'Aguacate Papelillo cremoso seleccionado.',
        details: '500 gr · Selección especial',
      },
      {
        id: 'prd_0131',
        name: 'Miel Pura',
        category: 'VARIOS',
        subcategory: null,
        unit: 'Botella',
        price: 15750,
        previousPrice: null,
        stockQuantity: 100,
        isActive: true,
        isInSeason: true,
        imageUrl: '/PRODUCTS/prd_0131-miel-pura.jpg',
        description: 'Miel de abejas 100% pura.',
        details: 'Botella · 100% Natural',
      },
    ];
  }, []);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);

  const getQty = (id: string) => quantities[id] || 1;
  const changeQty = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }));
  };

  return (
    <div className="bg-slate-50 border border-gray-200 rounded-[1.5rem] p-5 mt-8 overflow-hidden shadow-sm relative">
      <h3 className="text-center font-black text-[#83b745] text-[15px] mb-6 flex justify-center items-center gap-2">
        ¡Que no se le olvide pa&apos; que no l@ regañen en la casa! <span className="text-xl">🏠</span>
      </h3>

      <div className="flex flex-col gap-4 relative z-10">
        {recommendations.map((rec) => {
          const inCart = items.find(i => i.product.id === rec.id);
          const qty = getQty(rec.id);
          return (
            <div key={rec.id} className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3 items-center relative">
              {rec.isEco && (
                <span className="absolute -top-2 left-2 bg-[#83b745] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 uppercase tracking-widest shadow-sm">
                  ⭐ Recomendado!
                </span>
              )}
              <div className="w-14 h-14 bg-slate-50 rounded-lg overflow-hidden relative shrink-0 border border-gray-100">
                <Image src={rec.imageUrl || '/IMAGES/product-display.jpeg'} alt={rec.name} fill sizes="56px" className="object-contain p-1" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-extrabold text-[13px] text-slate-800 leading-tight truncate">{rec.name}</h4>
                <p className="text-[11px] font-bold text-slate-700 mt-0.5">{formatPrice(rec.price)} <span className="text-gray-400 font-medium">/ {rec.unit}</span></p>
              </div>
              <div className="flex items-center gap-1 bg-slate-50 border border-gray-200 p-1 rounded-lg shrink-0">
                <button
                  type="button"
                  aria-label={`Menos ${rec.name}`}
                  onClick={() => changeQty(rec.id, -1)}
                  className="text-xs w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:bg-gray-200 rounded"
                >
                  -
                </button>
                <span className="text-[11px] w-4 text-center font-black text-slate-800">{qty}</span>
                <button
                  type="button"
                  aria-label={`Más ${rec.name}`}
                  onClick={() => changeQty(rec.id, 1)}
                  className="text-xs w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:bg-gray-200 rounded"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => addToCart(rec, qty)}
                className="bg-[#83b745] hover:bg-[#6c9c36] text-white rounded-md text-[10px] font-black px-3 py-2 uppercase tracking-wide shrink-0 transition-colors shadow-sm"
              >
                {inCart ? `+${qty} (${inCart.quantity})` : 'Agregar'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
