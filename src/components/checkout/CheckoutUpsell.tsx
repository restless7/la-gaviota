'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import type { Product } from '@/src/actions/products';

export function CheckoutUpsell() {
  const { addToCart, items } = useCart();
  const { role } = useUserRole();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Real catalog SKU recommendations aligned with database IDs, prices, and public/PRODUCTS assets
  const recommendations: (Product & { details: string; isEco?: boolean })[] = React.useMemo(() => {
    const pickTierPrice = (retail: number, micro: number, restaurant: number) =>
      role === 'Restaurantes' ? restaurant : role === 'Micromercados' ? micro : retail;

    return [
      {
        id: 'prd_0019',
        name: 'Limón taití',
        category: 'FRUTAS',
        subcategory: 'Cítricos',
        unit: '500 gr',
        price: pickTierPrice(3494, 3214, 2935),
        previousPrice: null,
        stockQuantity: 100,
        isActive: true,
        isInSeason: true,
        imageUrl: '/PRODUCTS/prd_0019-limon-taiti.jpg',
        description: 'Limón Taití fresco y jugoso de Santander.',
        details: '500 gr · Fresco del campo',
        isEco: true,
      },
      {
        id: 'prd_0050',
        name: 'Aguacate papelillo',
        category: 'FRUTAS',
        subcategory: null,
        unit: '500 gr',
        price: pickTierPrice(3575, 3289, 3003),
        previousPrice: null,
        stockQuantity: 100,
        isActive: true,
        isInSeason: true,
        imageUrl: '/PRODUCTS/prd_0050-aguacate-papelillo.jpg',
        description: 'Aguacate Papelillo cremoso seleccionado.',
        details: '500 gr · Selección especial',
      },
      {
        id: 'prd_0155',
        name: 'Miel botella grande',
        category: 'VARIOS',
        subcategory: null,
        unit: 'Botella',
        price: pickTierPrice(3494, 3214, 2935),
        previousPrice: null,
        stockQuantity: 100,
        isActive: true,
        isInSeason: true,
        imageUrl: '/PRODUCTS/prd_0155-miel-de-abejas-botella-grande.jpg',
        description: 'Miel de abejas 100% pura.',
        details: 'Botella · 100% Natural',
      },
    ];
  }, [role]);

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
                <Image src={rec.imageUrl || '/IMAGES/product-display.jpeg'} alt={rec.name} fill sizes="56px" unoptimized className="object-contain p-1" />
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
