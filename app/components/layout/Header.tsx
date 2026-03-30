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
    <header className="sticky top-0 z-50 w-full bg-white transition-all shadow-sm">
      <div className="bg-gaviota-red text-white py-1 px-4 text-xs font-semibold text-center hidden sm:block">
        ¡Ventas mayoristas para restaurantes! 🚜 Contacta al equipo comercial
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Exact Logo implementation from reference */}
        <Link href="/" className="flex items-center gap-2">
          {/* Mockup for La Gaviota script logo with leaf */}
          <div className="flex flex-col relative">
             <div className="text-3xl font-serif text-gaviota-red font-black leading-none drop-shadow-sm tracking-tighter">
                <span className="italic">La</span><br/>
                <span className="text-4xl italic">Gaviota</span>
             </div>
             <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-1">
                 <svg className="w-8 h-8 text-gaviota-green fill-current" viewBox="0 0 24 24"><path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22l1-2.3A13.89,13.89,0,0,0,20.53,12C20.53,12,17,8,17,8Z"/></svg>
             </div>
             <span className="text-[9px] bg-gaviota-red text-white font-bold px-1.5 py-0.5 rounded-full mt-1 w-max">
                La forma chévere de mercar
             </span>
          </div>
        </Link>
        
        {/* Navigation Matching the Reference (Inicio, Sobre Nosotros, Noticias, Comunidad, Contacto) */}
        <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium text-gray-600">
           <Link href="/" className="text-gaviota-red border-b-2 border-gaviota-red pb-1 font-semibold">Inicio</Link>
           <Link href="/sobre-nosotros" className="hover:text-gaviota-red transition-colors pb-1">Sobre Nosotros</Link>
           <Link href="/noticias" className="hover:text-gaviota-red transition-colors pb-1">Noticias</Link>
           <Link href="/comunidad" className="hover:text-gaviota-red transition-colors pb-1">Comunidad</Link>
           <Link href="/contacto" className="hover:text-gaviota-red transition-colors pb-1">Contacto</Link>
        </nav>

        {/* Actions Menu */}
        <div className="flex items-center gap-5">
          {/* User Role Testing Box */}
          <div className="flex flex-col items-end hidden lg:flex">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Rol de Compra</span>
            <select 
              value={role} 
              onChange={handleRoleChange}
              className="text-xs font-bold bg-slate-50 text-slate-800 border border-slate-200 rounded-md p-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="Personas Naturales">Natural</option>
              <option value="Micromercados">Micromercados</option>
              <option value="Restaurantes">Restaurantes</option>
            </select>
          </div>
          
          <button className="text-gray-700 p-1 hover:text-gaviota-red transition-colors md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
