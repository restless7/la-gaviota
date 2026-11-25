'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Pause,
  Play,
  RotateCcw,
  XCircle,
  Eye,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  Sparkles,
  DollarSign,
  TrendingUp,
  Zap,
  Loader2,
} from 'lucide-react';
import {
  SubscriptionRecord,
  retryFailedSubscriptionOccurrence,
  pauseCustomerSubscription,
  resumeCustomerSubscription,
  cancelCustomerSubscription,
  processDueSubscriptionsAction,
} from '@/src/actions/subscriptions';

interface Props {
  initialSubscriptions: SubscriptionRecord[];
}

export function AdminSubscriptionsClient({ initialSubscriptions }: Props) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(initialSubscriptions);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isProcessingDue, setIsProcessingDue] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleProcessDueToday = async () => {
    setIsProcessingDue(true);
    setNotice(null);
    try {
      const res = await processDueSubscriptionsAction();
      setNotice(res.message);
    } catch (err) {
      setNotice(`Error procesando entregas: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessingDue(false);
    }
  };

  // Filter subscriptions
  const filtered = subscriptions.filter((sub) => {
    if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;
    if (frequencyFilter !== 'ALL' && sub.frequency !== frequencyFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = sub.name.toLowerCase().includes(term);
      const matchCustomer = sub.delivery_name.toLowerCase().includes(term);
      const matchPhone = sub.delivery_phone.includes(term);
      const matchAddress = sub.delivery_address.toLowerCase().includes(term);
      return matchName || matchCustomer || matchPhone || matchAddress;
    }
    return true;
  });

  // Aggregate Operational Metrics
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const pausedSubs = subscriptions.filter((s) => s.status === 'PAUSED');
  const totalWeekly = subscriptions.filter((s) => s.status === 'ACTIVE' && s.frequency === 'WEEKLY').length;
  const total15Days = subscriptions.filter((s) => s.status === 'ACTIVE' && s.frequency === 'EVERY_15_DAYS').length;
  const totalMonthly = subscriptions.filter((s) => s.status === 'ACTIVE' && s.frequency === 'MONTHLY').length;

  const totalEstimatedVolume = activeSubs.reduce((sum, s) => {
    const subEstimated = s.occurrences?.[0]?.estimated_total || 65000;
    return sum + subEstimated;
  }, 0);

  const pendingAttention = subscriptions.flatMap((s) => s.occurrences || []).filter(
    (o) => o.status === 'PENDING_APPROVAL' || o.status === 'FAILED'
  );

  const handleRetry = async (occId: string) => {
    setActionLoadingId(occId);
    setNotice(null);
    try {
      const res = await retryFailedSubscriptionOccurrence(occId);
      if (res.success) {
        setNotice(`Pedido generado exitosamente #${res.orderId}`);
      } else {
        setNotice(`Reintento completado con estado: ${res.status}. ${res.message || ''}`);
      }
    } catch (err) {
      setNotice(`Error en reintento: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAdminPause = async (subId: string) => {
    setActionLoadingId(subId);
    try {
      await pauseCustomerSubscription(subId);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status: 'PAUSED' as const } : s))
      );
      setNotice('Suscripción pausada administrativamente.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAdminResume = async (subId: string) => {
    setActionLoadingId(subId);
    try {
      const res = await resumeCustomerSubscription(subId);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, status: 'ACTIVE' as const, next_occurrence_date: res.nextDate } : s))
      );
      setNotice(`Suscripción reanudada administrativamente para el ${res.nextDate}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-100 text-[#E30613]">
              <CalendarClock size={24} />
            </span>
            <h1 className="text-3xl font-black text-slate-900 font-serif">Mercados Programados</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Control de suscripciones recurrentes, proyección de demanda agrícola y gestión de despachos periódicos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isProcessingDue}
            onClick={handleProcessDueToday}
            className="inline-flex items-center gap-2 bg-[#4CAF50] hover:bg-emerald-600 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isProcessingDue ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            <span>{isProcessingDue ? 'Generando pedidos...' : '⚡ Generar Entregas de Hoy'}</span>
          </button>

          {pendingAttention.length > 0 && (
            <div className="bg-amber-100 border border-amber-300 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black text-amber-900">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>{pendingAttention.length} entregas requieren atención</span>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-1">
            Suscripciones Activas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{activeSubs.length}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {pausedSubs.length} pausadas
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-1">
            Demanda Semanal (7d)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{totalWeekly}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {total15Days} quincenales
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-1">
            Volumen Recurrente Est.
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-800">
              ${(totalEstimatedVolume / 1000).toFixed(0)}k COP
            </span>
            <span className="text-xs text-gray-400">por ciclo</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block mb-1">
            Pendientes de Aprobación
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-600">{pendingAttention.length}</span>
            <span className="text-xs text-gray-400">tope / manual</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs text-slate-800 outline-none focus:border-[#4CAF50]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
            <Filter size={14} /> Estado:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="PAUSED">Pausados</option>
            <option value="CANCELED">Cancelados</option>
          </select>

          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">Todas las frecuencias</option>
            <option value="WEEKLY">Semanal (7 días)</option>
            <option value="EVERY_15_DAYS">Quincenal (15 días)</option>
            <option value="MONTHLY">Mensual</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-gray-200 text-gray-400 uppercase tracking-widest font-black">
              <tr>
                <th className="py-4 px-6">Suscripción / Cliente</th>
                <th className="py-4 px-6">Frecuencia</th>
                <th className="py-4 px-6">Próxima Entrega</th>
                <th className="py-4 px-6">Municipio & Dirección</th>
                <th className="py-4 px-6">Canasta</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    No se encontraron suscripciones con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const upcomingOcc = sub.occurrences?.[0];
                  const hasException = upcomingOcc?.status === 'FAILED' || upcomingOcc?.status === 'PENDING_APPROVAL';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{sub.name}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <User size={12} className="text-gray-400" />
                          <span>{sub.delivery_name}</span>
                          <span className="text-gray-300">·</span>
                          <Phone size={12} className="text-gray-400" />
                          <span>{sub.delivery_phone}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-800">
                          {sub.frequency === 'WEEKLY' ? 'Semanal' : sub.frequency === 'EVERY_15_DAYS' ? 'Quincenal' : 'Mensual'}
                        </span>
                        <div className="text-[10px] text-gray-400">
                          {sub.confirmation_policy === 'AUTO' ? 'Auto (Tope)' : 'Manual'}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{sub.next_occurrence_date}</div>
                        <div className="text-[11px] text-emerald-700">{sub.preferred_delivery_window}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{sub.delivery_municipality}</div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[180px]">{sub.delivery_address}</div>
                      </td>

                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => setSelectedSub(sub)}
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
                        >
                          <ShoppingBag size={13} />
                          <span>{sub.items?.length || 0} productos</span>
                        </button>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'PAUSED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {sub.status}
                        </span>

                        {hasException && (
                          <div className="mt-1 text-[10px] font-bold text-red-600 flex items-center gap-1">
                            <AlertTriangle size={11} /> {upcomingOcc?.status}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {upcomingOcc?.status === 'FAILED' && (
                            <button
                              type="button"
                              onClick={() => handleRetry(upcomingOcc.id)}
                              disabled={actionLoadingId === upcomingOcc.id}
                              title="Reintentar generación de orden"
                              className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}

                          {sub.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => handleAdminPause(sub.id)}
                              disabled={actionLoadingId === sub.id}
                              title="Pausar suscripción"
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                              <Pause size={14} />
                            </button>
                          ) : sub.status === 'PAUSED' ? (
                            <button
                              type="button"
                              onClick={() => handleAdminResume(sub.id)}
                              disabled={actionLoadingId === sub.id}
                              title="Reanudar suscripción"
                              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                            >
                              <Play size={14} />
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => setSelectedSub(sub)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            title="Ver detalles completos"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Basket Details Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg font-serif">{selectedSub.name}</h3>
                <p className="text-xs text-gray-500">Cliente: {selectedSub.delivery_name} ({selectedSub.delivery_phone})</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Productos en la Canasta:</span>
              <div className="space-y-1.5">
                {selectedSub.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-[10px] text-gray-500">
                        Cantidad: <span className="font-black text-emerald-700">{item.quantity}</span> {item.unit}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Subst: {item.substitution_preference}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

