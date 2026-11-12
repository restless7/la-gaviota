"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { Order, CustomerTierType, updateOrderStatus, closeOperationalDay, fetchHistoricOrdersByDate, getLiveOperationalOrders } from '@/src/actions/orders';
import { OrderSummarySheet } from './OrderSummarySheet';
import { ProcurementSheet } from './ProcurementSheet';
import { getOrderTierPresentation } from './OrderCard';
import { Archive, CalendarDays, Printer, Users, User, Store, UtensilsCrossed } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

interface HistoricLedger {
  id: string;
  operational_date: string;
  total_orders_processed: number;
  total_revenue_collected: number;
  closed_at: string;
}

const COLUMNS: Order['status'][] = ['Pendiente', 'En Preparación', 'En Ruta', 'Entregado'];

type TierFilterOption = 'ALL' | CustomerTierType;

const TIER_FILTERS: {
  id: TierFilterOption;
  label: string;
  shortLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}[] = [
    {
      id: 'ALL',
      label: 'Todos los Clientes',
      shortLabel: 'Todos',
      Icon: Users,
      activeClass: 'bg-[#1C2059] text-white border-[#1C2059]',
    },
    {
      id: 'Personas Naturales',
      label: '🏠 Personas Naturales',
      shortLabel: 'Personas Naturales',
      Icon: User,
      activeClass: 'bg-blue-600 text-white border-blue-600',
    },
    {
      id: 'Micromercados',
      label: '🏪 Micromercados',
      shortLabel: 'Micromercados',
      Icon: Store,
      activeClass: 'bg-emerald-600 text-white border-emerald-600',
    },
    {
      id: 'Restaurantes',
      label: '👨‍🍳 Restaurantes',
      shortLabel: 'Restaurantes',
      Icon: UtensilsCrossed,
      activeClass: 'bg-amber-600 text-white border-amber-600',
    },
  ];

