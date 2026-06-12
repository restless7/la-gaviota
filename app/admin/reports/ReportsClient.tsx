"use client";

import React, { useState, useTransition } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Calendar as CalendarIcon, Filter, PlusCircle, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { logAgriculturalShrinkage } from '@/src/actions/analytics';

interface ReportsClientProps {
  salesData: any[];
  shrinkageData: any[];
  products: { id: string; name: string; category: string }[];
  summary: {
    totalRevenue: number;
    retailRatio: number;
    microRatio: number;
    restRatio: number;
    averageTicket: number;
    avgRetail: number;
    avgMicro: number;
    avgRest: number;
    activeOrders: number;
  };
  currentFilters: {
    startDate?: string;
    endDate?: string;
    productId?: string;
  };
}

export default function ReportsClient({ salesData, shrinkageData, summary, products, currentFilters }: ReportsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [dateRange, setDateRange] = useState<string>('all'); // 'all', '7d', '30d'
  const [selectedProduct, setSelectedProduct] = useState<string>(currentFilters.productId || '');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shrinkageForm, setShrinkageForm] = useState({ productId: '', quantityKg: '', logType: 'MERMA_TOTAL', reason: '' });

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (type === 'product') {
      if (value) params.set('productId', value);
      else params.delete('productId');
      setSelectedProduct(value);
    }

    if (type === 'date') {
      setDateRange(value);
      const today = new Date();
      let startStr = '';
      
      if (value === '7d') {
        today.setDate(today.getDate() - 7);
        startStr = today.toISOString().split('T')[0];
      } else if (value === '30d') {
        today.setDate(today.getDate() - 30);
        startStr = today.toISOString().split('T')[0];
      }

      if (startStr) params.set('startDate', startStr);
      else params.delete('startDate');
      
      // Clear end date just in case
      params.delete('endDate');
    }

    startTransition(() => {
      router.push(`/admin/reports?${params.toString()}`);
    });
  };

  const handleShrinkageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shrinkageForm.productId || !shrinkageForm.quantityKg || !shrinkageForm.logType) return;
    
    startTransition(async () => {
      try {
        await logAgriculturalShrinkage({
          productId: shrinkageForm.productId,
          quantityKg: parseFloat(shrinkageForm.quantityKg),
          logType: shrinkageForm.logType as any,
          reason: shrinkageForm.reason
        });
        setIsModalOpen(false);
        setShrinkageForm({ productId: '', quantityKg: '', logType: 'MERMA_TOTAL', reason: '' });
        alert('Novedad de merma registrada con éxito.');
      } catch (error: any) {
        alert(error.message || 'Error al registrar merma.');
      }
    });
  };

  return (
    <div className={`w-full space-y-8 transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
         <div>
            <h1 className="text-3xl font-black text-slate-800 font-serif">Reportes y Trazabilidad</h1>
            <p className="text-gray-500">Inteligencia de negocios de alta densidad.</p>
         </div>
         
         <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 border-r border-gray-100">
               <CalendarIcon className="w-4 h-4 text-gray-400" />
               <select 
                 className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                 value={dateRange}
                 onChange={(e) => handleFilterChange('date', e.target.value)}
               >
                 <option value="all">Histórico Completo</option>
                 <option value="7d">Últimos 7 días</option>
                 <option value="30d">Últimos 30 días</option>
               </select>
            </div>
            
            <div className="flex items-center gap-2 px-3">
               <Filter className="w-4 h-4 text-gray-400" />
               <select 
                 className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer max-w-[200px]"
                 value={selectedProduct}
                 onChange={(e) => handleFilterChange('product', e.target.value)}
               >
                 <option value="">Todos los Productos</option>
                 {products.map(p => (
                   <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                 ))}
               </select>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-green-50 p-4 rounded-xl text-green-600"><TrendingUp /></div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ingresos Totales Reales</p>
               <h3 className="text-2xl font-black text-slate-800">${(summary.totalRevenue / 1_000_000).toFixed(2)}M COP</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-yellow-50 p-4 rounded-xl text-yellow-600"><Users /></div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Flujo B2B (Rest/Micro)</p>
               <h3 className="text-2xl font-black text-slate-800">{(summary.restRatio + summary.microRatio).toFixed(0)}% <span className="text-sm text-gray-400 font-medium">del volumen</span></h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-4 rounded-xl text-blue-600"><AlertTriangle /></div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pedidos en Curso</p>
               <h3 className="text-2xl font-black text-slate-800">{summary.activeOrders} <span className="text-sm text-gray-400 font-medium">activos</span></h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ticket Promedio Global</p>
            <p className="text-xl font-black text-slate-800">${(summary.averageTicket / 1000).toFixed(1)}k</p>
         </div>
         <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ticket Restaurantes</p>
            <p className="text-xl font-black text-[#FFCC00]">${(summary.avgRest / 1000).toFixed(1)}k</p>
         </div>
         <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ticket Micromercados</p>
            <p className="text-xl font-black text-[#2196F3]">${(summary.avgMicro / 1000).toFixed(1)}k</p>
         </div>
         <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ticket Retail</p>
            <p className="text-xl font-black text-[#4CAF50]">${(summary.avgRetail / 1000).toFixed(1)}k</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[400px]">
            <h3 className="font-bold text-slate-800 mb-6">Proyección y Realidad de Ventas por Tier (miles de COP)</h3>
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorRetail" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorMicro" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#2196F3" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorRest" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#FFCC00" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#FFCC00" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="name" fontSize={12} />
                   <YAxis fontSize={12} />
                   <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3}/>
                   <RechartsTooltip formatter={(value: number) => [`$${(value / 1000).toFixed(1)}k`, '']} />
                   <Legend />
                   <Area type="monotone" dataKey="Retail" stroke="#4CAF50" fillOpacity={1} fill="url(#colorRetail)" />
                   <Area type="monotone" dataKey="Micro" stroke="#2196F3" fillOpacity={1} fill="url(#colorMicro)" />
                   <Area type="monotone" dataKey="Restaurante" stroke="#FFCC00" fillOpacity={1} fill="url(#colorRest)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[400px] relative">
            <div className="flex justify-between items-start mb-6">
               <h3 className="font-bold text-slate-800">Seguimiento de Merma Agrícola Real (Kg)</h3>
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-1.5 px-3 rounded-full transition-colors"
               >
                 <PlusCircle className="w-3.5 h-3.5" /> Registrar Novedad de Merma
               </button>
            </div>
            
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={shrinkageData.length > 0 ? shrinkageData : [{category:'Sin datos', Merma:0, Recuperado:0}]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3}/>
                   <XAxis dataKey="category" fontSize={12} />
                   <YAxis fontSize={12} />
                   <RechartsTooltip />
                   <Legend />
                   <Bar dataKey="Merma" stackId="a" fill="#E30613" radius={[0,0,4,4]} />
                   <Bar dataKey="Recuperado" stackId="a" fill="#4CAF50" radius={[4,4,0,0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-red-50/30">
                 <h3 className="font-bold text-red-800 flex items-center gap-2">
                   <AlertTriangle className="w-5 h-5 text-red-600" /> Registro de Merma Agrícola
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleShrinkageSubmit} className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Producto de Origen</label>
                    <select 
                      required
                      value={shrinkageForm.productId}
                      onChange={e => setShrinkageForm(prev => ({...prev, productId: e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                      <option value="">Seleccione un producto...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                      ))}
                    </select>
                 </div>
                 
                 <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cantidad (Kg)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.1" 
                        required
                        value={shrinkageForm.quantityKg}
                        onChange={e => setShrinkageForm(prev => ({...prev, quantityKg: e.target.value}))}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de Novedad</label>
                      <select 
                        required
                        value={shrinkageForm.logType}
                        onChange={e => setShrinkageForm(prev => ({...prev, logType: e.target.value}))}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      >
                        <option value="MERMA_TOTAL">Pérdida Total</option>
                        <option value="RECUPERADO_ORGANICO">Recuperado Orgánico</option>
                      </select>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Motivo / Causa (Opcional)</label>
                    <input 
                      type="text" 
                      value={shrinkageForm.reason}
                      onChange={e => setShrinkageForm(prev => ({...prev, reason: e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      placeholder="Ej: Golpe de calor, selección en bodega..."
                    />
                 </div>

                 <button 
                   type="submit" 
                   disabled={isPending}
                   className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-sm transition-colors disabled:opacity-50"
                 >
                   Guardar Registro
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
