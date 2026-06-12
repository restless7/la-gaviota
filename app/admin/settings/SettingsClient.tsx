'use client';

import React, { useState, useTransition } from 'react';
import { Settings as SettingsIcon, Building2, MapPin, Bell, Percent, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { SystemSettings, updateSystemSettings } from '@/src/actions/systemSettings';

export default function SettingsClient({ initialSettings }: { initialSettings: SystemSettings }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<SystemSettings>(initialSettings);

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateSystemSettings(form);
        if (result.success) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        } else {
          alert('Error al guardar: ' + result.error);
        }
      } catch (error) {
        alert('Ocurrió un error inesperado al guardar.');
      }
    });
  };

  const updateField = (field: keyof SystemSettings, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleZone = (index: number) => {
    const newZones = [...form.delivery_zones];
    newZones[index].enabled = !newZones[index].enabled;
    updateField('delivery_zones', newZones);
  };

  const updateZoneMinOrder = (index: number, val: string) => {
    const newZones = [...form.delivery_zones];
    newZones[index].minOrder = Number(val.replace(/[^0-9]/g, '')) || 0;
    updateField('delivery_zones', newZones);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 p-3 rounded-xl">
            <SettingsIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">Configuraciones Globales</h1>
            <p className="text-gray-500 mt-1">Parámetros generales del ecosistema La Gaviota OS.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className={`px-6 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 ${saved ? 'bg-[#4CAF50] text-white' : 'bg-[#E30613] hover:bg-red-700 text-white disabled:opacity-50'}`}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />} 
          {saved ? 'Guardado' : 'Guardar Cambios'}
        </button>
      </div>

      <div className={`space-y-8 transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Section 1: Datos del Negocio */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-50 p-2 rounded-lg text-[#E30613]">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Datos del Negocio</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre Comercial</label>
              <input type="text" value={form.business_name} onChange={e => updateField('business_name', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">NIT</label>
              <input type="text" value={form.nit} onChange={e => updateField('nit', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dirección Principal</label>
              <input type="text" value={form.address} onChange={e => updateField('address', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Teléfono Comercial</label>
              <input type="text" value={form.phone} onChange={e => updateField('phone', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Horario de Operación</label>
              <input type="text" value={form.hours} onChange={e => updateField('hours', e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium" />
            </div>
          </div>
        </div>

        {/* Section 2: Zonas de Entrega */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-50 p-2 rounded-lg text-[#4CAF50]">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Zonas de Entrega & Enrutamiento</h2>
          </div>
          <div className="space-y-3">
            {form.delivery_zones?.map((zone, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${zone.enabled ? 'border-green-200 bg-green-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={zone.enabled} onChange={() => toggleZone(i)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
                  </label>
                  <span className={`font-bold ${zone.enabled ? 'text-slate-800' : 'text-gray-400'}`}>{zone.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Pedido mínimo:</span>
                  <input
                    type="text"
                    value={`$${zone.minOrder.toLocaleString('es-CO')}`}
                    onChange={(e) => updateZoneMinOrder(i, e.target.value)}
                    className="w-28 text-right border border-gray-200 rounded px-2 py-1 text-sm font-bold outline-none focus:border-[#4CAF50]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Notificaciones */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-yellow-50 p-2 rounded-lg text-[#ca8a04]">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Alertas y Comunicaciones</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'emailNewOrder', label: 'Email — Nuevo pedido recibido', icon: '📧' },
              { key: 'emailLowStock', label: 'Email — Alerta de stock bajo', icon: '📧' },
              { key: 'whatsappNewOrder', label: 'WhatsApp — Nuevo pedido B2B', icon: '💬' },
              { key: 'whatsappDelivery', label: 'WhatsApp — Confirmación de entrega', icon: '💬' },
              { key: 'dailyReport', label: 'Reporte diario de ventas (6:00 PM)', icon: '📊' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-slate-700">{item.label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={(form.notifications as any)[item.key]}
                    onChange={() => updateField('notifications', { ...form.notifications, [item.key]: !(form.notifications as any)[item.key] })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Márgenes Default por Tier */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <Percent className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Márgenes Base del Ecosistema</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border-2 border-[#E30613]/20 bg-red-50/20">
              <label className="block text-xs font-bold text-[#E30613] uppercase mb-3">Retail (Personas Naturales)</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">Costo +</span>
                <input type="number" value={form.retail_margin} onChange={e => updateField('retail_margin', Number(e.target.value))} className="w-20 border border-red-200 rounded-lg px-3 py-2 text-center font-black text-[#E30613] text-xl outline-none focus:border-[#E30613] bg-white" />
                <span className="text-gray-500 text-sm font-bold">%</span>
              </div>
            </div>
            <div className="p-6 rounded-xl border-2 border-[#4CAF50]/20 bg-green-50/20">
              <label className="block text-xs font-bold text-[#4CAF50] uppercase mb-3">Distribuidores (Micromercados)</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">Costo +</span>
                <input type="number" value={form.micro_margin} onChange={e => updateField('micro_margin', Number(e.target.value))} className="w-20 border border-green-200 rounded-lg px-3 py-2 text-center font-black text-[#4CAF50] text-xl outline-none focus:border-[#4CAF50] bg-white" />
                <span className="text-gray-500 text-sm font-bold">%</span>
              </div>
            </div>
            <div className="p-6 rounded-xl border-2 border-[#FFCC00]/40 bg-yellow-50/20">
              <label className="block text-xs font-bold text-[#ca8a04] uppercase mb-3">Mayoristas (Restaurantes)</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">Costo +</span>
                <input type="number" value={form.wholesale_margin} onChange={e => updateField('wholesale_margin', Number(e.target.value))} className="w-20 border border-yellow-200 rounded-lg px-3 py-2 text-center font-black text-[#ca8a04] text-xl outline-none focus:border-[#FFCC00] bg-white" />
                <span className="text-gray-500 text-sm font-bold">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
