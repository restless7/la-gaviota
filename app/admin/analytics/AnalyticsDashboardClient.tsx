'use client';

import React, { useState, useTransition } from 'react';
import {
  Eye,
  Users,
  TrendingUp,
  Clock,
  Smartphone,
  RefreshCw,
  Download,
  Share2,
  Sparkles,
  Zap,
  CheckCircle2,
  MapPin,
  Flame,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  type SiteAnalyticsSummary,
  type AnalyticsPeriod,
  getSiteAnalyticsSummary
} from '@/src/actions/siteAnalytics';

interface AnalyticsDashboardClientProps {
  initialData: SiteAnalyticsSummary;
}

export default function AnalyticsDashboardClient({ initialData }: AnalyticsDashboardClientProps) {
  const [data, setData] = useState<SiteAnalyticsSummary>(initialData);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>(initialData.period);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (period: AnalyticsPeriod) => {
    setSelectedPeriod(period);
    startTransition(async () => {
      try {
        const nextData = await getSiteAnalyticsSummary(period);
        setData(nextData);
      } catch (err) {
        console.error('Error updating analytics period:', err);
      }
    });
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const nextData = await getSiteAnalyticsSummary(selectedPeriod);
        setData(nextData);
      } catch (err) {
        console.error('Error refreshing analytics:', err);
      }
    });
  };

  const handleExportCSV = () => {
    const rows = [
      ['Ruta', 'Nombre', 'Visualizaciones', 'Visitantes Unicos', 'Tiempo Promedio', 'Tasa Rebote'],
      ...data.topPages.map(p => [p.pathname, p.label, p.views, p.uniqueVisitors, p.avgTime, `${p.bounceRate}%`]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analitica_lagaviota_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 font-serif">
              Analítica Web & Tráfico
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Telemetría en Vivo
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Métricas de visualizaciones, visitantes únicos, canales de captación y conversión en Surtifruver La Gaviota.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector Tabs */}
          <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {(['today', '7d', '30d', '90d', 'year'] as AnalyticsPeriod[]).map((periodKey) => {
              const labels: Record<AnalyticsPeriod, string> = {
                today: 'Hoy',
                '7d': '7 Días',
                '30d': '30 Días',
                '90d': '3 Meses',
                year: '1 Año',
              };
              const isActive = selectedPeriod === periodKey;
              return (
                <button
                  key={periodKey}
                  type="button"
                  onClick={() => handlePeriodChange(periodKey)}
                  disabled={isPending}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[periodKey]}
                </button>
              );
            })}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
            title="Actualizar datos en vivo"
          >
            <RefreshCw size={16} className={isPending ? 'animate-spin text-emerald-600' : ''} />
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors shadow-sm"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Page Views */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Visualizaciones</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Eye size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {data.totalPageViews.toLocaleString('es-CO')}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-600">
            <TrendingUp size={12} />
            <span>+{data.comparison.pageViewsChange}% vs anterior</span>
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Visitantes Únicos</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {data.uniqueVisitors.toLocaleString('es-CO')}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-600">
            <TrendingUp size={12} />
            <span>+{data.comparison.visitorsChange}% alcance</span>
          </div>
        </div>

        {/* Active Now (Live Pulse) */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 p-5 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">En Vivo Ahora</span>
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Zap size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-black text-emerald-950">
              {data.activeVisitorsNow}
            </p>
            <span className="text-xs font-bold text-emerald-700">navegando</span>
          </div>
          <p className="text-[11px] font-medium text-emerald-700 mt-2">
            Últimos 30 minutos
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Conversión Venta</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {data.conversionRate}%
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-2">
            Visitas con compra finalizada
          </p>
        </div>

        {/* Avg Duration */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Permanencia</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {data.avgSessionDuration}
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-2">
            Tasa rebote: {data.bounceRate}%
          </p>
        </div>

        {/* Mobile Traffic Share */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Tráfico Móvil</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <Smartphone size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">
            84%
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-2">
            Experiencia móvil prioritaria
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Timeline AreaChart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-800 font-serif">
                Tendencia de Visualizaciones y Visitantes Únicos
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Evolución de tráfico y demanda a lo largo del periodo seleccionado.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                Visualizaciones
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                Visitantes Únicos
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pageViews" 
                  name="Visualizaciones"
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="visitors" 
                  name="Visitantes Únicos"
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVisitors)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Channels Donut */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-emerald-600" />
              <h2 className="text-lg font-black text-slate-800 font-serif">
                Canales de Adquisición
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              ¿Por dónde llegan los compradores a la tienda?
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.channels}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {data.channels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: unknown) => [Number(val).toLocaleString('es-CO') + ' visitas', '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(val: string) => <span className="text-[11px] font-bold text-slate-700">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#25D366]"></span>
                WhatsApp (wa.me)
              </span>
              <span className="text-slate-900 font-black">41% del tráfico</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A]"></span>
                Directo / Tienda
              </span>
              <span className="text-slate-900 font-black">29% del tráfico</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables & Rankings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Top Visited Pages & Funnels Table */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800 font-serif">
                Páginas Más Visitadas & Embudos
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Rendimiento de URLs públicas y campañas promocionales.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {data.topPages.length} rutas monitoreadas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                  <th className="pb-3">Página / Sección</th>
                  <th className="pb-3 text-right">Vistas</th>
                  <th className="pb-3 text-right">Únicos</th>
                  <th className="pb-3 text-right">Permanencia</th>
                  <th className="pb-3 text-right">Rebote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-slate-700">
                {data.topPages.map((page) => (
                  <tr key={page.pathname} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        {page.isCampaign && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 text-red-800 border border-red-200 shrink-0">
                            Campaña 🎄
                          </span>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">{page.label}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{page.pathname}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right font-black text-slate-900">
                      {page.views.toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-600">
                      {page.uniqueVisitors.toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 text-right text-slate-600 font-mono">
                      {page.avgTime}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        page.bounceRate < 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {page.bounceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Viewed Products & Geography */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Top Viewed Products Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-amber-500" />
                <h2 className="text-lg font-black text-slate-800 font-serif">
                  Productos Más Consultados
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Mayor Interés
              </span>
            </div>

            <div className="space-y-3">
              {data.topProducts.slice(0, 5).map((prod, idx) => (
                <div key={prod.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{prod.name}</p>
                      <span className="text-[10px] text-emerald-700 font-extrabold uppercase">{prod.category}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-900">{prod.views.toLocaleString('es-CO')} vistas</p>
                    <span className="text-[10px] text-slate-500 font-medium">${prod.price.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Geographic Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-red-600" />
              <h2 className="text-lg font-black text-slate-800 font-serif">
                Zonas de Origen del Tráfico
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Distribución de visitas por municipio y área de influencia.
            </p>

            <div className="space-y-3 pt-1">
              {data.cities.map((city) => (
                <div key={city.city} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{city.city}</span>
                    <span className="font-black text-slate-900">{city.percentage}% ({city.views.toLocaleString('es-CO')} vistas)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${city.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            <h2 className="text-lg font-black text-slate-800 font-serif">
              Registro de Actividad en Tiempo Real
            </h2>
          </div>
          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Actualizado en vivo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.recentActivity.map((hit) => (
            <div key={hit.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  {hit.pathname}
                </span>
                <span className="text-slate-400 font-medium">{hit.timeAgo}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-bold text-slate-800">{hit.channel}</span>
                <span className="text-slate-500">{hit.device} · {hit.city}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
