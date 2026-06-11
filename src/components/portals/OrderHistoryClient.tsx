'use client';

import React, { useState } from 'react';
import { Package, Truck, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { useRouter } from 'next/navigation';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Pendiente': return <Clock className="h-5 w-5 text-amber-500" />;
    case 'En Preparación': return <Package className="h-5 w-5 text-blue-500" />;
    case 'En Ruta': return <Truck className="h-5 w-5 text-purple-500" />;
    case 'Entregado': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'Cancelado': return <XCircle className="h-5 w-5 text-red-500" />;
    default: return <Clock className="h-5 w-5 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pendiente': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'En Preparación': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'En Ruta': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Entregado': return 'bg-green-50 text-green-700 border-green-200';
    case 'Cancelado': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export function OrderHistoryClient({ orders, catalogProducts }: { orders: any[], catalogProducts?: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { addToCart } = useCart();
  const router = useRouter();

  const handleReorder = (e: React.MouseEvent, order: any) => {
    e.stopPropagation();
    if (!order.order_items || order.order_items.length === 0) {
      alert("No hay productos disponibles para reordenar en esta compra.");
      return;
    }
    
    // We try to add each item. If we have the full catalog passed, we can add the full object.
    // If not, the addToCart function might only need {id, name, price, imageUrl}.
    let addedCount = 0;
    order.order_items.forEach((item: any) => {
      // Find full product details if catalog is provided, else construct a minimal mock product
      const fullProduct = catalogProducts?.find(p => p.id === item.product_id);
      
      const productToAdd = fullProduct || {
        id: item.product_id,
        name: item.product_name,
        priceRetail: item.price_at_purchase,
        priceMicro: item.price_at_purchase,
        priceRestaurant: item.price_at_purchase,
        imageUrl: '',
        unit: 'Und'
      };

      addToCart(productToAdd, item.quantity);
      addedCount++;
    });

    alert(`¡Se han agregado ${addedCount} productos a tu carrito!`);
    router.push('/cart');
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Aún no tienes pedidos</h3>
        <p className="text-gray-500">Tus compras recientes aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-black text-slate-800 font-serif flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-[#E30613]" />
          Historial de Compras
        </h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => {
          const isExpanded = expandedId === order.id;
          const wompiMatch = order.notes?.match(/\[Wompi TX: ([a-zA-Z0-9-]+) - (.*?)\]/);
          const txId = wompiMatch ? wompiMatch[1] : null;

          return (
            <div 
              key={order.id} 
              className={`bg-white rounded-2xl border ${isExpanded ? 'border-gray-300 shadow-md' : 'border-gray-100 shadow-sm hover:border-gray-300'} transition-all overflow-hidden cursor-pointer`}
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
            >
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-slate-50 p-2 rounded-full border border-gray-100 shadow-sm">
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="font-bold text-slate-800 text-lg">
                      ${(order.total_amount).toLocaleString('es-CO')} COP
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-gray-500 font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                      {txId && <span className="text-gray-400 font-mono">• Ref: {txId}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-auto">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => handleReorder(e, order)}
                      className="bg-[#4CAF50] hover:bg-[#3d8c40] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors uppercase tracking-wider hidden md:block"
                    >
                      Volver a Pedir
                    </button>
                    <button className="text-gray-400 hover:text-slate-800 transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-slate-50/50 p-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Detalle del Pedido</h4>
                    <button 
                      onClick={(e) => handleReorder(e, order)}
                      className="md:hidden bg-[#4CAF50] text-white px-3 py-1 rounded-md text-[10px] font-bold shadow-sm uppercase tracking-wider"
                    >
                      Reordenar
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {order.order_items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-black text-slate-500">{item.quantity}</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800 leading-tight">{item.product_name}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">${item.price_at_purchase.toLocaleString('es-CO')} c/u</p>
                          </div>
                        </div>
                        <span className="font-black text-slate-800 text-sm">
                          ${(item.quantity * item.price_at_purchase).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="font-bold text-gray-500 uppercase text-xs tracking-wider">Total Final</span>
                    <span className="text-xl font-black text-[#E30613]">
                      ${(order.total_amount).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
