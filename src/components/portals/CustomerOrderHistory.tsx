import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Package, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function CustomerOrderHistory() {
  const { userId } = await auth();
  if (!userId) return null;

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !orders || orders.length === 0) {
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-800 font-serif">Tu Historial de Pedidos</h2>
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => {
          // Extract Wompi TX ID if present in notes
          const wompiMatch = order.notes?.match(/\[Wompi TX: ([a-zA-Z0-9-]+) - (.*?)\]/);
          const txId = wompiMatch ? wompiMatch[1] : null;

          return (
            <div key={order.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getStatusIcon(order.status)}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="font-bold text-slate-800 text-lg">
                    ${(order.total_amount).toLocaleString('es-CO')} COP
                  </p>
                  {txId && (
                    <p className="text-xs text-gray-500 font-mono mt-1">Ref: {txId}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <button className="text-sm font-bold text-[#CC0000] hover:underline">
                  Ver Detalles
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
