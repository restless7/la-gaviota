'use client';

import React, { useState } from 'react';
import { SystemUser, updateUserRoleAndTier } from '@/src/actions/users';
import { Shield, Loader2, Save, Search, UserCheck } from 'lucide-react';

interface UserManagementClientProps {
  initialUsers: SystemUser[];
}

export default function UserManagementClient({ initialUsers }: UserManagementClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: '', tier: '' });
  const [isSaving, setIsSaving] = useState(false);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: SystemUser) => {
    setEditingId(user.id);
    setEditForm({ role: user.role, tier: user.tier });
  };

  const handleSave = async (userId: string) => {
    setIsSaving(true);
    try {
      const result = await updateUserRoleAndTier(userId, editForm.role, editForm.tier);
      if (result.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: editForm.role, tier: editForm.tier } : u));
        setEditingId(null);
      } else {
        alert('Error al actualizar el usuario: ' + result.error);
      }
    } catch (error) {
      alert('Error inesperado al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Usuario</th>
              <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Rol del Sistema</th>
              <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Nivel Comercial (Tier)</th>
              <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No se encontraron usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4CAF50]/10 flex items-center justify-center text-[#4CAF50] font-bold">
                        {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {editingId === user.id ? (
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#4CAF50] font-medium text-sm"
                        value={editForm.role}
                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      >
                        <option value="USER">USER (Cliente Normal)</option>
                        <option value="OPERARIO">OPERARIO (Bodega/Pedidos)</option>
                        <option value="ADMIN">ADMIN (Administración)</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN (Acceso Total)</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'SUPER_ADMIN' ? 'bg-[#E30613]/10 text-[#E30613]' : 
                        user.role === 'ADMIN' ? 'bg-orange-50 text-orange-600' :
                        user.role === 'OPERARIO' ? 'bg-blue-50 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {editingId === user.id ? (
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-[#4CAF50] font-medium text-sm"
                        value={editForm.tier}
                        onChange={e => setEditForm({ ...editForm, tier: e.target.value })}
                      >
                        <option value="Personas Naturales">Personas Naturales</option>
                        <option value="Micromercados">Micromercados</option>
                        <option value="Restaurantes">Restaurantes</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        user.tier === 'Personas Naturales' ? 'bg-blue-50 text-blue-600' :
                        user.tier === 'Micromercados' ? 'bg-green-50 text-green-600' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {user.tier}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {editingId === user.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          disabled={isSaving}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSave(user.id)}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4CAF50] hover:bg-[#3d8c40] text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Guardar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-4 py-1.5 text-sm font-bold text-[#E30613] hover:bg-[#E30613]/10 rounded-lg transition-colors"
                      >
                        Editar Accesos
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
