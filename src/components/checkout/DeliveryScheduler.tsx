'use client';
import React from 'react';

export const DELIVERY_TIME_RANGES = [
  { id: 'all-day', label: 'Jornada Completa', range: '8:00 AM a 5:00 PM', value: 'Jornada Completa (8:00 AM - 5:00 PM)' },
  { id: 'morning', label: 'Franja Mañana', range: '8:00 AM a 12:00 PM', value: 'Mañana (8:00 AM - 12:00 PM)' },
  { id: 'afternoon', label: 'Franja Tarde', range: '12:00 PM a 5:00 PM', value: 'Tarde (12:00 PM - 5:00 PM)' },
] as const;

/**
 * Calculates next business day logic according to Verdulero's parameters.
 */
function getNextBusinessDay() {
  const date = new Date();
  const currentHour = date.getHours();
  
  // Rule: Orders after 8 PM are scheduled for the next-next business day technically
  const addDays = currentHour >= 20 ? 2 : 1;
  date.setDate(date.getDate() + addDays);
  
  // Skip Sundays (0)
  if (date.getDay() === 0) {
     date.setDate(date.getDate() + 1);
  }
  
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' });
}

interface DeliverySchedulerProps {
  selectedTimeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

export function DeliveryScheduler({ selectedTimeRange, onTimeRangeChange }: DeliverySchedulerProps = {}) {
  const [nextDelivery, setNextDelivery] = React.useState<string | null>(null);
  const [internalRange, setInternalRange] = React.useState<string>(DELIVERY_TIME_RANGES[0].value);

  const activeRange = selectedTimeRange ?? internalRange;

  const handleSelectRange = (val: string) => {
    setInternalRange(val);
    onTimeRangeChange?.(val);
  };

  React.useEffect(() => {
    setNextDelivery(getNextBusinessDay());
  }, []);

  if (!nextDelivery) {
    return (
      <div className="bg-[#83b745]/50 animate-pulse text-transparent rounded-2xl p-6 mb-8 h-44">
        Cargando itinerario...
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#83b745] to-[#65962c] text-white rounded-2xl p-5 sm:p-6 mb-8 shadow-md relative overflow-hidden border border-[#83b745]/30">
      <input type="hidden" name="deliveryTimeRange" value={activeRange} />

      {/* Decorative Shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-black/5 rounded-full blur-2xl translate-y-1/2 pointer-events-none"></div>

      {/* Top Row: Promise Date & Guarantee Badge */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/20">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm flex shrink-0 shadow-inner">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white/90 uppercase tracking-wider mb-0.5">
              🚚 Tu pedido llegará el
            </p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight capitalize leading-tight">
              {nextDelivery}
            </h2>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/30 text-xs sm:text-sm font-extrabold shadow-sm self-start sm:self-center shrink-0 flex items-center gap-2">
          <span>✅</span>
          <span>Garantía Sí o Sí</span>
        </div>
      </div>

      {/* Middle Row: Wide Desired Time Range Selector */}
      <div className="relative z-10 mt-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-white/95 mb-2.5 flex items-center gap-1.5">
          <span>⏰</span> Elige la franja horaria deseada para tu entrega:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DELIVERY_TIME_RANGES.map((option) => {
            const isSelected = activeRange === option.value;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectRange(option.value)}
                className={`text-left rounded-xl px-3.5 py-2.5 transition-all border ${
                  isSelected
                    ? 'bg-white text-slate-900 border-white shadow-md ring-2 ring-white/50'
                    : 'bg-black/15 text-white border-white/25 hover:bg-black/25'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-black uppercase tracking-wide ${isSelected ? 'text-[#5b8726]' : 'text-white'}`}>
                    {option.label}
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#5b8726] bg-[#5b8726]' : 'border-white/60'}`}>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className={`text-xs font-bold mt-0.5 ${isSelected ? 'text-slate-700' : 'text-white/90'}`}>
                  De {option.range}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Operational Cutoff Note */}
      <div className="relative z-10 mt-3.5 pt-3 border-t border-white/15 flex items-center gap-2 text-xs text-white/95 font-medium">
        <span>💡</span>
        <span>
          Pedidos realizados después de las <strong className="font-black underline decoration-white/60">8:00 PM</strong> se programan para el siguiente día hábil.
        </span>
      </div>
    </div>
  );
}
