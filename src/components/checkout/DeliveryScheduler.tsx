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
  defaultOpenPopup?: boolean;
}

export function DeliveryScheduler({
  selectedTimeRange,
  onTimeRangeChange,
  defaultOpenPopup = true,
}: DeliverySchedulerProps = {}) {
  const [nextDelivery, setNextDelivery] = React.useState<string | null>(null);
  const [internalRange, setInternalRange] = React.useState<string>(DELIVERY_TIME_RANGES[0].value);
  const [isPopupOpen, setIsPopupOpen] = React.useState<boolean>(defaultOpenPopup);

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
      <div className="bg-[#83b745]/20 animate-pulse text-transparent rounded-xl p-3 mb-5 h-12">
        Cargando itinerario...
      </div>
    );
  }

  return (
    <>
      <input type="hidden" name="deliveryTimeRange" value={activeRange} />

      {/* Compact Summary Bar on Checkout Page */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#83b745]/40 bg-[#83b745]/10 px-4 py-3 text-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#83b745] text-white shadow-sm text-base">
            🚚
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#4b731c]">
              Tu pedido llegará el <span className="capitalize underline">{nextDelivery}</span>
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
              ⏰ {activeRange} · <span className="text-[#4b731c]">Garantía Sí o Sí</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsPopupOpen(true)}
          className="shrink-0 rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-[#4b731c] border border-[#83b745]/40 shadow-sm hover:bg-[#83b745] hover:text-white transition-colors"
        >
          Cambiar horario
        </button>
      </div>

      {/* Pop-up Modal when entering Checkout or clicking "Cambiar horario" */}
      {isPopupOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delivery-popup-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPopupOpen(false);
          }}
        >
          <div className="w-full max-w-lg bg-gradient-to-br from-[#83b745] to-[#5d8c27] text-white rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden border border-white/25 animate-in zoom-in-95 duration-200">
            {/* Decorative Shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            {/* Close button */}
            <button
              type="button"
              aria-label="Cerrar programación de entrega"
              onClick={() => setIsPopupOpen(false)}
              className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/35 transition-colors font-bold"
            >
              ✕
            </button>

            {/* Top Row: Promise Date & Guarantee Badge */}
            <div className="relative z-10 flex flex-col gap-3 pb-4 border-b border-white/20 pr-8">
              <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider border border-white/30">
                <span>✅</span>
                <span>Garantía de Frescura Sí o Sí</span>
              </div>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm flex shrink-0 shadow-inner">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white/90 uppercase tracking-wider mb-0.5">
                    🚚 Tu pedido llegará el
                  </p>
                  <h2 id="delivery-popup-title" className="text-xl sm:text-2xl font-black tracking-tight capitalize leading-tight">
                    {nextDelivery}
                  </h2>
                </div>
              </div>
            </div>

            {/* Middle Row: Wide Desired Time Range Selector */}
            <div className="relative z-10 mt-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-white/95 mb-2.5 flex items-center gap-1.5">
                <span>⏰</span> Selecciona tu franja horaria de entrega preferida:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {DELIVERY_TIME_RANGES.map((option) => {
                  const isSelected = activeRange === option.value;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectRange(option.value)}
                      className={`text-left rounded-2xl px-4 py-3 transition-all border flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-white text-slate-900 border-white shadow-lg ring-2 ring-white/60'
                          : 'bg-black/15 text-white border-white/25 hover:bg-black/25'
                      }`}
                    >
                      <div>
                        <span className={`text-xs font-black uppercase tracking-wide block ${isSelected ? 'text-[#4b731c]' : 'text-white'}`}>
                          {option.label}
                        </span>
                        <span className={`text-xs font-bold mt-0.5 block ${isSelected ? 'text-slate-700' : 'text-white/90'}`}>
                          De {option.range}
                        </span>
                      </div>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-[#4b731c] bg-[#4b731c]' : 'border-white/70'}`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row: Operational Cutoff Note + Confirm CTA */}
            <div className="relative z-10 mt-4 pt-3 border-t border-white/20 space-y-3">
              <p className="flex items-start gap-2 text-xs text-white/95 font-medium leading-snug">
                <span>💡</span>
                <span>
                  Pedidos realizados después de las <strong className="font-black underline decoration-white/60">8:00 PM</strong> se programan para el siguiente día hábil.
                </span>
              </p>
              <button
                type="button"
                onClick={() => setIsPopupOpen(false)}
                className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-[#FFCC00] font-black py-3.5 px-5 text-sm uppercase tracking-wider shadow-lg transition-all active:scale-98"
              >
                Confirmar horario y continuar →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
