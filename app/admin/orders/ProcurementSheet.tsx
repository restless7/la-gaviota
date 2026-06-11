"use client";

import React, { useEffect, useState } from 'react';
import { X, Package, AlertTriangle, RefreshCcw, ClipboardList } from 'lucide-react';
import { fetchOrderConsolidation } from '@/src/actions/orders';

interface ProcurementItem {
  id: string;
  name: string;
  quantity: number;
  stock: number;
  unit: string;
  deficit: number;
}

export function ProcurementSheet({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statuses, setStatuses] = useState<string[]>(['Pendiente', 'En Preparación']);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchOrderConsolidation(statuses);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statuses]);

  const totalRequired = items.reduce((acc, i) => acc + i.quantity, 0);
  const itemsInDeficit = items.filter(i => i.deficit > 0).length;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-full sm:w-[600px] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5 text-[#1C2059]" />
              <span className="bg-[#1C2059]/10 text-[#1C2059] text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
                Control Logístico
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 font-serif">Consolidado de Abastecimiento</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 flex gap-2 overflow-x-auto bg-white">
          <span className="text-xs font-bold text-gray-400 uppercase flex items-center mr-2">Filtro Estado:</span>
          {['Pendiente', 'En Preparación', 'En Ruta'].map(status => (
            <button
              key={status}
              onClick={() => {
                setStatuses(prev => 
                  prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                );
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statuses.includes(status) ? 'bg-[#1C2059] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <RefreshCcw className="h-8 w-8 animate-spin mb-4" />
              <p className="font-bold text-sm">Calculando necesidades operativas...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-bold">No hay productos requeridos</p>
              <p className="text-xs mt-1 text-slate-500">Ajuste los filtros de estado de pedido.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Total Referencias</p>
                    <p className="text-2xl font-black text-slate-800">{items.length}</p>
                 </div>
                 <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-[10px] uppercase font-black text-red-500 tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Faltantes
                    </p>
                    <p className="text-2xl font-black text-red-600">{itemsInDeficit}</p>
                 </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500 font-black">
                    <tr>
                      <th className="p-4">Producto</th>
                      <th className="p-4 text-center">Requerido</th>
                      <th className="p-4 text-center">Stock</th>
                      <th className="p-4 text-right">Déficit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item) => {
                      const hasDeficit = item.deficit > 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-sm text-slate-800">{item.name}</p>
                            <p className="text-[10px] text-gray-400">{item.unit}</p>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-black text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-bold text-slate-500">
                              {item.stock}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {hasDeficit ? (
                              <span className="font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg flex items-center justify-end gap-1 w-fit ml-auto">
                                <AlertTriangle className="h-3 w-3" />
                                {item.deficit}
                              </span>
                            ) : (
                              <span className="text-green-500 font-black text-xs">✓ OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-gray-100 mt-auto flex justify-between items-center">
          <p className="text-[10px] text-gray-400 font-bold max-w-[200px] leading-tight">
            Este reporte agrupa las cantidades exactas requeridas para despachar las órdenes seleccionadas.
          </p>
          <button onClick={loadData} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 px-6 rounded-xl transition-all text-xs uppercase tracking-wider flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" /> Refrescar
          </button>
        </div>
      </div>
    </>
  );
}
