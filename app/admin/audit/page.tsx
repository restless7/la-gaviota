'use client';

import React, { useState } from 'react';
import { Shield, Filter, Search, User, DollarSign, Truck, Settings, Package, ChevronDown } from 'lucide-react';

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  category: 'pricing' | 'order' | 'supplier' | 'system' | 'inventory';
  details: string;
}

const MOCK_EVENTS: AuditEvent[] = [
  { id: 'AE-001', timestamp: '2026-05-12T17:05:00Z', actor: 'Sebastian Garcia', action: 'Aplicó multiplicadores masivos', target: 'Gestión de Precios', category: 'pricing', details: 'Detal +25%, Micro +15%, Rest. +5% — 210 productos actualizados.' },
  { id: 'AE-002', timestamp: '2026-05-12T16:42:00Z', actor: 'Sebastian Garcia', action: 'Cambió estado de pedido', target: 'ORD-1004', category: 'order', details: 'Parrilla Santandereana: "Pendiente" → "En Ruta"' },
  { id: 'AE-003', timestamp: '2026-05-12T15:30:00Z', actor: 'Sistema', action: 'Alerta de stock bajo', target: 'Tomate Chonto', category: 'inventory', details: 'Stock cayó a 5 Kg — umbral mínimo alcanzado.' },
  { id: 'AE-004', timestamp: '2026-05-12T14:20:00Z', actor: 'Sebastian Garcia', action: 'Registró nueva granja', target: 'Huerta Orgánica La Cumbre', category: 'supplier', details: 'Zapatoca, Santander — Productos: Aguacate Criollo, Uchuva, Feijoa. Estado: Auditando.' },
  { id: 'AE-005', timestamp: '2026-05-12T12:00:00Z', actor: 'Sistema', action: 'Inicio de sesión', target: 'Admin Panel', category: 'system', details: 'Sebastian Garcia inició sesión desde IP 181.49.xx.xx (Bucaramanga).' },
  { id: 'AE-006', timestamp: '2026-05-12T10:15:00Z', actor: 'Sebastian Garcia', action: 'Actualizó costo base', target: 'Aguacate Hass', category: 'pricing', details: 'Costo de compra: $1,200 → $1,350 COP/kg' },
  { id: 'AE-007', timestamp: '2026-05-11T18:00:00Z', actor: 'Sistema', action: 'Pedido entregado', target: 'ORD-1006', category: 'order', details: 'Carolina Mejia — $67,000 COP — Piedecuesta, verificado por conductor.' },
  { id: 'AE-008', timestamp: '2026-05-11T16:45:00Z', actor: 'Sebastian Garcia', action: 'Cambió estado de pedido', target: 'ORD-1009', category: 'order', details: 'Julián Rodríguez: "En Ruta" → "Entregado"' },
  { id: 'AE-009', timestamp: '2026-05-11T14:30:00Z', actor: 'Sistema', action: 'Backup automático completado', target: 'Base de Datos', category: 'system', details: 'Snapshot diario creado — 210 productos, 15 pedidos, 10 proveedores.' },
  { id: 'AE-010', timestamp: '2026-05-11T09:00:00Z', actor: 'Sebastian Garcia', action: 'Modificó Kit Chévere', target: 'Kit Familiar Semanal', category: 'inventory', details: 'Agregó Piña Perolera (2Kg), removió Ahuyama. Precio fijo: $45,000.' },
  { id: 'AE-011', timestamp: '2026-05-10T17:30:00Z', actor: 'Sistema', action: 'Proveedor desactivado automáticamente', target: 'Finca Los Naranjos', category: 'supplier', details: 'Sin entregas por más de 60 días — Barichara, Santander.' },
  { id: 'AE-012', timestamp: '2026-05-10T11:00:00Z', actor: 'Sebastian Garcia', action: 'Configuración actualizada', target: 'Zonas de Entrega', category: 'system', details: 'Habilitada zona: San Gil. Pedido mínimo: $80,000 COP.' },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  pricing: <DollarSign className="w-4 h-4" />,
  order: <Truck className="w-4 h-4" />,
  supplier: <Package className="w-4 h-4" />,
  system: <Settings className="w-4 h-4" />,
  inventory: <Package className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  pricing: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  order: 'bg-blue-50 text-blue-700 border-blue-200',
  supplier: 'bg-green-50 text-green-700 border-green-200',
  system: 'bg-slate-50 text-slate-600 border-slate-200',
  inventory: 'bg-red-50 text-red-600 border-red-200',
};

const CATEGORY_DOT: Record<string, string> = {
  pricing: 'bg-yellow-500',
  order: 'bg-blue-500',
  supplier: 'bg-green-500',
  system: 'bg-slate-400',
  inventory: 'bg-red-500',
};

export default function AuditLogsPage() {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_EVENTS.filter(ev => {
    const matchesCategory = filterCategory ? ev.category === filterCategory : true;
    const matchesSearch = searchTerm
      ? ev.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.details.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 p-3 rounded-xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">Logs de Auditoría</h1>
            <p className="text-gray-500 mt-1">Historial completo de acciones y eventos del sistema.</p>
          </div>
        </div>
        <span className="text-sm font-bold text-gray-400">{filtered.length} eventos</span>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
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
            <option value="pricing">💰 Precios</option>
            <option value="order">🚚 Pedidos</option>
            <option value="supplier">🌿 Proveedores</option>
            <option value="inventory">📦 Inventario</option>
            <option value="system">⚙️ Sistema</option>
          </select>
          <ChevronDown className="h-4 w-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {filtered.map((event, index) => (
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
                    <span className="text-xs text-gray-400 font-medium">{formatTimestamp(event.timestamp)}</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{event.action}</p>
                  <p className="text-gray-500 text-xs mt-1">{event.details}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <User className="w-3 h-3" />
                    {event.actor}
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1 font-mono">
                    {new Date(event.timestamp).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