export function OrderKanbanBoard({ initialOrders, historicLedgers }: { initialOrders: Order[], historicLedgers: HistoricLedger[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [prevInitialOrders, setPrevInitialOrders] = useState<Order[]>(initialOrders);
  if (prevInitialOrders !== initialOrders) {
    setPrevInitialOrders(initialOrders);
    setOrders(initialOrders);
  }
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcurementSheetOpen, setIsProcurementSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORIC'>('ACTIVE');
  const [isClosingDay, startClosingDay] = useTransition();
  const [selectedLedgerDate, setSelectedLedgerDate] = useState<string | null>(null);
  const [historicOrders, setHistoricOrders] = useState<Order[]>([]);
  const [filterText, setFilterText] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<TierFilterOption>('ALL');
  const { user } = useUser();

  const resolveOrderTier = (o: Order): CustomerTierType => {
    if (o.customer_tier === 'Micromercados' || o.customer_tier === 'Restaurantes' || o.customer_tier === 'Personas Naturales') {
      return o.customer_tier;
    }
    return 'Personas Naturales';
  };

  const matchesSearchAndTier = (o: Order) => {
    const tierMatch = selectedTierFilter === 'ALL' || resolveOrderTier(o) === selectedTierFilter;
    if (!tierMatch) return false;
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_business_name?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.delivery_address?.toLowerCase().includes(q) ||
      o.delivery_municipality?.toLowerCase().includes(q)
    );
  };

  const filteredOrders = orders.filter(matchesSearchAndTier);
  const filteredHistoricOrders = historicOrders.filter(matchesSearchAndTier);

  React.useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload: { new: Partial<Order> & { id?: string } }) => {
          const updatedOrder = payload.new;
          if (!updatedOrder?.id) return;
          setOrders((prev) =>
            prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async () => {
          try {
            const refreshed = await getLiveOperationalOrders();
            setOrders(refreshed);
          } catch (err) {
            console.warn('Could not refresh live orders after INSERT:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    if (activeTab === 'HISTORIC') return;
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeOrder = orders.find((o) => o.id === activeId);
    if (!activeOrder) return;

    let newStatus: Order['status'] | null = null;

    if (COLUMNS.includes(overId as Order['status'])) {
      newStatus = overId as Order['status'];
    } else {
      const overOrder = orders.find((o) => o.id === overId);
      if (overOrder && activeOrder.status !== overOrder.status) {
        newStatus = overOrder.status;
      }
    }

    if (newStatus && newStatus !== activeOrder.status) {
      const oldStatus = activeOrder.status;
      setOrders(prev => prev.map(o => o.id === activeId ? { ...o, status: newStatus as Order['status'] } : o));

      try {
        await updateOrderStatus(activeId, newStatus);
      } catch (error) {
        console.error('Failed to update order status:', error);
        setOrders(prev => prev.map(o => o.id === activeId ? { ...o, status: oldStatus } : o));
        alert('Error al actualizar el estado del pedido.');
      }
    } else if (activeOrder.status === (orders.find(o => o.id === overId)?.status)) {
      const oldIndex = orders.findIndex((item) => item.id === activeId);
      const newIndex = orders.findIndex((item) => item.id === overId);
      setOrders(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };

  const pendingWithoutConflict = orders.filter(o => !o.is_conflicted && ['Pendiente', 'En Preparación', 'En Ruta'].includes(o.status));
  const canCloseDay = pendingWithoutConflict.length === 0 && orders.length > 0;

  const handleDayClosure = () => {
    if (!canCloseDay) return;
    if (!confirm('¿Estás seguro de cerrar el libro diario? Las órdenes entregadas se archivarán y las que tienen conflictos se moverán a mañana.')) return;

    const todayStr = new Date().toISOString().split('T')[0];

    startClosingDay(async () => {
      try {
        await closeOperationalDay(todayStr, user?.id || 'admin');
        alert('Operación del día cerrada con éxito.');
      } catch (error: unknown) {
        alert(error instanceof Error ? error.message : 'Error al cerrar el día operativo.');
      }
    });
  };

  const countByTier = (tier: TierFilterOption) => {
    const source = activeTab === 'ACTIVE' ? orders : historicOrders;
    if (tier === 'ALL') return source.length;
    return source.filter((o) => resolveOrderTier(o) === tier).length;
  };

  const revenueByTier = (tier: TierFilterOption) => {
    const source = activeTab === 'ACTIVE' ? orders : historicOrders;
    const list = tier === 'ALL' ? source : source.filter((o) => resolveOrderTier(o) === tier);
    return list.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 font-serif">Gestión de Pedidos</h1>
          <p className="text-gray-500 text-sm">Centro de control logístico empresarial con segmentación por Tipo de Cliente.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsProcurementSheetOpen(true)}
            className="flex bg-[#1C2059] hover:bg-[#2A2F7A] text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors items-center gap-2 text-xs uppercase tracking-wider"
          >
            <Archive className="w-4 h-4" /> Consolidado Rápido
          </button>
          <Link
            href="/admin/reports/consolidation"
            className="flex bg-white hover:bg-slate-50 text-[#1C2059] border border-[#1C2059]/20 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors items-center gap-2 text-xs uppercase tracking-wider"
          >
            <Printer className="w-4 h-4" /> Consolidado PDF / Excel
          </Link>
          <button
            onClick={handleDayClosure}
            disabled={!canCloseDay || isClosingDay}
            title={!canCloseDay ? 'No puedes cerrar el día con órdenes activas en ruta o preparación' : 'Cerrar libro diario'}
            className={`flex font-bold py-2.5 px-4 rounded-xl shadow-md transition-colors items-center gap-2 text-xs uppercase tracking-wider ${canCloseDay ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            <CalendarDays className="w-4 h-4" /> {isClosingDay ? 'Cerrando...' : 'Cerrar Operación del Día'}
          </button>
        </div>
      </div>

      {/* Client Type (Tier) Filter Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {TIER_FILTERS.map((tf) => {
          const isSelected = selectedTierFilter === tf.id;
          const count = countByTier(tf.id);
          const revenue = revenueByTier(tf.id);
          return (
            <button
              key={tf.id}
              type="button"
              onClick={() => setSelectedTierFilter(tf.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${isSelected
                  ? `${tf.activeClass} shadow-md`
                  : 'bg-white border-gray-200 text-slate-700 hover:border-gray-300 hover:bg-slate-50'
                }`}
            >
              <div className="min-w-0">
                <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {tf.label}
                </p>
                <p className={`text-[11px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#4CAF50]'}`}>
                  ${revenue.toLocaleString('es-CO')}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabs + Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-200 pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`pb-2 px-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'ACTIVE' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Tablero Activo ({filteredOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORIC')}
            className={`pb-2 px-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'HISTORIC' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Historial de Cierres
          </button>
        </div>
        <div className="flex items-center gap-2">
          {selectedTierFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedTierFilter('ALL')}
              className="text-xs font-bold text-[#E30613] hover:underline px-2 py-1"
            >
              Limpiar filtro ({selectedTierFilter})
            </button>
          )}
          <input
            type="text"
            placeholder="Buscar cliente, negocio, ID o municipio..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:border-[#1C2059] focus:ring-1 focus:ring-[#1C2059] w-full sm:w-80 bg-white"
          />
        </div>
      </div>

      {activeTab === 'ACTIVE' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
            {COLUMNS.map((status) => {
              const columnOrders = filteredOrders.filter((o) => o.status === status);
              return (
                <SortableContext key={status} id={status} items={columnOrders.map(o => o.id)}>
                  <KanbanColumn
                    status={status}
                    orders={columnOrders}
                    onSelectOrder={(order: Order) => setSelectedOrder(order)}
                  />
                </SortableContext>
              );
            })}
          </div>
        </DndContext>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold text-slate-700 uppercase">Fecha Operativa</th>
                <th className="p-4 font-bold text-slate-700 uppercase">Órdenes Procesadas</th>
                <th className="p-4 font-bold text-slate-700 uppercase">Ingresos Recaudados</th>
                <th className="p-4 font-bold text-slate-700 uppercase">Fecha de Cierre</th>
              </tr>
            </thead>
            <tbody>
              {historicLedgers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No hay libros cerrados registrados.</td>
                </tr>
              ) : historicLedgers.map((ledger) => (
                <React.Fragment key={ledger.id}>
                  <tr
                    onClick={async () => {
                      if (selectedLedgerDate === ledger.operational_date) {
                        setSelectedLedgerDate(null);
                        setHistoricOrders([]);
                      } else {
                        setSelectedLedgerDate(ledger.operational_date);
                        const data = await fetchHistoricOrdersByDate(ledger.operational_date);
                        setHistoricOrders(data);
                      }
                    }}
                    className={`border-b border-gray-100 hover:bg-slate-50 cursor-pointer ${selectedLedgerDate === ledger.operational_date ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="p-4 font-medium text-indigo-600">{ledger.operational_date}</td>
                    <td className="p-4">{ledger.total_orders_processed}</td>
                    <td className="p-4 text-green-600 font-bold">${Number(ledger.total_revenue_collected).toLocaleString('es-CO')}</td>
                    <td className="p-4 text-gray-500">{new Date(ledger.closed_at).toLocaleString()}</td>
                  </tr>
                  {selectedLedgerDate === ledger.operational_date && (
                    <tr>
                      <td colSpan={4} className="p-4 bg-slate-50/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {filteredHistoricOrders.length === 0 ? (
                            <p className="text-gray-400 text-sm">No se encontraron detalles para este cierre con el filtro actual.</p>
                          ) : filteredHistoricOrders.map(ho => {
                            const tierInfo = getOrderTierPresentation(ho);
                            return (
                              <div key={ho.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-[#1C2059] cursor-pointer transition-colors" onClick={() => setSelectedOrder(ho)}>
                                <div className="flex justify-between items-start mb-2 gap-1">
                                  <span className="text-[10px] font-black text-gray-400">#{ho.id.slice(0, 8).toUpperCase()}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierInfo.badgeClass}`}>
                                    {tierInfo.label}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm mb-0.5 truncate">
                                  {ho.customer_business_name || ho.customer_name}
                                </h4>
                                {ho.customer_business_name && (
                                  <p className="text-[11px] text-gray-500 truncate">{ho.customer_name}</p>
                                )}
                                <div className="flex justify-between items-end mt-4">
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    {new Date(ho.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="font-black text-[#4CAF50]">${Number(ho.total_amount).toLocaleString('es-CO')}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <OrderSummarySheet
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {isProcurementSheetOpen && (
        <ProcurementSheet onClose={() => setIsProcurementSheetOpen(false)} />
      )}
    </div>
  );
}
