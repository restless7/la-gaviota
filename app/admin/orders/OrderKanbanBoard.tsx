"use client";

import React, { useState, useTransition } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { Order, updateOrderStatus, closeOperationalDay, fetchHistoricOrdersByDate } from '@/src/actions/orders';
import { OrderSummarySheet } from './OrderSummarySheet';
import { ProcurementSheet } from './ProcurementSheet';
import { AlertTriangle, Archive, CalendarDays } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const COLUMNS: Order['status'][] = ['Pendiente', 'En Preparación', 'En Ruta', 'Entregado'];

export function OrderKanbanBoard({ initialOrders, historicLedgers }: { initialOrders: Order[], historicLedgers: any[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcurementSheetOpen, setIsProcurementSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORIC'>('ACTIVE');
  const [isClosingDay, startClosingDay] = useTransition();
  const [selectedLedgerDate, setSelectedLedgerDate] = useState<string | null>(null);
  const [historicOrders, setHistoricOrders] = useState<Order[]>([]);
  const { user } = useUser();

  React.useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  React.useEffect(() => {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload: any) => {
          const updatedOrder = payload.new;
          setOrders((prev) => 
            prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
          );
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
      } catch (error: any) {
        alert(error.message || 'Error al cerrar el día operativo.');
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between mb-4">
         <div>
            <h1 className="text-3xl font-black text-slate-800 font-serif">Gestión de Pedidos</h1>
            <p className="text-gray-500">Centro de control logístico empresarial.</p>
         </div>
         <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsProcurementSheetOpen(true)}
              className="flex bg-[#1C2059] hover:bg-[#2A2F7A] text-white font-bold py-2 px-4 rounded-xl shadow-md transition-colors items-center gap-2 text-sm uppercase tracking-wider"
            >
              <Archive className="w-4 h-4" /> Consolidado
            </button>
            <button 
              onClick={handleDayClosure}
              disabled={!canCloseDay || isClosingDay}
              title={!canCloseDay ? 'No puedes cerrar el día con órdenes activas en ruta o preparación' : 'Cerrar libro diario'}
              className={`flex font-bold py-2 px-4 rounded-xl shadow-md transition-colors items-center gap-2 text-sm uppercase tracking-wider ${
                canCloseDay ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CalendarDays className="w-4 h-4" /> {isClosingDay ? 'Cerrando...' : 'Cerrar Operación del Día'}
            </button>
         </div>
      </div>

      <div className="flex gap-4 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`pb-2 px-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'ACTIVE' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Tablero Activo
        </button>
        <button
          onClick={() => setActiveTab('HISTORIC')}
          className={`pb-2 px-4 font-bold text-sm uppercase tracking-wider transition-colors ${activeTab === 'HISTORIC' ? 'text-[#E30613] border-b-2 border-[#E30613]' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Historial de Cierres
        </button>
      </div>

      {activeTab === 'ACTIVE' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {COLUMNS.map((status) => {
              const columnOrders = orders.filter((o) => o.status === status);
              return (
                <SortableContext key={status} id={status} items={columnOrders.map(o => o.id)}>
                  <KanbanColumn
                     status={status}
                     orders={columnOrders}
                     onSelectOrder={(order: any) => setSelectedOrder(order)}
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
                           {historicOrders.length === 0 ? (
                             <p className="text-gray-400 text-sm">No se encontraron detalles para este cierre.</p>
                           ) : historicOrders.map(ho => (
                             <div key={ho.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 opacity-80 cursor-pointer" onClick={() => setSelectedOrder(ho)}>
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-black text-gray-400">{ho.id.slice(0, 8)}</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700">Entregado</span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm mb-1">{ho.customer_name}</h4>
                                <div className="flex justify-between items-end mt-4">
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    {new Date(ho.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                  <span className="font-black text-[#4CAF50]">${Number(ho.total_amount).toLocaleString('es-CO')}</span>
                                </div>
                             </div>
                           ))}
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
