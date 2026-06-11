"use client";

import React, { useState, useTransition } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { Order, updateOrderStatus } from '@/src/actions/orders';
import { OrderSummarySheet } from './OrderSummarySheet';
import { ProcurementSheet } from './ProcurementSheet';

const COLUMNS: Order['status'][] = ['Pendiente', 'En Preparación', 'En Ruta', 'Entregado'];

export function OrderKanbanBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcurementSheetOpen, setIsProcurementSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeOrder = orders.find((o) => o.id === activeId);
    if (!activeOrder) return;

    let newStatus: Order['status'] | null = null;

    // If dropped over a column directly
    if (COLUMNS.includes(overId as Order['status'])) {
      newStatus = overId as Order['status'];
    } else {
      // If dropped over another item
      const overOrder = orders.find((o) => o.id === overId);
      if (overOrder && activeOrder.status !== overOrder.status) {
        newStatus = overOrder.status;
      }
    }

    if (newStatus && newStatus !== activeOrder.status) {
      // Optimistic update
      const oldStatus = activeOrder.status;
      setOrders(prev => prev.map(o => o.id === activeId ? { ...o, status: newStatus as Order['status'] } : o));
      
      try {
        await updateOrderStatus(activeId, newStatus);
      } catch (error) {
        console.error('Failed to update order status:', error);
        // Rollback
        setOrders(prev => prev.map(o => o.id === activeId ? { ...o, status: oldStatus } : o));
        alert('Error al actualizar el estado del pedido.');
      }
    } else if (activeOrder.status === (orders.find(o => o.id === overId)?.status)) {
        // Reorder in same column (only local for now)
        const oldIndex = orders.findIndex((item) => item.id === activeId);
        const newIndex = orders.findIndex((item) => item.id === overId);
        setOrders(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between mb-6">
         <div>
            <h1 className="text-3xl font-black text-slate-800 font-serif">Gestión de Pedidos</h1>
            <p className="text-gray-500">Arrastra las tarjetas para cambiar el estado de la operación logística.</p>
         </div>
         <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsProcurementSheetOpen(true)}
              className="hidden sm:flex bg-[#1C2059] hover:bg-[#2A2F7A] text-white font-bold py-2 px-4 rounded-xl shadow-md transition-colors items-center gap-2 text-sm uppercase tracking-wider"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Consolidado
            </button>
            <div className="flex gap-2 text-sm">
              {COLUMNS.map(status => {
                const count = orders.filter(o => o.status === status).length;
                return (
                  <span key={status} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold text-xs">
                    {status}: {count}
                  </span>
                );
              })}
            </div>
         </div>
      </div>

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

      {/* Slide-out Sheet for Order Detail */}
      {selectedOrder && (
         <OrderSummarySheet
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
         />
      )}

      {/* Slide-out Sheet for Procurement */}
      {isProcurementSheetOpen && (
        <ProcurementSheet onClose={() => setIsProcurementSheetOpen(false)} />
      )}
    </div>
  );
}
