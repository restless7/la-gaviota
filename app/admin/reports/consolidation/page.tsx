import React from 'react';
import { Package, Download, Printer, Filter, Calendar } from 'lucide-react';
import { fetchOrderConsolidation } from '@/src/actions/orders';

export default async function OrderConsolidationPage() {
  const consolidatedItems = await fetchOrderConsolidation();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 font-serif">
            <Package className="text-[#E30613]" size={32} />
            Resumen de Carga y Pedidos
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Consolidado total de productos requeridos para pedidos pendientes.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Printer size={18} />
            Imprimir Lista
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1C2059] text-white rounded-xl text-sm font-bold hover:bg-[#151846] transition-all shadow-md">
            <Download size={18} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Stats Summary Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total SKUs</p>
          <p className="text-3xl font-black text-slate-800">{consolidatedItems.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Estado Filtro</p>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold border border-orange-100">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Pendientes
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Fecha Generación</p>
          <p className="text-sm font-bold text-slate-600">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* Main Consolidation Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-bold text-lg text-slate-800">Lista Consolidada de Productos</h2>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
             <Filter size={14} />
             ORDENAR POR CANTIDAD
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                <th className="px-8 py-4">Producto</th>
                <th className="px-8 py-4 text-center">Cantidad Total</th>
                <th className="px-8 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {consolidatedItems.map((item, idx) => (
                <tr key={item.name} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        {idx + 1}
                      </div>
                      <span className="font-bold text-slate-700 text-lg tracking-tight">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="inline-block px-4 py-2 bg-slate-100 text-slate-800 rounded-2xl font-black text-xl min-w-[80px]">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-[10px] font-black uppercase text-gray-400 hover:text-red-600 transition-colors">
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
              {consolidatedItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Package size={48} className="opacity-20" />
                      <p className="font-medium italic">No hay pedidos pendientes para consolidar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info for print */}
        <div className="p-8 bg-slate-50 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Documento generado automáticamente por La Gaviota OS — Reporte de Logística
          </p>
        </div>
      </div>
    </div>
  );
}
