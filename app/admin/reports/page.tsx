"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, Users, AlertTriangle } from 'lucide-react';

const salesData = [
  { name: 'Lun', Retail: 4000, Micro: 2400, Restaurante: 2400 },
  { name: 'Mar', Retail: 3000, Micro: 1398, Restaurante: 2210 },
  { name: 'Mié', Retail: 2000, Micro: 9800, Restaurante: 2290 },
  { name: 'Jue', Retail: 2780, Micro: 3908, Restaurante: 2000 },
  { name: 'Vie', Retail: 1890, Micro: 4800, Restaurante: 2181 },
  { name: 'Sáb', Retail: 2390, Micro: 3800, Restaurante: 2500 },
  { name: 'Dom', Retail: 3490, Micro: 4300, Restaurante: 2100 },
];

const spoilageData = [
  { category: 'Frutas', Merma: 45, Recuperado: 30 },
  { category: 'Verduras', Merma: 80, Recuperado: 50 },
  { category: 'Carnes', Merma: 10, Recuperado: 0 },
];

export default function AdminReportsPage() {
  return (
    <div className="w-full space-y-8">
      <div className="mb-4">
         <h1 className="text-3xl font-black text-slate-800 font-serif">Reportes y Trazabilidad</h1>
         <p className="text-gray-500">Métricas en tiempo real, márgenes por nivel y seguimiento de mermas agrícolas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-green-50 p-4 rounded-xl text-green-600"><TrendingUp /></div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ventas Generales (Semana)</p>
               <h3 className="text-2xl font-black text-slate-800">$45,210M COP</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-yellow-50 p-4 rounded-xl text-yellow-600"><Users /></div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Flujo B2B (Rest/Micro)</p>
               <h3 className="text-2xl font-black text-slate-800">68% <span className="text-sm text-gray-400 font-medium">del volumen</span></h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-red-50 p-4 rounded-xl text-red-600"><AlertTriangle /></div>
            <div>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Merma (Desperdicio)</p>
               <h3 className="text-2xl font-black text-slate-800">2.4% <span className="text-sm text-gray-400 font-medium">Bajo control</span></h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Proyección de Ventas por Tier (miles de COP)</h3>
            <div className="h-80 w-full">
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
                   <XAxis dataKey="name" />
                   <YAxis />
                   <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3}/>
                   <Tooltip />
                   <Legend />
                   <Area type="monotone" dataKey="Retail" stroke="#4CAF50" fillOpacity={1} fill="url(#colorRetail)" />
                   <Area type="monotone" dataKey="Micro" stroke="#2196F3" fillOpacity={1} fill="url(#colorMicro)" />
                   <Area type="monotone" dataKey="Restaurante" stroke="#FFCC00" fillOpacity={1} fill="url(#colorRest)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Seguimiento de Merma Agrícola (Kg)</h3>
            <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={spoilageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3}/>
                   <XAxis dataKey="category" />
                   <YAxis />
                   <Tooltip />
                   <Legend />
                   <Bar dataKey="Merma" stackId="a" fill="#E30613" radius={[0,0,4,4]} />
                   <Bar dataKey="Recuperado" stackId="a" fill="#4CAF50" radius={[4,4,0,0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}
