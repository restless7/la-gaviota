"use client";

import React, { useState } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { Order, initialOrders, OrderStatus } from '@/src/data/mockOrders';
import { OrderSummarySheet } from './OrderSummarySheet';

const COLUMNS: OrderStatus[] = ['Pendiente', 'En Preparación', 'En Ruta', 'Entregado'];

export function OrderKanbanBoard() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setOrders((prev) => {
      const activeOrder = prev.find((o) => o.id === activeId);
      const overOrder = prev.find((o) => o.id === overId);

      if (!activeOrder) return prev;

      // If we dropped over a column directly (empty column or dropping area)
      if (COLUMNS.includes(overId as OrderStatus)) {
        return prev.map(o => o.id === activeId ? { ...o, status: overId as OrderStatus } : o);
      }

      // If dropped over another item
      if (overOrder) {
        if (activeOrder.status !== overOrder.status) {
          // Changed status
          const updated = [...prev];
          const movedIdx = updated.findIndex(o => o.id === activeId);
          updated[movedIdx] = { ...updated[movedIdx], status: overOrder.status };
          return updated;
        } else {
          // Same status, just reorder
          const oldIndex = prev.findIndex((item) => item.id === activeId);
          const newIndex = prev.findIndex((item) => item.id === overId);
          return arrayMove(prev, oldIndex, newIndex);
        }
      }

      return prev;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between mb-6">
         <div>
            <h1 className="text-3xl font-black text-slate-800 font-serif">Gestión de Pedidos</h1>
            <p className="text-gray-500">Arrastra las tarjetas para cambiar el estado de la operación logística.</p>
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
                   onSelectOrder={(order: Order) => setSelectedOrder(order)} 
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
    </div>
  );
}
