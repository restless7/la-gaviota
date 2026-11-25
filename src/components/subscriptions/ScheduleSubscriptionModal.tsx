'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Package,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { createGrocerySubscription, type CreateSubscriptionItemInput } from '@/src/actions/subscriptions';
import { formatBogotaDateIso, SubscriptionFrequency } from '@/src/lib/subscriptions/recurrence';
import { calculateDeliverySchedule } from '@/src/lib/deliveryCutoff';

interface ScheduleSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{
    product: { id: string; name: string; price_retail?: number; price?: number; unit?: string; image_url?: string | null };
    quantity: number;
  }>;
  customerInitialData?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    municipality?: string;
  };
}

export function ScheduleSubscriptionModal({
  isOpen,
  onClose,
  items,
  customerInitialData = {},
}: ScheduleSubscriptionModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('WEEKLY');
  const [firstDeliveryDate, setFirstDeliveryDate] = useState(() => {
    const defaultSchedule = calculateDeliverySchedule();
    return defaultSchedule.scheduledDateIso;
  });
  const [deliveryWindow, setDeliveryWindow] = useState('08:00 - 12:00');
  const [confirmationPolicy, setConfirmationPolicy] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [spendingCap, setSpendingCap] = useState<string>('');

  const [formData, setFormData] = useState({
    name: customerInitialData.name || '',
    phone: customerInitialData.phone || '',
    email: customerInitialData.email || '',
    address: customerInitialData.address || '',
    municipality: customerInitialData.municipality || 'Bucaramanga',
    instructions: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSubscriptionId, setCreatedSubscriptionId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate subtotal
  const estimatedSubtotal = items.reduce((sum, item) => {
    const price = item.product.price_retail ?? item.product.price ?? 0;
    return sum + price * item.quantity;
  }, 0);
  const estimatedDelivery = formData.municipality.toLowerCase().includes('florida') ? 7000 : 5000;
  const estimatedTotal = estimatedSubtotal + estimatedDelivery;

  const handleCreate = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      setError('Por favor completa tu nombre, teléfono y dirección de entrega.');
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const subItems: CreateSubscriptionItemInput[] = items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unit: i.product.unit || 'unidad',
        price: i.product.price_retail ?? i.product.price ?? 0,
      }));

      const res = await createGrocerySubscription({
        frequency,
        firstDeliveryDate,
        preferredDeliveryWindow: deliveryWindow,
        deliveryName: formData.name,
        deliveryPhone: formData.phone,
        deliveryEmail: formData.email,
        deliveryAddress: formData.address,
        deliveryMunicipality: formData.municipality,
        deliveryInstructions: formData.instructions,
        confirmationPolicy,
        maximumAuthorizedTotal: spendingCap ? parseInt(spendingCap, 10) : Math.round(estimatedTotal * 1.15),
        items: subItems,
      });

      setCreatedSubscriptionId(res.subscriptionId);
      setStep(5); // Success step
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando la programación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E30613] to-red-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black tracking-wide uppercase mb-2">
            <Sparkles size={13} />
            <span>Mercado Programado</span>
          </div>
          <h2 className="text-2xl font-black font-serif">Programar mi mercado</h2>
          <p className="text-red-100 text-xs mt-1">
            Recibe tus frutas y verduras frescas automáticamente. Cancela o pausa cuando quieras.
          </p>

          {/* Step Indicator */}
          {step < 5 && (
            <div className="flex items-center gap-2 mt-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    step >= s ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Resumen de Canasta */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="font-black text-slate-800 text-sm">Productos seleccionados ({items.length})</span>
                <span className="text-xs text-gray-500 font-medium">Precios referenciales de hoy</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => {
                  const unitPrice = item.product.price_retail ?? item.product.price ?? 0;
                  return (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-gray-100 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {item.quantity}×
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{item.product.name}</p>
                          <p className="text-[11px] text-gray-400">
                            ${unitPrice.toLocaleString('es-CO')} / {item.product.unit || 'unidad'}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-slate-900">
                        ${(unitPrice * item.quantity).toLocaleString('es-CO')}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Subtotal estimado</span>
                  <span className="text-xs text-emerald-600">Se recalcula en cada entrega</span>
                </div>
                <span className="text-2xl font-black text-emerald-900">
                  ${estimatedSubtotal.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Selección de Frecuencia */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-black text-slate-800 text-base mb-2">¿Cada cuánto quieres recibir tu mercado?</h3>

              <div className="space-y-3">
                {[
                  {
                    id: 'WEEKLY' as SubscriptionFrequency,
                    title: 'Cada semana',
                    badge: 'Más popular',
                    description: 'Tu mercado fresco en tu puerta cada 7 días. Ideal para mantener frutas y verduras siempre frescas.',
                    icon: '🥬',
                  },
                  {
                    id: 'EVERY_15_DAYS' as SubscriptionFrequency,
                    title: 'Cada 15 días',
                    badge: 'Quincenal',
                    description: 'Entrega regular cada 15 días calendario. Perfecto para compras planificadas del hogar.',
                    icon: '🧺',
                  },
                  {
                    id: 'MONTHLY' as SubscriptionFrequency,
                    title: 'Cada mes',
                    badge: 'Mensual',
                    description: 'El mismo día de cada mes (ej. día 1 o 15). Ideal para víveres duraderos y granos.',
                    icon: '📅',
                  },
                ].map((freq) => (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => setFrequency(freq.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                      frequency === freq.id
                        ? 'border-[#E30613] bg-red-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-3xl p-2 rounded-xl bg-white shadow-xs">{freq.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-slate-900 text-base">{freq.title}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          frequency === freq.id ? 'bg-[#E30613] text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {freq.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{freq.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Fecha y Datos de Entrega */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-black text-slate-800 text-base">¿Cuándo y dónde lo recibes?</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                    Primera Entrega
                  </label>
                  <input
                    type="date"
                    value={firstDeliveryDate}
                    onChange={(e) => setFirstDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-slate-800 focus:border-[#4CAF50] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                    Franja Horaria
                  </label>
                  <select
                    value={deliveryWindow}
                    onChange={(e) => setDeliveryWindow(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-slate-800 focus:border-[#4CAF50] outline-none"
                  >
                    <option value="07:00 - 11:00">Mañana (07:00 AM - 11:00 AM)</option>
                    <option value="11:00 - 15:00">Mediodía (11:00 AM - 03:00 PM)</option>
                    <option value="15:00 - 19:00">Tarde (03:00 PM - 07:00 PM)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre y apellido"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-800 outline-none focus:border-[#4CAF50]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                      Teléfono WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="312 345 6789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-800 outline-none focus:border-[#4CAF50]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                      Municipio
                    </label>
                    <select
                      value={formData.municipality}
                      onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-slate-800 outline-none focus:border-[#4CAF50]"
                    >
                      <option value="Bucaramanga">Bucaramanga</option>
                      <option value="Floridablanca">Floridablanca</option>
                      <option value="Girón">Girón</option>
                      <option value="Piedecuesta">Piedecuesta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                    Dirección de Entrega
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Calle, Carrera, Torre, Apto..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-800 outline-none focus:border-[#4CAF50]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                    Instrucciones Especiales (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Dejar en portería o tocar timbre 302"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-800 outline-none focus:border-[#4CAF50]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Política de Precios y Autorización */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-black text-slate-800 text-base">Autorización y Control de Precios</h3>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold">🍅 Política de Mercado Fresco:</p>
                <p>
                  Los precios de los productos agrícolas fluctúan según la cosecha. Siempre recalculamos con el precio
                  real del día y pagas únicamente al recibir tu pedido en efectivo o transferencia.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block p-4 rounded-2xl border-2 cursor-pointer transition-all border-emerald-500 bg-emerald-50/40">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="confirmationPolicy"
                      checked={confirmationPolicy === 'AUTO'}
                      onChange={() => setConfirmationPolicy('AUTO')}
                      className="mt-1 text-[#4CAF50] focus:ring-[#4CAF50]"
                    />
                    <div>
                      <span className="font-black text-slate-900 text-sm block">Aprobación Automática (Recomendado)</span>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Tu pedido se genera automáticamente sin fricción. Puedes fijar un tope máximo de presupuesto.
                      </p>
                    </div>
                  </div>
                </label>

                <label className="block p-4 rounded-2xl border-2 cursor-pointer transition-all border-gray-200 hover:border-gray-300">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="confirmationPolicy"
                      checked={confirmationPolicy === 'MANUAL'}
                      onChange={() => setConfirmationPolicy('MANUAL')}
                      className="mt-1 text-[#4CAF50] focus:ring-[#4CAF50]"
                    />
                    <div>
                      <span className="font-black text-slate-900 text-sm block">Revisar y Aprobar antes de Despachar</span>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Te notificaremos un día antes para que confirmes los precios y cantidades antes de armar el pedido.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {confirmationPolicy === 'AUTO' && (
                <div className="pt-2">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                    Tope Máximo Autorizado por Pedido (COP)
                  </label>
                  <input
                    type="number"
                    placeholder={`Ej. $${Math.round(estimatedTotal * 1.15).toLocaleString('es-CO')}`}
                    value={spendingCap}
                    onChange={(e) => setSpendingCap(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-slate-800 outline-none focus:border-[#4CAF50]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Si el total recalculado supera este tope, el sistema pedirá tu confirmación explícita antes de generar el pedido.
                  </p>
                </div>
              )}

              {/* Total Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal estimado:</span>
                  <span className="font-bold">${estimatedSubtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Domicilio ({formData.municipality}):</span>
                  <span className="font-bold">${estimatedDelivery.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t">
                  <span>Total estimado por entrega:</span>
                  <span className="text-[#E30613] text-base">${estimatedTotal.toLocaleString('es-CO')} COP</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Éxito */}
          {step === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-serif">¡Mercado Programado con Éxito!</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Tu mercado ha sido programado con frecuencia{' '}
                <span className="font-bold text-slate-800">
                  {frequency === 'WEEKLY' ? 'Semanal' : frequency === 'EVERY_15_DAYS' ? 'Quincenal' : 'Mensual'}
                </span>
                . Tu primera entrega llegará el{' '}
                <span className="font-bold text-slate-800">{firstDeliveryDate}</span>.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/mi-cuenta/mercados-programados"
                  className="flex-1 bg-[#4CAF50] hover:bg-emerald-600 text-white font-black py-3.5 px-6 rounded-2xl transition-all shadow-md text-sm text-center"
                  onClick={onClose}
                >
                  Ver mis mercados programados
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 px-6 rounded-2xl transition-all text-sm"
                >
                  Seguir comprando
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step < 5 && (
          <div className="p-6 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as typeof step)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Atrás
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-gray-500 font-bold text-xs hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as typeof step)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreate}
                className="px-8 py-3 rounded-2xl bg-[#E30613] hover:bg-red-700 text-white font-black text-sm transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    Confirmar mi mercado programado
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

