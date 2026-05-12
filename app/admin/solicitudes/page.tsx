'use client';

import React, { useState, useEffect } from 'react';
import { fetchBusinessApplications, approveApplication, rejectApplication } from '@/src/actions/businessApplications';
import { Building2, CheckCircle2, XCircle, Clock, Search, ChevronDown, Loader2, Store, ChefHat, Eye } from 'lucide-react';
import type { BusinessApplication } from '@/src/lib/supabase';

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: Clock,
  },
  approved: {
    label: 'Aprobada',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rechazada',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
  },
};

export default function SolicitudesNegocioPage() {
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    const result = await fetchBusinessApplications();
    if (result.success) {
      setApplications(result.data as BusinessApplication[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleApprove = async (app: BusinessApplication) => {
    setProcessingId(app.id);
    const result = await approveApplication(
      app.id,
      app.clerk_user_id,
      app.business_type,
      app.business_name,
      'Admin La Gaviota'
    );
    if (result.success) {
      await loadApplications();
    }
    setProcessingId(null);
  };

  const handleReject = async (app: BusinessApplication) => {
    setProcessingId(app.id);
    const result = await rejectApplication(app.id, 'Admin La Gaviota');
    if (result.success) {
      await loadApplications();
    }
    setProcessingId(null);
  };

  const filtered = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = searchTerm
      ? app.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicant_email.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesFilter && matchesSearch;
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-[#FFCC00]/20 p-3 rounded-xl border border-[#FFCC00]/40 relative">
            <Building2 className="h-8 w-8 text-[#ca8a04]" />
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#E30613] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">Solicitudes de Negocio</h1>
            <p className="text-gray-500 mt-1">
              Revise y apruebe solicitudes de Micromercados y Restaurantes.
            </p>
          </div>
        </div>
        <button
          onClick={loadApplications}
          className="text-sm font-bold text-gray-400 hover:text-gray-600 border border-gray-200 px-4 py-2 rounded-lg transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por negocio, nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#FFCC00] bg-slate-50"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-10 py-2 font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">Todas ({applications.length})</option>
            <option value="pending">⏳ Pendientes ({applications.filter(a => a.status === 'pending').length})</option>
            <option value="approved">✅ Aprobadas ({applications.filter(a => a.status === 'approved').length})</option>
            <option value="rejected">❌ Rechazadas ({applications.filter(a => a.status === 'rejected').length})</option>
          </select>
          <ChevronDown className="h-4 w-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 text-[#E30613] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-bold text-lg text-slate-700 mb-2">Sin solicitudes</p>
          <p className="text-sm">No hay solicitudes de negocio que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => {
            const status = STATUS_CONFIG[app.status];
            const StatusIcon = status.icon;
            const isExpanded = expandedId === app.id;
            const isProcessing = processingId === app.id;

            return (
              <div key={app.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Main Row */}
                <div className="p-5 flex items-center gap-5">
                  {/* Tier Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${app.business_type === 'Restaurantes' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    {app.business_type === 'Restaurantes'
                      ? <ChefHat className="w-6 h-6 text-green-700" />
                      : <Store className="w-6 h-6 text-yellow-700" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-black text-slate-800 text-lg truncate">{app.business_name}</h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-medium">{app.applicant_name}</span>
                      <span className="text-gray-300">•</span>
                      <span>{app.applicant_email}</span>
                      <span className="text-gray-300">•</span>
                      <span>{app.municipality}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReject(app)}
                          disabled={isProcessing}
                          className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleApprove(app)}
                          disabled={isProcessing}
                          className="bg-[#4CAF50] hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Aprobar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-slate-50/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Tipo</span>
                        <span className="font-bold text-slate-800 text-sm">{app.business_type}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">NIT</span>
                        <span className="font-medium text-slate-700 text-sm">{app.nit || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Teléfono</span>
                        <span className="font-medium text-slate-700 text-sm">{app.phone}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Vol. Mensual</span>
                        <span className="font-medium text-slate-700 text-sm">{app.monthly_volume || 'No indicado'}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Dirección</span>
                        <span className="font-medium text-slate-700 text-sm">{app.address}, {app.municipality}</span>
                      </div>
                      {app.notes && (
                        <div className="md:col-span-2">
                          <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Notas</span>
                          <span className="font-medium text-slate-700 text-sm">{app.notes}</span>
                        </div>
                      )}
                      {app.reviewed_by && (
                        <div className="col-span-full border-t border-gray-200 pt-3 mt-2">
                          <span className="text-xs text-gray-400">
                            Revisado por <strong>{app.reviewed_by}</strong> el {new Date(app.reviewed_at!).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
