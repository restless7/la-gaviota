'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export interface TickerItem {
  id: string;
  name: string;
  price: number;
  delta: number;
  percentage: number;
}

export function LiveMarketTicker({ items }: { items: TickerItem[] }) {
  if (!items || items.length === 0) return null;

  // 1. Filtrar solo los productos que tuvieron variación de precio hoy
  const activeItems = items.filter(item => item.delta !== 0);
  
  // 2. Si no hay ninguno (Fallback State), mostramos solo los primeros 10 para no saturar la pantalla
  const displayItems = activeItems.length > 0 ? activeItems : items.slice(0, 15);

  // 3. Duplicamos solo 1 vez (2 arrays) para el efecto infinito suave (-50% transform)
  const scrollItems = [...displayItems, ...displayItems];

  // 4. Velocidad dinámica constante (aprox 4 segundos de lectura por cada item mostrado)
  const duration = displayItems.length * 4;

  return (
    <div className="w-full bg-slate-50 border-b border-gray-200 overflow-hidden relative flex items-center h-10 select-none">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
      
      <div 
        className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap w-max"
        style={{ animationDuration: `${duration}s` }}
      >
        {scrollItems.map((item, i) => {
          const isUp = item.delta > 0;
          const isDown = item.delta < 0;
          const isNeutral = item.delta === 0;

          return (
            <div 
              key={`${item.id}-${i}`} 
              className="flex items-center gap-2 px-6 border-r border-gray-200 text-[11px] font-bold text-slate-700"
            >
              <span>{item.name}</span>
              
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                isUp ? 'bg-red-50 text-red-600 border-red-100' : 
                isDown ? 'bg-green-50 text-green-600 border-green-100' : 
                'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {isUp && <ArrowUp className="w-3 h-3" />}
                {isDown && <ArrowDown className="w-3 h-3" />}
                {isNeutral && <Minus className="w-3 h-3" />}
                
                <span>
                  {isNeutral ? 'Sin variación' : `${isUp ? '+' : ''}${item.percentage.toFixed(1)}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
