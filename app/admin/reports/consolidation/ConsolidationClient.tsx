"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  Download,
  RefreshCcw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
  ArrowLeft,
  ClipboardCheck,
} from 'lucide-react';
import { fetchOrderConsolidation } from '@/src/actions/orders';

export interface ConsolidatedItem {
  id: string;
  name: string;
  quantity: number;
  stock: number;
  unit: string;
  deficit: number;
}

export function exportConsolidationToCSV(items: ConsolidatedItem[], statuses: string[]) {
  const dateStr = new Date().toISOString().split('T')[0];
  const headers = [
    'ID / SKU',
    'Producto',
    'Unidad',
    'Cantidad Requerida',
    'Stock Actual Bodega',
    'Déficit a Comprar',
    'Estado Abastecimiento',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = items.map((item) => [
    escapeCsv(item.id),
    escapeCsv(item.name),
    escapeCsv(item.unit || 'Und'),
    escapeCsv(item.quantity),
    escapeCsv(item.stock),
    escapeCsv(item.deficit),
    escapeCsv(item.deficit > 0 ? `COMPRAR (${item.deficit})` : 'CUBIERTO'),
  ]);

  const csvContent =
    '\uFEFF' +
    `# SURTIFRUVER LA GAVIOTA - CONSOLIDADO DEL DIA (${dateStr})\n` +
    `# NIT: 1007193202-05 | Estados incluidos: ${statuses.join(' + ')}\n` +
    headers.join(',') +
    '\n' +
    rows.map((r) => r.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `consolidado-la-gaviota-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ConsolidationClient({
  initialItems,
}: {
  initialItems: ConsolidatedItem[];
}) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<ConsolidatedItem[]>(initialItems);
  const [statuses, setStatuses] = useState<string[]>(['Pendiente', 'En Preparación']);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyDeficit, setOnlyDeficit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  useEffect(() => {
    setGeneratedAt(
      new Date().toLocaleString('es-CO', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    );
  }, []);

  const loadConsolidation = useCallback(async (targetStatuses: string[]) => {
    if (targetStatuses.length === 0) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchOrderConsolidation(targetStatuses);
      setItems(data);
      setGeneratedAt(
        new Date().toLocaleString('es-CO', {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      );
    } catch (err) {
      console.error('Error refreshing consolidation:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleStatus = (status: string) => {
    const next = statuses.includes(status)
      ? statuses.filter((s) => s !== status)
      : [...statuses, status];
    setStatuses(next);
    loadConsolidation(next);
  };

  // Auto-trigger print dialog if opened with ?print=1
  useEffect(() => {
    if (searchParams?.get('print') === '1' && !isLoading) {
      const timer = setTimeout(() => {
        window.print();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [searchParams, isLoading]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDeficit = !onlyDeficit || item.deficit > 0;
    return matchesSearch && matchesDeficit;
  });

  const totalSkus = filteredItems.length;
  const totalUnitsRequired = filteredItems.reduce((acc, i) => acc + Number(i.quantity || 0), 0);
  const totalDeficitSkus = filteredItems.filter((i) => i.deficit > 0).length;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Screen Top Bar (Hidden in Print) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a Pedidos
            </Link>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-black uppercase tracking-wider text-[#4CAF50]">
              Operación Diaria & Bodega
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 font-serif">
            Consolidado del Día (Picking & Compras)
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Agrupación exacta de productos requeridos para alistar y despachar los pedidos activos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadConsolidation(statuses)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

          <button
            type="button"
            onClick={() => exportConsolidationToCSV(filteredItems, statuses)}
            disabled={filteredItems.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4CAF50] hover:bg-[#3d8c40] text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar Excel (CSV)
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={filteredItems.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C2059] hover:bg-[#2A2F7A] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Filters & KPI Bar (Hidden in Print) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 print:hidden">
        <div className="lg:col-span-7 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400 mr-1">
              Estados Incluidos:
            </span>
            {['Pendiente', 'En Preparación', 'En Ruta'].map((st) => {
              const active = statuses.includes(st);
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => toggleStatus(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#1C2059] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOnlyDeficit((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              onlyDeficit
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {onlyDeficit ? 'Mostrando solo Faltantes' : 'Filtrar solo Faltantes'}
          </button>
        </div>

        <div className="lg:col-span-5 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto o código SKU..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:border-[#1C2059] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        {/* Official Print Header (Always visible in Print + clean summary header on screen) */}
        <div className="p-6 sm:p-8 border-b-2 border-slate-900 bg-slate-50/60 print:bg-white print:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 rounded-xl border border-gray-200 bg-white p-1.5 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/IMAGES/logo.jpeg"
                  alt="La Gaviota"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Surtifruver La Gaviota — Consolidado de Carga y Alistamiento
                </h2>
                <p className="text-xs font-bold text-[#E30613]">
                  NIT: 1007193202-05 • Tel: +57 311 2694676 • lagaviotaverduras@gmail.com
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generado: {generatedAt || 'Hoy'} • Estados: <strong>{statuses.join(', ') || 'Ninguno'}</strong>
                </p>
              </div>
            </div>

            {/* KPI Mini Badges */}
            <div className="flex items-center gap-3 self-stretch sm:self-auto">
              <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400">Referencias</p>
                <p className="text-lg font-black text-slate-900">{totalSkus}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400">Unidades Totales</p>
                <p className="text-lg font-black text-[#1C2059]">{totalUnitsRequired}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2 text-center">
                <p className="text-[10px] font-black uppercase text-red-500">Por Comprar</p>
                <p className="text-lg font-black text-red-600">{totalDeficitSkus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Consolidation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Producto / Referencia</th>
                <th className="py-3.5 px-4 text-center w-28">Presentación</th>
                <th className="py-3.5 px-4 text-center w-36">Cant. Requerida</th>
                <th className="py-3.5 px-4 text-center w-32">Stock Bodega</th>
                <th className="py-3.5 px-4 text-center w-36">Déficit Compra</th>
                <th className="py-3.5 px-4 text-center w-28">Check Bodega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">
                      No hay productos consolidados para los filtros actuales.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Selecciona al menos un estado de pedido con órdenes activas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const hasDeficit = item.deficit > 0;
                  return (
                    <tr
                      key={item.id}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors`}
                    >
                      <td className="py-3 px-4 text-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-black text-slate-800">{item.name}</p>
                        <p className="text-[10px] font-mono text-gray-400">SKU: {item.id}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                          {item.unit || 'Und'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-base font-black text-[#1C2059] bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-600">
                        {item.stock}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasDeficit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Comprar {item.deficit}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Stock OK
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block w-5 h-5 border-2 border-slate-400 rounded" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Print Footer Sign-Off */}
        <div className="p-6 bg-slate-50 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <ClipboardCheck className="w-4 h-4 text-[#4CAF50]" />
            <span>
              Verificación física de alistamiento y cargue de rutas — Surtifruver La Gaviota
            </span>
          </div>
          <div className="flex gap-8 pt-4 sm:pt-0">
            <div className="border-t border-slate-400 pt-1 w-44 text-center text-[10px] uppercase font-bold">
              Firma Jefe de Bodega
            </div>
            <div className="border-t border-slate-400 pt-1 w-44 text-center text-[10px] uppercase font-bold">
              Firma Coordinador Despacho
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

