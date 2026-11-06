"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Volume2,
  VolumeX,
  FileText,
  ExternalLink,
  CheckCircle2,
  MapPin,
  Phone,
  Package,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  User,
  UtensilsCrossed,
  Store,
} from 'lucide-react';
import { Order, fetchAdminOrderAlerts } from '@/src/actions/orders';
import { buildWhatsAppChatUrl, buildOrderConfirmationMessage } from '@/src/lib/whatsapp';
import { WhatsAppIcon } from '@/src/components/ui/WhatsAppIcon';

const ACK_STORAGE_KEY = 'gaviota_ack_orders_v1';
const SOUND_STORAGE_KEY = 'gaviota_admin_sound_enabled_v1';

/**
 * Plays a rich, multi-tone enterprise order alert chime using Web Audio API.
 * Uses a dual-oscillator harmonic arpeggio (C5 -> E5 -> G5 -> C6) repeated twice.
 */
export function playEnterpriseOrderChime(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return false;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const playNote = (freq: number, startTime: number, duration: number, peakGain = 0.22) => {
      const oscMain = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscMain.type = 'triangle';
      oscMain.frequency.setValueAtTime(freq, startTime);

      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(freq * 2, startTime);

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      oscMain.connect(gainNode);
      oscHarmonic.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscMain.start(startTime);
      oscHarmonic.start(startTime);
      oscMain.stop(startTime + duration);
      oscHarmonic.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // First chime cascade: C5 -> E5 -> G5 -> C6
    playNote(523.25, now + 0.0, 0.22, 0.24);
    playNote(659.25, now + 0.11, 0.22, 0.24);
    playNote(783.99, now + 0.22, 0.25, 0.26);
    playNote(1046.5, now + 0.34, 0.55, 0.30);

    // Second confirmation pulse: G5 -> C6
    playNote(783.99, now + 0.72, 0.20, 0.22);
    playNote(1046.5, now + 0.86, 0.65, 0.32);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1800);

    return true;
  } catch (err) {
    console.warn('Unable to play Web Audio chime:', err);
    return false;
  }
}

export function getTierBadgeStyle(tier?: string) {
  if (tier === 'Restaurantes') {
    return {
      label: 'Restaurantes / HORECA',
      shortLabel: 'Restaurantes',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      Icon: UtensilsCrossed,
    };
  }
  if (tier === 'Micromercados') {
    return {
      label: 'Micromercados B2B',
      shortLabel: 'Micromercados',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Icon: Store,
    };
  }
  return {
    label: 'Personas Naturales (Hogar)',
    shortLabel: 'Personas Naturales',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    Icon: User,
  };
}

