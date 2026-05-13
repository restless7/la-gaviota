"use client";

import React, { useState, useMemo } from 'react';
import { Search, Plus, MapPin, Phone, Truck, X, Loader2 } from 'lucide-react';
import { Supplier, createSupplier } from '@/src/actions/suppliers';

export function SupplierTable({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() =>
    suppliers.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplied_categories.join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.farm_location.toLowerCase().includes(searchTerm.toLowerCase())
    ), [suppliers, searchTerm]);

  const getStatusBadge = (status: string) => {
    if (status === 'Activo') return <span className="bg-[#4CAF50]/10 text-[#4CAF50] px-2 py-1 rounded-full text-xs font-bold border border-[#4CAF50]/20">Activo</span>;
    return <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs font-bold border border-red-200">Inactivo</span>;
  };

  const handleAddSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const newSupplier = {
      name: formData.get('name') as string,
      farm_location: formData.get('location') as string,
      contact_name: formData.get('contact') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      supplied_categories: (formData.get('categories') as string).split(',').map(s => s.trim()).filter(Boolean),
      status: 'Activo' as const,
    };

    try {
      const result = await createSupplier(newSupplier);
      if (result.success && result.data) {
        setSuppliers(prev => [...prev, result.data as Supplier]);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to add supplier:', error);
      alert('Error al registrar la granja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proveedor, categoría o zona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20 outline-none transition-all"
            />
         </div>
         <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-400">{suppliers.length} proveedores</span>
            <button
              onClick={() => setShowModal(true)}
              className="w-full md:w-auto bg-[#4CAF50] hover:bg-[#3d8c40] text-white px-6 py-3 rounded-xl font-black shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Plus className="w-5 h-5" /> Registrar Granja
            </button>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-gray-500 uppercase tracking-wider text-xs border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold">Granja / Origen</th>
                <th className="px-6 py-4 font-bold">Contacto</th>
                <th className="px-6 py-4 font-bold">Categorías Suministradas</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(supplier => (
                <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                     <div className="font-bold text-slate-800">{supplier.name}</div>
                     <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                       <MapPin className="w-3 h-3" /> {supplier.farm_location}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="font-medium text-slate-700">{supplier.contact_name}</div>
                     <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                       <Phone className="w-3 h-3" /> {supplier.phone}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1">
                       {supplier.supplied_categories.map(p => (
                         <span key={p} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                           {p}
                         </span>
                       ))}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     {getStatusBadge(supplier.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="text-[#E30613] font-bold hover:underline text-xs">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800">Registrar Nueva Granja</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre de la Granja *</label>
                <input name="name" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#4CAF50]" placeholder="Finca El Ejemplo" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ubicación (Vereda, Municipio) *</label>
                <input name="location" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#4CAF50]" placeholder="Lebrija, Santander" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Persona de Contacto *</label>
                  <input name="contact" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#4CAF50]" placeholder="Don Pedro" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono *</label>
                  <input name="phone" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#4CAF50]" placeholder="315-123-4567" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (opcional)</label>
                <input name="email" type="email" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#4CAF50]" placeholder="proveedor@email.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categorías Suministradas (separadas por coma) *</label>
                <input name="categories" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:border-[#4CAF50]" placeholder="Frutas, Verduras" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg font-bold hover:bg-slate-50">
                   Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#4CAF50] hover:bg-green-700 text-white py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center gap-2">
                   {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                   {isSubmitting ? 'Registrando...' : 'Registrar Granja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
