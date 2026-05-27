'use client';

import React, { useState } from 'react';
import { Filter, Search, User, DollarSign, Truck, Settings, Package, ChevronDown, Layers } from 'lucide-react';
import { AuditLog } from '@/src/actions/audit';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  PRICING: <DollarSign className="w-4 h-4" />,
  KITS: <Layers className="w-4 h-4" />,
  SUPPLIER: <Package className="w-4 h-4" />,
  SYSTEM: <Settings className="w-4 h-4" />,
  ORDERS: <Truck className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  PRICING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  KITS: 'bg-purple-50 text-purple-700 border-purple-200',
  SUPPLIER: 'bg-green-50 text-green-700 border-green-200',
  SYSTEM: 'bg-slate-50 text-slate-600 border-slate-200',
  ORDERS: 'bg-blue-50 text-blue-600 border-blue-200',
};

const CATEGORY_DOT: Record<string, string> = {
  PRICING: 'bg-yellow-500',
  KITS: 'bg-purple-500',
  SUPPLIER: 'bg-green-500',
  SYSTEM: 'bg-slate-400',
  ORDERS: 'bg-blue-500',
};

export function AuditLogsClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = initialLogs.filter(ev => {
    const matchesCategory = filterCategory ? ev.category === filterCategory : true;
    const matchesSearch = searchTerm
      ? ev.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ev.reference_id && ev.reference_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ev.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Hace minutos';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-400">{filtered.length} eventos registrados</span>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-slate-800 bg-slate-50"
          />
        </div>
        <div className="relative">
          <select
            value={filterCategory || ''}
            onChange={(e) => setFilterCategory(e.target.value || null)}
            className="appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2 font-medium text-slate-700 outline-none focus:border-slate-800 cursor-pointer"
          >
            <option value="">Todas las categorías</option>
            <option value="PRICING">💰 Precios</option>
            <option value="KITS">📦 Kits/Combos</option>
            <option value="ORDERS">🚚 Pedidos</option>
            <option value="SUPPLIER">🌿 Proveedores</option>
            <option value="SYSTEM">⚙️ Sistema</option>
          </select>
          <ChevronDown className="h-4 w-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
             <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Settings className="w-8 h-8" />
             </div>
             <p className="text-gray-400 font-medium italic">No se han registrado eventos aún.</p>
          </div>
        ) : (
          filtered.map((event, index) => (
            <div key={event.id} className="flex gap-4 relative">
              {/* Timeline Line */}
              <div className="flex flex-col items-center w-8 flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${CATEGORY_DOT[event.category]} mt-5 z-10 ring-4 ring-white`}></div>
                {index < filtered.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-200"></div>
                )}
              </div>

              {/* Event Card */}
              <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${CATEGORY_COLORS[event.category]}`}>
                        {CATEGORY_ICONS[event.category]}
                        {event.category}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{formatTimestamp(event.created_at)}</span>
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{event.action_type}</p>
                    <p className="text-gray-500 text-xs mt-1">{event.description} — <span className="text-slate-400 italic">{event.reference_id || 'Global'}</span></p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 justify-end">
                      <User className="w-3 h-3" />
                      {event.actor_name}
                    </div>
                    <p className="text-[10px] text-gray-300 mt-1 font-mono">
                      {new Date(event.created_at).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