export function AdminOrderAlertSystem() {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [alertQueue, setAlertQueue] = useState<Order[]>([]);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [isTestMode, setIsTestMode] = useState(false);

  const initializedRef = useRef(false);
  const ackSetRef = useRef<Set<string>>(new Set());
  const soundEnabledRef = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved preferences from localStorage
  useEffect(() => {
    try {
      const rawAck = localStorage.getItem(ACK_STORAGE_KEY);
      if (rawAck) {
        const parsed = JSON.parse(rawAck);
        if (Array.isArray(parsed)) {
          const initialSet = new Set<string>(parsed);
          setAcknowledgedIds(initialSet);
          ackSetRef.current = initialSet;
        }
      }
      const rawSound = localStorage.getItem(SOUND_STORAGE_KEY);
      if (rawSound !== null) {
        const enabled = rawSound === 'true';
        setSoundEnabled(enabled);
        soundEnabledRef.current = enabled;
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const persistAckIds = useCallback((nextSet: Set<string>) => {
    ackSetRef.current = nextSet;
    setAcknowledgedIds(new Set(nextSet));
    try {
      const arr = Array.from(nextSet).slice(-250);
      localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(arr));
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEnabledRef.current = next;
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
    if (next) {
      playEnterpriseOrderChime();
    }
  };

  const triggerOrderAlertPopup = useCallback((newOrders: Order[], playAudio = true) => {
    if (newOrders.length === 0) return;

    setAlertQueue((prev) => {
      const existingIds = new Set(prev.map((o) => o.id));
      const uniqueIncoming = newOrders.filter((o) => !existingIds.has(o.id));
      if (uniqueIncoming.length === 0) return prev;
      return [...uniqueIncoming, ...prev];
    });
    setActiveAlertIndex(0);

    if (playAudio && soundEnabledRef.current) {
      playEnterpriseOrderChime();
    }

    // Also trigger native browser notification if permission is granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const top = newOrders[0];
      try {
        new Notification(`🔔 Nuevo Pedido — $${Number(top.total_amount).toLocaleString('es-CO')}`, {
          body: `${top.customer_name} (${top.customer_tier || 'Personas Naturales'}) • ${top.delivery_municipality}`,
          icon: '/IMAGES/logo.jpeg',
        });
      } catch {
        // ignore notification errors
      }
    }
  }, []);

  const checkOrders = useCallback(async () => {
    try {
      const fetched = await fetchAdminOrderAlerts(15);
      setRecentOrders(fetched);

      if (!initializedRef.current) {
        initializedRef.current = true;
        // On initial mount: alert for any 'Pendiente' order created in the last 24h that hasn't been acknowledged yet
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const unseenPending = fetched.filter(
          (o) =>
            o.status === 'Pendiente' &&
            !ackSetRef.current.has(o.id) &&
            new Date(o.created_at).getTime() >= cutoff
        );

        // Mark older non-pending orders as known so they don't pop up unexpectedly
        const nextAck = new Set(ackSetRef.current);
        fetched.forEach((o) => {
          if (o.status !== 'Pendiente' || new Date(o.created_at).getTime() < cutoff) {
            nextAck.add(o.id);
          }
        });
        persistAckIds(nextAck);

        if (unseenPending.length > 0) {
          triggerOrderAlertPopup(unseenPending, true);
        }
        return;
      }

      // Subsequent polls: any order not in ackSetRef and not currently in alertQueue is brand new
      const brandNew = fetched.filter((o) => !ackSetRef.current.has(o.id));
      if (brandNew.length > 0) {
        triggerOrderAlertPopup(brandNew, true);
      }
    } catch (err) {
      console.warn('Order alert poll warning:', err);
    }
  }, [persistAckIds, triggerOrderAlertPopup]);

  // Poll every 15 seconds + subscribe to Supabase Realtime INSERT on public.orders
  useEffect(() => {
    checkOrders();
    const intervalId = setInterval(checkOrders, 15000);

    let supabaseChannel: any = null;
    let supabaseClient: any = null;
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        supabaseChannel = supabaseClient
          .channel('admin-global-order-alerts')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'orders' },
            () => {
              // Immediately fetch enriched order with items and tier
              checkOrders();
            }
          )
          .subscribe();
      }
    } catch (err) {
      console.warn('Realtime subscription fallback to polling:', err);
    }

    return () => {
      clearInterval(intervalId);
      if (supabaseClient && supabaseChannel) {
        supabaseClient.removeChannel(supabaseChannel);
      }
    };
  }, [checkOrders]);

  // Repeat chime up to 2 additional times every 12 seconds while an unacknowledged popup is open
  useEffect(() => {
    if (alertQueue.length === 0 || !soundEnabled || isTestMode) return;
    let repeatCount = 0;
    const timer = setInterval(() => {
      repeatCount += 1;
      if (repeatCount <= 2 && soundEnabledRef.current) {
        playEnterpriseOrderChime();
      } else {
        clearInterval(timer);
      }
    }, 12000);
    return () => clearInterval(timer);
  }, [alertQueue.length, soundEnabled, isTestMode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const acknowledgeOrder = (orderId: string) => {
    const nextAck = new Set(ackSetRef.current);
    nextAck.add(orderId);
    persistAckIds(nextAck);

    setAlertQueue((prev) => {
      const filtered = prev.filter((o) => o.id !== orderId);
      if (filtered.length === 0) setIsTestMode(false);
      return filtered;
    });
    setActiveAlertIndex(0);
  };

  const acknowledgeAll = () => {
    const nextAck = new Set(ackSetRef.current);
    alertQueue.forEach((o) => nextAck.add(o.id));
    recentOrders.forEach((o) => nextAck.add(o.id));
    persistAckIds(nextAck);
    setAlertQueue([]);
    setIsTestMode(false);
  };

  const handleTestAlert = () => {
    // Request browser notification permission if default
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    playEnterpriseOrderChime();
    setIsTestMode(true);

    if (recentOrders.length > 0) {
      setAlertQueue([recentOrders[0]]);
      setActiveAlertIndex(0);
    } else {
      const demoOrder: Order = {
        id: 'demo-alert-preview',
        clerk_user_id: null,
        customer_name: 'Restaurante El Solar Bucaramanga (Prueba)',
        customer_email: 'compras@elsolar.co',
        customer_phone: '3112694676',
        delivery_address: 'Cra 35 #48-12, Cabecera del Llano',
        delivery_municipality: 'Bucaramanga',
        total_amount: 185400,
        status: 'Pendiente',
        payment_method: 'cash',
        notes: '[VENTANA DESEADA: Mañana Temprano (7:00 AM - 10:00 AM)] Entregar por entrada de proveedores',
        created_at: new Date().toISOString(),
        scheduled_delivery_date: new Date().toISOString().split('T')[0],
        customer_tier: 'Restaurantes',
        customer_business_name: 'Restaurante El Solar S.A.S.',
        order_items: [
          { id: '1', order_id: 'demo', product_id: 'p1', product_name: 'Aguacate Papelillo Extra', quantity: 10, price_at_purchase: 6500 },
          { id: '2', order_id: 'demo', product_id: 'p2', product_name: 'Tomate Chonto Seleccionado', quantity: 15, price_at_purchase: 4200 },
          { id: '3', order_id: 'demo', product_id: 'p3', product_name: 'Limón Tahití Fresco', quantity: 12, price_at_purchase: 4783 },
        ],
      };
      setAlertQueue([demoOrder]);
      setActiveAlertIndex(0);
    }
    setDropdownOpen(false);
  };

  const pendingOrdersCount = recentOrders.filter((o) => o.status === 'Pendiente').length;
  const unacknowledgedCount = recentOrders.filter(
    (o) => o.status === 'Pendiente' && !acknowledgedIds.has(o.id)
  ).length;

  const currentAlertOrder = alertQueue[activeAlertIndex] || alertQueue[0] || null;
  const currentTierStyle = currentAlertOrder ? getTierBadgeStyle(currentAlertOrder.customer_tier) : null;

  return (
    <>
      {/* Top Bar Controls */}
      <div className="flex items-center gap-2.5" ref={dropdownRef}>
        {/* Sound Toggle Pill */}
        <button
          type="button"
          onClick={toggleSound}
          title={soundEnabled ? 'Alerta sonora activada (Clic para silenciar)' : 'Alerta sonora silenciada (Clic para activar)'}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all ${
            soundEnabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
          }`}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span className="hidden sm:inline">Sonido Activo</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-gray-400" />
              <span className="hidden sm:inline">Silenciado</span>
            </>
          )}
        </button>

        {/* Test Sound & Popup Button */}
        <button
          type="button"
          onClick={handleTestAlert}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-[#1C2059]/10 hover:bg-[#1C2059] text-[#1C2059] hover:text-white border border-[#1C2059]/20 transition-all"
          title="Probar sonido y popup de notificación de pedido"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Probar Alerta</span>
        </button>

        {/* Notification Bell & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={`relative p-2.5 rounded-full border transition-all ${
              unacknowledgedCount > 0 || pendingOrdersCount > 0
                ? 'bg-red-50 border-red-200 text-[#E30613] hover:bg-red-100'
                : 'bg-gray-50 border-gray-200 text-slate-600 hover:bg-gray-100'
            }`}
            title="Centro de Alertas de Pedidos"
          >
            <Bell className={`w-5 h-5 ${unacknowledgedCount > 0 ? 'animate-bounce' : ''}`} />
            {(unacknowledgedCount > 0 || pendingOrdersCount > 0) && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[#E30613] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                {unacknowledgedCount > 0 ? unacknowledgedCount : pendingOrdersCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#4CAF50]" />
                    Alertas de Pedidos en Vivo
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {pendingOrdersCount} pedido(s) en estado Pendiente
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestAlert}
                  className="text-[11px] font-bold bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors"
                >
                  🔊 Probar
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    No hay pedidos recientes registrados.
                  </div>
                ) : (
                  recentOrders.slice(0, 8).map((order) => {
                    const tierInfo = getTierBadgeStyle(order.customer_tier);
                    const isPending = order.status === 'Pendiente';
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setDropdownOpen(false);
                          setIsTestMode(false);
                          setAlertQueue([order]);
                          setActiveAlertIndex(0);
                          if (soundEnabled) playEnterpriseOrderChime();
                        }}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                          isPending ? 'bg-red-50/30' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-[10px] font-black text-slate-400 uppercase">
                              #{order.id.slice(0, 8)}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierInfo.bg}`}>
                              {tierInfo.shortLabel}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isPending
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 text-xs truncate">
                            {order.customer_business_name || order.customer_name}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {order.delivery_municipality} • {new Date(order.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-black text-xs text-[#4CAF50]">
                            ${Number(order.total_amount).toLocaleString('es-CO')}
                          </p>
                          <span className="text-[10px] text-indigo-600 font-bold hover:underline">
                            Ver alerta →
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <Link
                  href="/admin/orders"
                  onClick={() => setDropdownOpen(false)}
                  className="text-xs font-black text-[#1C2059] hover:underline"
                >
                  Ir a Gestión de Pedidos →
                </Link>
                {unacknowledgedCount > 0 && (
                  <button
                    type="button"
                    onClick={acknowledgeAll}
                    className="text-[11px] font-bold text-gray-500 hover:text-gray-800"
                  >
                    Marcar todos vistos
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enterprise Real-Time Order Alert Popup Modal */}
      {currentAlertOrder && currentTierStyle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-2 border-[#4CAF50] overflow-hidden transform transition-all">
            {/* Top Alert Banner */}
            <div className="bg-gradient-to-r from-[#1C2059] via-[#1E293B] to-[#0F172A] text-white p-6 relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#4CAF50] text-white flex items-center justify-center shadow-lg shadow-[#4CAF50]/30 shrink-0 animate-bounce">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#4CAF50] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                        {isTestMode ? 'Alerta de Prueba' : '¡Nuevo Pedido Recibido!'}
                      </span>
                      <span className="text-xs font-mono text-slate-300">
                        #{currentAlertOrder.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-xl font-black mt-1 tracking-tight">
                      {currentAlertOrder.customer_business_name || currentAlertOrder.customer_name}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => acknowledgeOrder(currentAlertOrder.id)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Cerrar alerta"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Multi-alert pagination bar if multiple new orders arrived */}
              {alertQueue.length > 1 && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">
                    Mostrando alerta {activeAlertIndex + 1} de {alertQueue.length} pedidos nuevos
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeAlertIndex === 0}
                      onClick={() => setActiveAlertIndex((i) => Math.max(0, i - 1))}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={activeAlertIndex >= alertQueue.length - 1}
                      onClick={() => setActiveAlertIndex((i) => Math.min(alertQueue.length - 1, i + 1))}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Details Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Tier + Total Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                    Tipo de Cliente (Tier)
                  </p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${currentTierStyle.bg}`}>
                    <currentTierStyle.Icon className="w-3.5 h-3.5" />
                    {currentTierStyle.label}
                  </span>
                  {currentAlertOrder.customer_business_name && (
                    <p className="text-xs font-bold text-slate-600 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Contacto: {currentAlertOrder.customer_name}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-0.5">
                    Total del Pedido
                  </p>
                  <p className="text-2xl font-black text-[#4CAF50]">
                    ${Number(currentAlertOrder.total_amount).toLocaleString('es-CO')}
                  </p>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    {currentAlertOrder.payment_method === 'cash' ? '💵 Pago Contra Entrega' : '💳 Pago Online (Wompi)'}
                  </span>
                </div>
              </div>

              {/* Delivery & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <MapPin className="w-4 h-4 text-[#E30613] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Dirección de Entrega</p>
                    <p className="font-bold text-slate-800 text-xs">{currentAlertOrder.delivery_address}</p>
                    <p className="text-xs font-black text-[#1C2059]">{currentAlertOrder.delivery_municipality}, Santander</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Teléfono / WhatsApp</p>
                    <p className="font-bold text-slate-800 text-xs">{currentAlertOrder.customer_phone || 'No registrado'}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      Entrega: {currentAlertOrder.scheduled_delivery_date || 'Inmediata'}
                    </p>
                  </div>
                </div>
              </div>

              {currentAlertOrder.notes && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-black uppercase block mb-0.5">Notas / Ventana Horaria:</span>
                  {currentAlertOrder.notes}
                </div>
              )}

              {/* Order Items Preview */}
              {currentAlertOrder.order_items && currentAlertOrder.order_items.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Productos Solicitados ({currentAlertOrder.order_items.length} ítems)
                  </p>
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-40 overflow-y-auto">
                    {currentAlertOrder.order_items.map((item, idx) => (
                      <div key={idx} className="px-3.5 py-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="font-black text-slate-600">
                          ${(item.quantity * item.price_at_purchase).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-5 bg-slate-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {currentAlertOrder.customer_phone && (
                  <a
                    href={buildWhatsAppChatUrl(
                      currentAlertOrder.customer_phone,
                      buildOrderConfirmationMessage(currentAlertOrder)
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-white" />
                    Confirmar WhatsApp
                  </a>
                )}

                {currentAlertOrder.id !== 'demo-alert-preview' && (
                  <a
                    href={`/admin/orders/invoice/${currentAlertOrder.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1C2059] hover:bg-[#2A2F7A] text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    Factura & Remisión
                  </a>
                )}

                <Link
                  href="/admin/orders"
                  onClick={() => acknowledgeOrder(currentAlertOrder.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-slate-700 border border-gray-300 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver Tablero
                </Link>
              </div>

              <button
                type="button"
                onClick={() => acknowledgeOrder(currentAlertOrder.id)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#4CAF50] hover:bg-[#3d8c40] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all ml-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                Enterado
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
