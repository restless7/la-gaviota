'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Pause,
  Play,
  SkipForward,
  XCircle,
  AlertCircle,
  Package,
  Plus,
  ArrowRight,
  Loader2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import {
  SubscriptionRecord,
  pauseCustomerSubscription,
  resumeCustomerSubscription,
  skipNextSubscriptionDelivery,
  cancelCustomerSubscription,
  approveSubscriptionOccurrence,
} from '@/src/actions/subscriptions';

interface Props {
  initialSubscriptions: SubscriptionRecord[];
}

export function SubscriptionsManagementClient({ initialSubscriptions }: Props) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(initialSubscriptions);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handlePause = async (subId: string) => {
    setActiveActionId(subId);
    setMessage(null);
    try {
      await pauseCustomerSubscription(subId);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status: 'PAUSED' as const } : s))
      );
      setMessage({ text: 'Suscripción pausada correctamente.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error pausando suscripción.', type: 'error' });
    } finally {
      setActiveActionId(null);
    }
  };

  const handleResume = async (subId: string) => {
    setActiveActionId(subId);
    setMessage(null);
    try {
      const res = await resumeCustomerSubscription(subId);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status: 'ACTIVE' as const, next_occurrence_date: res.nextDate } : s))
      );
      setMessage({ text: `Suscripción reanudada. Próxima entrega: ${res.nextDate}.`, type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error reanudando suscripción.', type: 'error' });
    } finally {
      setActiveActionId(null);
    }
  };

  const handleSkip = async (subId: string) => {
    if (!window.confirm('¿Seguro que deseas saltar la próxima entrega programada? Pasaremos a la siguiente fecha.')) return;
    setActiveActionId(subId);
    setMessage(null);
    try {
      const res = await skipNextSubscriptionDelivery(subId);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, next_occurrence_date: res.nextDate } : s))
      );
      setMessage({ text: `Próxima entrega saltada. Nueva fecha: ${res.nextDate}.`, type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error al saltar entrega.', type: 'error' });
    } finally {
      setActiveActionId(null);
    }
  };

  const handleCancel = async (subId: string) => {
    if (!window.confirm('¿Estás seguro de cancelar esta suscripción? No se generarán más entregas automáticas.')) return;
    setActiveActionId(subId);
    setMessage(null);
    try {
      await cancelCustomerSubscription(subId);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status: 'CANCELED' as const } : s))
      );
      setMessage({ text: 'Suscripción cancelada exitosamente.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error cancelando suscripción.', type: 'error' });
    } finally {
      setActiveActionId(null);
    }
  };

  const handleApproveOccurrence = async (occId: string, subId: string) => {
    setActiveActionId(occId);
    setMessage(null);
    try {
      const res = await approveSubscriptionOccurrence(occId);
      if (res.success) {
        setMessage({ text: `Pedido #${res.orderId} aprobado y generado exitosamente.`, type: 'success' });
      } else {
        setMessage({ text: res.message || 'Error aprobando entrega.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Error al aprobar pedido.', type: 'error' });
    } finally {
      setActiveActionId(null);
    }
  };

  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-emerald-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white/10 blur-3xl rounded-full -mr-20 pointer-events-none"></div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles size={14} />
            <span>La Gaviota · Programación Inteligente</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif">Mis Mercados Programados</h1>
          <p className="text-red-100 text-sm max-w-xl mt-2 leading-relaxed">
            Administra tus entregas automáticas de frutas y verduras frescas del campo. Modifica productos, pausa o
            cancela en cualquier momento con total flexibilidad.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 items-center">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95"
            >
              <Plus size={16} /> Programar nuevo mercado desde carrito
            </Link>
            <div className="text-xs font-bold text-red-100">
              {activeCount} {activeCount === 1 ? 'mercado activo' : 'mercados activos'}
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 animate-fade-in ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Subscriptions List */}
        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              🧺
            </div>
            <h3 className="text-xl font-black text-slate-800 font-serif">No tienes mercados programados</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Arma tu mercado una sola vez y recíbelo cada semana, quincena o mes sin preocuparte por hacer pedidos
              manualmente.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#E30613] hover:bg-red-700 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all"
              >
                <ShoppingBag size={16} /> Explorar catálogo de frescos
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {subscriptions.map((sub) => {
              const isLoading = activeActionId === sub.id;
              const pendingOccurrence = sub.occurrences?.find(
                (o) => o.status === 'PENDING_APPROVAL'
              );

              return (
                <div
                  key={sub.id}
                  className={`bg-white rounded-3xl border transition-all p-6 sm:p-8 shadow-sm ${
                    sub.status === 'ACTIVE'
                      ? 'border-gray-200 hover:border-emerald-300'
                      : sub.status === 'PAUSED'
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-gray-200 opacity-60 bg-gray-50'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-800 font-serif">{sub.name}</h2>
                        <span
                          className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'PAUSED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {sub.status === 'ACTIVE' ? 'Activo' : sub.status === 'PAUSED' ? 'Pausado' : 'Cancelado'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Frecuencia:{' '}
                        <span className="font-bold text-slate-700">
                          {sub.frequency === 'WEEKLY'
                            ? 'Cada 7 días (Semanal)'
                            : sub.frequency === 'EVERY_15_DAYS'
                            ? 'Cada 15 días (Quincenal)'
                            : 'Mensual'}
                        </span>{' '}
                        · Pago contra entrega
                      </p>
                    </div>

                    {/* Next Delivery Badge */}
                    {sub.status === 'ACTIVE' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-right">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                          Próxima entrega
                        </span>
                        <span className="text-lg font-black text-emerald-900">
                          {sub.next_occurrence_date}
                        </span>
                        <span className="text-[11px] text-emerald-600 block">{sub.preferred_delivery_window}</span>
                      </div>
                    )}
                  </div>

                  {/* Warning if Pending Approval */}
                  {pendingOccurrence && (
                    <div className="my-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={20} className="text-amber-600 shrink-0" />
                        <div>
                          <p className="font-bold">Acción requerida: Tu próximo pedido necesita confirmación</p>
                          <p className="text-amber-700">{pendingOccurrence.last_error_message}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleApproveOccurrence(pendingOccurrence.id, sub.id)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl transition-all shadow-xs shrink-0"
                      >
                        Aprobar y Generar Pedido
                      </button>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b text-xs">
                    <div className="space-y-2">
                      <span className="font-black text-gray-400 uppercase tracking-widest block">Lugar de entrega</span>
                      <div className="flex items-start gap-2 text-slate-700 font-medium">
                        <MapPin size={16} className="text-[#E30613] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">{sub.delivery_address}</p>
                          <p className="text-gray-500">{sub.delivery_municipality} · A nombre de {sub.delivery_name}</p>
                          <p className="text-gray-400">Tel: {sub.delivery_phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="font-black text-gray-400 uppercase tracking-widest block">Productos ({sub.items?.length || 0})</span>
                      <div className="flex flex-wrap gap-2">
                        {sub.items?.map((item) => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                          >
                            <span className="text-emerald-700 font-black">{item.quantity}×</span>
                            <span>{item.product_name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Controls */}
                  {sub.status !== 'CANCELED' && (
                    <div className="pt-6 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {sub.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handlePause(sub.id)}
                            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Pause size={14} /> Pausar entregas
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleResume(sub.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Play size={14} /> Reanudar entregas
                          </button>
                        )}

                        {sub.status === 'ACTIVE' && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSkip(sub.id)}
                            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <SkipForward size={14} /> Saltar próxima entrega
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleCancel(sub.id)}
                        className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle size={14} /> Cancelar suscripción
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

