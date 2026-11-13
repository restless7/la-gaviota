'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Timer,
  CheckCircle2,
  Save,
  Zap,
  Eye,
  X
} from 'lucide-react';
import {
  type Promotion,
  type PromotionTierRule,
  updatePromotionCampaign,
  extendPromotionDuration,
  togglePromotionActive
} from '@/src/actions/promotions';

interface PromotionsAdminClientProps {
  initialPromotions: Promotion[];
}

const POSTER_PREVIEWS = [
  { url: '/PROMOTIONS/descuento-15-lanzamiento.jpg', title: '15% Descuento (> $100.000)' },
  { url: '/PROMOTIONS/descuento-25-lanzamiento.jpg', title: '25% Descuento (> $200.000)' },
  { url: '/PROMOTIONS/descuento-35-lanzamiento.jpg', title: '35% Descuento (> $300.000)' },
  { url: '/PROMOTIONS/descuento-15-lanzamiento-v2.jpg', title: '15% Descuento (Variante)' },
  { url: '/PROMOTIONS/descuento-25-lanzamiento-v2.jpg', title: '25% Descuento (Variante)' },
  { url: '/PROMOTIONS/descuento-35-lanzamiento-v2.jpg', title: '35% Descuento (Variante)' },
];

export default function PromotionsAdminClient({ initialPromotions }: PromotionsAdminClientProps) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const activePromo = promotions[0] || null;

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string>('');
  const [zoomPoster, setZoomPoster] = useState<string | null>(null);

  // Form edit states
  const [name, setName] = useState(activePromo?.name || '¡Gran Lanzamiento Web La Gaviota!');
  const [headline, setHeadline] = useState(activePromo?.headline || '¡Descuentos de Lanzamiento por 1 Semana!');
  const [description, setDescription] = useState(activePromo?.description || '');
  const [isActive, setIsActive] = useState(activePromo?.is_active ?? true);
  const [startsAt, setStartsAt] = useState(
    activePromo?.starts_at ? new Date(activePromo.starts_at).toISOString().slice(0, 16) : ''
  );
  const [endsAt, setEndsAt] = useState(
    activePromo?.ends_at ? new Date(activePromo.ends_at).toISOString().slice(0, 16) : ''
  );
  const [tierRules, setTierRules] = useState<PromotionTierRule[]>(
    activePromo?.tier_rules?.length
      ? activePromo.tier_rules
      : [
          { minSubtotal: 100000, discountPercent: 15, badge: '15% OFF', label: '15% de Descuento', description: 'En compras superiores a $100.000', posterUrl: '/PROMOTIONS/descuento-15-lanzamiento.jpg' },
          { minSubtotal: 200000, discountPercent: 25, badge: '25% OFF', label: '25% de Descuento', description: 'En compras superiores a $200.000', posterUrl: '/PROMOTIONS/descuento-25-lanzamiento.jpg' },
          { minSubtotal: 300000, discountPercent: 35, badge: '35% OFF', label: '35% de Descuento', description: 'En compras superiores a $300.000', posterUrl: '/PROMOTIONS/descuento-35-lanzamiento.jpg' },
        ]
  );
  const [maxCap, setMaxCap] = useState<string>(activePromo?.max_discount_cap ? String(activePromo.max_discount_cap) : '');

  // Live Simulator state
  const [simCartAmount, setSimCartAmount] = useState<string>('240000');

  // Countdown timer
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number; isExpired: boolean } | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    const target = new Date(endsAt).getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining({ days, hours, minutes, seconds, isExpired: false });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleSetOneWeekFromNow = () => {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartsAt(now.toISOString().slice(0, 16));
    setEndsAt(sevenDays.toISOString().slice(0, 16));
    setIsActive(true);
    showToast('Fechas ajustadas: Activo por 1 semana exacta (7 días)');
  };

  const handleSetTwoWeeksFromNow = () => {
    const now = new Date();
    const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    setStartsAt(now.toISOString().slice(0, 16));
    setEndsAt(fourteenDays.toISOString().slice(0, 16));
    setIsActive(true);
    showToast('Fechas ajustadas: Activo por 2 semanas (14 días)');
  };

  const handleQuickExtend = (days: number) => {
    if (!activePromo) return;
    startTransition(async () => {
      const res = await extendPromotionDuration(activePromo.id, days);
      if (res.success && res.newEndsAt) {
        setEndsAt(new Date(res.newEndsAt).toISOString().slice(0, 16));
        setIsActive(true);
        showToast(`Campaña extendida por ${days} días exitosamente`);
      } else {
        alert(res.error || 'Error al extender campaña');
      }
    });
  };

  const handleToggleActive = () => {
    const nextVal = !isActive;
    setIsActive(nextVal);
    if (activePromo) {
      startTransition(async () => {
        const res = await togglePromotionActive(activePromo.id, nextVal);
        if (res.success) {
          showToast(`Campaña ${nextVal ? 'ACTIVADA' : 'PAUSADA'} en vivo`);
        } else {
          alert(res.error || 'Error al cambiar estado');
        }
      });
    }
  };

  const handleTierChange = (index: number, field: keyof PromotionTierRule, value: string | number) => {
    setTierRules(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSave = () => {
    if (!activePromo) return;
    startTransition(async () => {
      const res = await updatePromotionCampaign({
        id: activePromo.id,
        name,
        headline,
        description,
        is_active: isActive,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        tier_rules: tierRules,
        max_discount_cap: maxCap ? parseFloat(maxCap) : null,
      });

      if (res.success) {
        showToast('¡Configuración de campaña y descuentos guardada exitosamente!');
      } else {
        alert(res.error || 'Error guardando campaña');
      }
    });
  };

  // Simulation calculations
  const parsedSimAmount = parseFloat(simCartAmount.replace(/[^\d]/g, '')) || 0;
  const sortedTiers = [...tierRules].sort((a, b) => b.minSubtotal - a.minSubtotal);
  const matchedTier = sortedTiers.find(t => parsedSimAmount >= t.minSubtotal);
  const simDiscountPercent = matchedTier ? matchedTier.discountPercent : 0;
  const simDiscountAmount = Math.round(parsedSimAmount * (simDiscountPercent / 100));
  const simFinalTotal = parsedSimAmount - simDiscountAmount;

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 font-serif">
                Descuentos & Campaña de Lanzamiento
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Control de ofertas escalonadas por tiempo limitado (15%, 25% y 35% de descuento)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={isPending}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs ${
              isActive
                ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-400 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isActive ? 'Campaña Activa en Tienda' : 'Campaña Pausada'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Save size={15} />
            <span>{isPending ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Live Status & Countdown Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Countdown card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-red-600 via-amber-600 to-red-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-yellow-300 text-xs font-black uppercase tracking-wider">
                <Timer size={13} /> {isActive ? 'Cuenta Regresiva en Vivo' : 'Campaña en Pausa'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2 font-serif">
                {name}
              </h2>
              <p className="text-sm text-yellow-100 mt-1 max-w-xl">
                {headline}
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0">
              <span className="text-[10px] font-black uppercase text-yellow-300 tracking-widest block mb-1">
                Tiempo Restante
              </span>
              {timeRemaining ? (
                timeRemaining.isExpired ? (
                  <span className="text-xl font-black text-red-200">Expirada</span>
                ) : (
                  <div className="flex items-center gap-2 font-mono font-black text-xl sm:text-2xl text-white">
                    <div>
                      <span>{timeRemaining.days}</span>
                      <span className="text-[10px] block font-sans text-yellow-200">DÍAS</span>
                    </div>
                    <span>:</span>
                    <div>
                      <span>{String(timeRemaining.hours).padStart(2, '0')}</span>
                      <span className="text-[10px] block font-sans text-yellow-200">HORAS</span>
                    </div>
                    <span>:</span>
                    <div>
                      <span>{String(timeRemaining.minutes).padStart(2, '0')}</span>
                      <span className="text-[10px] block font-sans text-yellow-200">MIN</span>
                    </div>
                    <span>:</span>
                    <div>
                      <span>{String(timeRemaining.seconds).padStart(2, '0')}</span>
                      <span className="text-[10px] block font-sans text-yellow-200">SEG</span>
                    </div>
                  </div>
                )
              ) : (
                <span className="text-sm font-bold">Calculando...</span>
              )}
            </div>
          </div>

          {/* Quick timing actions */}
          <div className="relative z-10 mt-6 pt-6 border-t border-white/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-yellow-200">Atajos de Duración:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSetOneWeekFromNow}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-red-900 font-black transition-colors"
              >
                1 Semana (7 Días)
              </button>
              <button
                type="button"
                onClick={handleSetTwoWeeksFromNow}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-red-900 font-black transition-colors"
              >
                2 Semanas (14 Días)
              </button>
              <button
                type="button"
                onClick={() => handleQuickExtend(7)}
                className="px-3 py-1.5 rounded-xl bg-yellow-300 text-red-950 hover:bg-yellow-200 font-black transition-colors"
              >
                + Extender 7 Días
              </button>
            </div>
          </div>
        </div>

        {/* Live Simulator Widget */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Simulador de Carrito
              </span>
              <Zap size={16} className="text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Ingresa un valor de compra para probar qué escala de descuento se aplica automáticamente:
            </p>

            <div className="relative mb-4">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">$</span>
              <input
                type="text"
                value={simCartAmount}
                onChange={(e) => setSimCartAmount(e.target.value)}
                placeholder="200000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 font-mono font-bold text-lg text-slate-800 focus:outline-red-500"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Escala de Descuento:</span>
                <span className="font-black text-red-700">{simDiscountPercent}% OFF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Descuento aplicado:</span>
                <span className="font-black text-red-700">-{formatCOP(simDiscountAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-slate-800 text-sm">
                <span>Total a pagar:</span>
                <span className="text-emerald-700 font-black">{formatCOP(simFinalTotal)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-slate-400 font-medium">
            * El descuento se deduce antes del costo de envío.
          </div>
        </div>

      </div>

      {/* Main Campaign Configuration Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-lg font-black text-slate-800 font-serif">
            Configuración de la Campaña y Ventana de Tiempo
          </h2>
          <p className="text-xs text-slate-500">
            Define los textos visibles en el anuncio público y los límites exactos de fechas de vigencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase text-slate-600 mb-1">
              Nombre de la Campaña
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-slate-800 focus:outline-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-600 mb-1">
              Titular del Anuncio Público
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-slate-800 focus:outline-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-600 mb-1">
              Fecha y Hora de Inicio
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-slate-800 focus:outline-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-600 mb-1">
              Fecha y Hora de Finalización (Fin de 1 Semana)
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-slate-800 focus:outline-red-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black uppercase text-slate-600 mb-1">
              Descripción Promocional
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm text-slate-700 focus:outline-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-600 mb-1">
              Tope Máximo de Descuento (Opcional COP)
            </label>
            <input
              type="number"
              value={maxCap}
              onChange={(e) => setMaxCap(e.target.value)}
              placeholder="Ej: 200000 (Dejar vacío para sin límite)"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-slate-800 focus:outline-red-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Límite monetario máximo que se puede descontar por orden.</p>
          </div>
        </div>
      </div>

      {/* Tiered Discount Rules Editor */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 font-serif">
              Escala de Descuentos por Monto de Compra
            </h2>
            <p className="text-xs text-slate-500">
              Reglas progresivas calculadas automáticamente en el carrito y checkout.
            </p>
          </div>
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
            3 Escalas Activas (15%, 25%, 35%)
          </span>
        </div>

        <div className="space-y-4">
          {tierRules.map((rule, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-gray-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-red-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                  {rule.discountPercent}%
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">
                    {rule.label}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {rule.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Compra Mínima (COP)
                  </label>
                  <input
                    type="number"
                    value={rule.minSubtotal}
                    onChange={(e) => handleTierChange(idx, 'minSubtotal', parseInt(e.target.value) || 0)}
                    className="w-28 px-2.5 py-1.5 rounded-lg border border-gray-200 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    % Descuento
                  </label>
                  <input
                    type="number"
                    value={rule.discountPercent}
                    onChange={(e) => handleTierChange(idx, 'discountPercent', parseInt(e.target.value) || 0)}
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-200 font-mono font-bold text-red-700"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 flex items-end">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    Ahorro: ~{formatCOP(Math.round(rule.minSubtotal * (rule.discountPercent / 100)))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Poster Gallery Preview */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 font-serif">
              Afiches y Material Gráfico Oficial de la Campaña
            </h2>
            <p className="text-xs text-slate-500">
              Afiches de alta resolución guardados en el sistema y visibles en el modal interactivo de los clientes.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">6 Diseños Disponibles</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {POSTER_PREVIEWS.map((poster, index) => (
            <div
              key={index}
              onClick={() => setZoomPoster(poster.url)}
              className="group cursor-pointer relative rounded-2xl overflow-hidden border border-gray-200 hover:border-red-500 shadow-xs hover:shadow-md transition-all"
            >
              <div className="relative aspect-[3/4] w-full bg-slate-900">
                <Image
                  src={poster.url}
                  alt={poster.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="text-white" size={24} />
                </div>
              </div>
              <div className="p-2 bg-white text-center">
                <p className="text-[11px] font-bold text-slate-700 truncate">{poster.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Poster Modal */}
      {zoomPoster && (
        <div
          role="dialog"
          aria-label="Vista previa del afiche"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setZoomPoster(null)}
        >
          <div className="relative max-w-lg w-full max-h-[90vh] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={zoomPoster}
              alt="Afiche en resolución completa"
              fill
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setZoomPoster(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
