import React from 'react';
import { Shield } from 'lucide-react';
import { fetchAuditLogs } from '@/src/actions/audit';
import { AuditLogsClient } from './AuditLogsClient';

export default async function AuditLogsPage() {
  const logs = await fetchAuditLogs();

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
      </div>

      <AuditLogsClient initialLogs={logs} />
    </div>
  );
}
