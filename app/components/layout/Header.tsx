'use client';

import React from 'react';
import Link from 'next/link';
import { useUserRole, UserRole } from '@/app/context/UserContext';

export default function Header() {
  const { role, setRole } = useUserRole();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as UserRole);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100 pb-2">
      <div className="bg-gaviota-red text-white py-1 px-4 text-xs font-semibold text-center hidden sm:block">
        ¡Domicilios gratis en pedidos superiores a $50.000! 🚚
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gaviota-red rounded-full flex items-center justify-center text-white font-bold text-xl">
            SG
          </div>
          <span className="font-serif text-2xl font-bold text-gaviota-green hidden sm:inline-block">
            La Gaviota
          </span>
        </Link>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-xl px-4 hidden md:block">
          <div className="relative">
            <input 
              type="text" 
              placeholder="¿Qué estás buscando hoy?" 
              className="w-full bg-slate-100 rounded-full py-2.5 px-6 outline-none focus:ring-2 focus:ring-gaviota-red/50 transition-all text-sm"
            />
            <button className="absolute right-2 top-1.5 p-1.5 bg-gaviota-red text-white rounded-full hover:bg-red-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-4">
          {/* Role Selector (For Prototype purposes) */}
          <div className="flex flex-col items-end hidden lg:flex">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Perfil de Compra</span>
            <select 
              value={role} 
              onChange={handleRoleChange}
              className="text-sm font-semibold bg-green-50 text-gaviota-green border-none rounded-lg p-1.5 outline-none cursor-pointer hover:bg-green-100 transition-colors"
            >
              <option value="Personas Naturales">Retail / Natural</option>
              <option value="Micromercados">Micromercados</option>
              <option value="Restaurantes">Restaurantes (Mayorista)</option>
            </select>
          </div>
          
          {/* Cart */}
          <button className="relative p-2 text-gray-700 hover:text-gaviota-red transition-colors flex items-center gap-1 bg-slate-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-gaviota-yellow text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </button>
        </div>
      </div>
      
      {/* Mobile Search */}
      <div className="px-4 py-2 md:hidden">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar frutas, verduras..." 
            className="w-full bg-slate-100 rounded-full py-2 px-4 outline-none text-sm"
          />
        </div>
      </div>
    </header>
  );
}
