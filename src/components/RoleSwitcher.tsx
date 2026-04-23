'use client';

import React from 'react';
import { useUserRole, UserRole } from '../contexts/UserRoleContext';

export function RoleSwitcher() {
  const { role, setRole, isLoading } = useUserRole();

  if (isLoading) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white p-4 rounded-xl shadow-2xl border-2 border-[#E30613]">
      <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider text-center">
        Demo: Seleccionar Perfil
      </p>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-pointer text-sm">
          <input
            type="radio"
            name="role"
            checked={role === 'Personas Naturales'}
            onChange={() => setRole('Personas Naturales')}
            className="w-4 h-4 accent-[#E30613] text-[#E30613] focus:ring-[#E30613]"
          />
          <span className={role === 'Personas Naturales' ? 'font-bold text-[#E30613]' : 'text-gray-700'}>
            Personas Naturales
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer text-sm">
          <input
            type="radio"
            name="role"
            checked={role === 'Micromercados'}
            onChange={() => setRole('Micromercados')}
            className="w-4 h-4 accent-[#E30613] text-[#E30613] focus:ring-[#E30613]"
          />
          <span className={role === 'Micromercados' ? 'font-bold text-[#E30613]' : 'text-gray-700'}>
            Micromercados
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer text-sm">
          <input
            type="radio"
            name="role"
            checked={role === 'Restaurantes'}
            onChange={() => setRole('Restaurantes')}
            className="w-4 h-4 accent-[#E30613] text-[#E30613] focus:ring-[#E30613]"
          />
          <span className={role === 'Restaurantes' ? 'font-bold text-[#E30613]' : 'text-gray-700'}>
            Restaurantes
          </span>
        </label>
      </div>
    </div>
  );
}
