'use client';
import React from 'react';
import Image from 'next/image';
import { useCart } from '@/src/contexts/CartContext';
import { products } from '@/src/data/products';

export function CheckoutUpsell() {
  const { addToCart } = useCart();
  
  // Fake upsell recommendations mimicking mockup (Zumo de Limon, Flores Comestibles)
  // We grab random related products or specific ones from the local catalog
  const recommendations = React.useMemo(() => {
     return [
        { id: 'u1', name: 'Zumo de Limón x 4 Litros', details: 'Coleman Fresh', price: 42000, img: '/IMAGES/product-display.jpeg', isEco: true },
        { id: 'u2', name: 'Zumo Mandarina', details: '$56,000 /und', price: 56000, img: '/IMAGES/product-display.jpeg', isEco: false },
        { id: 'u3', name: 'Flores comestibles', details: '$9,800 /bja', price: 9800, img: '/IMAGES/product-display.jpeg', isEco: false },
     ];
  }, []);

  const formatPrice = (p: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);

  return (
     <div className="bg-slate-50 border border-gray-200 rounded-[1.5rem] p-5 mt-8 overflow-hidden shadow-sm relative">
         <h3 className="text-center font-black text-[#83b745] text-[15px] mb-6 flex justify-center items-center gap-2">
            ¡Que no se le olvide pa&apos; que no l@ regañen en la casa! <span className="text-xl">🏠</span>
         </h3>

        <div className="flex flex-col gap-4 relative z-10">
           {recommendations.map((rec, i) => (
              <div key={rec.id} className="bg-white border border-gray-200 rounded-xl p-3 flex gap-4 items-center relative">
                 {rec.isEco && (
                    <span className="absolute -top-2 left-2 bg-[#83b745] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 uppercase tracking-widest shadow-sm">
                       ⭐ Recomendado!
                    </span>
                 )}
                 <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden relative shrink-0">
                    <Image src={rec.img} alt={rec.name} fill className="object-cover mix-blend-multiply p-1" />
                 </div>
                 <div className="flex-1 flex flex-col justify-center h-full">
                    <h4 className="font-extrabold text-[13px] text-slate-800 leading-tight">{rec.name}</h4>
                    <p className="text-[11px] font-bold text-gray-500 mt-1">{rec.details === '$' + formatPrice(rec.price) + ' /und' ? '' : rec.details}</p>
                 </div>
                 <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 p-1 rounded-lg shrink-0">
                    <span className="text-[10px] w-4 text-center font-bold text-gray-400">-</span>
                    <span className="text-[11px] w-3 text-center font-black text-slate-800">1</span>
                    <span className="text-[10px] w-4 text-center font-bold text-gray-400">+</span>
                 </div>
                 <button className="bg-[#83b745] hover:bg-[#6c9c36] text-white rounded-md text-[10px] font-black px-3 py-2 uppercase tracking-wide shrink-0 transition-colors shadow-sm">
                    Agregar
                 </button>
              </div>
           ))}
        </div>
     </div>
  );
}
