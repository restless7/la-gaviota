'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  PackageSearch,
  ShoppingCart,
  Globe,
  Database,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import { initialOrders } from '@/src/data/mockOrders';
import { mockSuppliers } from '@/src/data/mockSuppliers';
import { products } from '@/src/data/products';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  trend
}: {
  title: string;
  value: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  color: string;
  bgColor: string;
  trend?: string;
}) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 ${bgColor} rounded-full blur-3xl -mr-16 -mt-16 opacity-50 transition-opacity group-hover:opacity-80`}></div>
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{title}</p>
        <p className={`text-3xl font-black mt-1 ${color}`}>
          {value}
        </p>
        {trend && (
          <p className="text-xs text-[#4CAF50] font-bold mt-2 flex items-center gap-1">
            <TrendingUp size={12} />
            {trend}
          </p>
        )}
      </div>
      <div className={`p-4 rounded-xl ${bgColor} text-white shadow-sm`}>
         <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

const QuickAction = ({
  title,
  description,
  href,
  icon: Icon,
  badge
}: {
  title: string;
  description: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  badge?: string;
}) => (
  <Link
    href={href}
    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all group flex flex-col justify-between h-full relative overflow-hidden"
  >
    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
      <Icon className="w-32 h-32" />
    </div>
    
    <div>
       <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-red-50 text-[#E30613] rounded-xl group-hover:bg-[#E30613] group-hover:text-white transition-colors">
            <Icon className="h-5 w-5" />
          </div>
          {badge && (
             <span className="bg-yellow-100 text-yellow-800 text-[10px] uppercase font-black px-2 py-1 rounded-md">{badge}</span>
          )}
       </div>
       <h3 className="font-bold text-slate-800 text-lg group-hover:text-[#E30613] transition-colors leading-tight">
         {title}
       </h3>
       <p className="text-sm text-gray-500 mt-2 line-clamp-2">{description}</p>
    </div>
  </Link>
);

// Derived metrics from mock data
const pendingOrders = initialOrders.filter(o => o.status === 'Pendiente').length;
const totalRevenue = initialOrders.reduce((sum, o) => sum + o.totalAmount, 0);
const formattedRevenue = `$${(totalRevenue / 1_000_000).toFixed(1)}M`;
const activeSuppliers = mockSuppliers.filter(s => s.status === 'Activo').length;

// Get recent orders for dashboard table (latest 5)
const recentB2BOrders = initialOrders
  .filter(o => o.customerTier !== 'Personas Naturales')
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 5);

// Low stock items (deterministic)
const lowStockItems = [
  { name: 'Tomate Chonto', stock: 5, unit: 'kg', severity: 'critical' },
  { name: 'Cebolla Cabezona', stock: 12, unit: 'kg', severity: 'warning' },
  { name: 'Ajo Blanco', stock: 8, unit: 'kg', severity: 'critical' },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4CAF50]"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'text-orange-600';
      case 'En Preparación': return 'text-blue-600';
      case 'En Ruta': return 'text-yellow-600';
      case 'Entregado': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'Micromercados') return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-[10px] font-bold uppercase">Micromercado</span>;
    return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-[10px] font-bold uppercase">Restaurante</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-1 font-serif">
            Módulo General La Gaviota
          </h1>
          <p className="text-gray-500 font-medium">
            Resumen operativo — {products.length} productos · {initialOrders.length} pedidos · {mockSuppliers.length} proveedores
          </p>
        </div>

        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-green-50 border-green-200 text-green-700 w-fit">
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-bold">
            Sistemas Sincronizados
          </span>
          <span className="relative flex h-3 w-3 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4CAF50] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4CAF50]"></span>
          </span>
        </div>
      </div>

      {/* Stats Grid — derived from actual data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Totales"
          value={formattedRevenue}
          icon={TrendingUp}
          color="text-[#4CAF50]"
          bgColor="bg-[#4CAF50]"
          trend="+12% frente a ayer"
        />
        <StatCard
          title="Pedidos Pendientes"
          value={pendingOrders}
          icon={ShoppingBag}
          color="text-[#E30613]"
          bgColor="bg-[#E30613]"
        />
        <StatCard
          title="Proveedores Activos"
          value={`${activeSuppliers}/${mockSuppliers.length}`}
          icon={Users}
          color="text-[#1C2059]"
          bgColor="bg-[#1C2059]"
          trend={`${activeSuppliers} verificados`}
        />
        <StatCard
          title="Alertas Inventario"
          value={`${lowStockItems.length} items`}
          icon={AlertTriangle}
          color="text-[#FFCC00]"
          bgColor="bg-[#FFCC00]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Live Operations Panel */}
         <div className="lg:col-span-2 space-y-6">
            <div>
               <h2 className="text-xl font-black text-slate-800 mb-4 font-serif">
                 Accesos Directos Operativos
               </h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <QuickAction
                   title="Gestión de Precios"
                   description="Ajuste masivo o individual de multiplicadores por Tier (Naturales, Micro, Restaurantes)."
                   href="/admin/pricing"
                   icon={Database}
                   badge="Uso Diario"
                 />
                 <QuickAction
                   title="Kits Chéveres"
                   description="Configurar el Kit promocional de la semana rotativo."
                   href="/admin/catalog/kits"
                   icon={PackageSearch}
                 />
                 <QuickAction
                   title="Rutas de Entrega"
                   description="Monitoreo logístico de pedidos hacia Restaurantes y Micromercados."
                   href="/admin/orders"
                   icon={ShoppingCart}
                 />
                 <QuickAction
                   title="Catálogo Base"
                   description="Crear nuevos productos, asignar imágenes y categorías."
                   href="/admin/catalog/inventory"
                   icon={Globe}
                 />
               </div>
            </div>
            
            {/* Recent B2B Orders Overview — from real mock data */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-800">Últimos Pedidos B2B (Wholesale)</h3>
                  <Link href="/admin/orders" className="text-sm font-bold text-red-600 hover:text-red-700">Ver todos</Link>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-black">
                        <tr>
                           <th className="px-4 py-3">ID</th>
                           <th className="px-4 py-3">Cliente</th>
                           <th className="px-4 py-3">Tier</th>
                           <th className="px-4 py-3">Monto</th>
                           <th className="px-4 py-3">Estado</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {recentB2BOrders.map(order => (
                           <tr key={order.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-mono text-xs text-gray-400">{order.id}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{order.customerName}</td>
                              <td className="px-4 py-3">{getTierBadge(order.customerTier)}</td>
                              <td className="px-4 py-3 font-medium">${order.totalAmount.toLocaleString()}</td>
                              <td className={`px-4 py-3 font-bold ${getStatusColor(order.status)}`}>{order.status}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Right Sidebar Status */}
         <div className="space-y-6">
            <div className="bg-[#4CAF50] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
               <div className="absolute -right-4 -bottom-4 opacity-20">
                  <PackageSearch size={120} />
               </div>
               <h3 className="font-black text-xl mb-1 relative z-10 font-serif">Kit Chévere Activo</h3>
               <p className="text-green-100 font-medium text-sm mb-4 relative z-10">Kit de Mercado Familiar (15 items)</p>
               
               <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm relative z-10">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs uppercase font-bold text-green-100">Ventas del Kit (Semana)</span>
                     <span className="font-black text-xl">142</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-1.5 mt-2">
                     <div className="bg-white h-1.5 rounded-full w-[70%]"></div>
                  </div>
                  <p className="text-[10px] text-green-100 mt-2">70% de la meta semanal</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
               <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-yellow-500 w-5 h-5" />
                  Alertas de Stock
               </h3>
               
               <div className="space-y-3">
                  {lowStockItems.map(item => (
                    <div key={item.name} className={`flex justify-between items-center p-3 rounded-xl ${item.severity === 'critical' ? 'bg-red-50 border border-red-100' : 'bg-yellow-50 border border-yellow-100'}`}>
                       <div>
                          <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                          <p className={`text-[10px] font-bold uppercase ${item.severity === 'critical' ? 'text-red-600' : 'text-yellow-700'}`}>Quedan {item.stock} {item.unit}</p>
                       </div>
                       <button className={`text-white text-[10px] px-2 py-1.5 rounded-lg font-bold ${item.severity === 'critical' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
                         {item.severity === 'critical' ? 'Reabastecer' : 'Aviso Prov.'}
                       </button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
