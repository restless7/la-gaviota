'use client';

import React from 'react';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import Image from 'next/image';
import { ProductCard } from '@/src/components/store/ProductCard';
import { products } from '@/src/data/products';

export default function RestauranteDashboard() {
  const { role } = useUserRole();

  // Restaurante focus: All products basically, maybe prioritize Kits and veggies
  const wholesalePicks = products.slice(0, 4);

  return (
    <div className="animate-fade-in">
      {/* Welcome & Restaurantes Banner */}
      <div className="flex flex-col md:flex-row items-center bg-slate-900 rounded-3xl p-8 lg:p-12 shadow-xl mb-10 overflow-hidden relative border border-slate-800">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/IMAGES/carnes-banner.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent"></div>
        
        <div className="flex-1 z-10 text-center md:text-left relative">
           <span className="text-[#83b745] font-black tracking-widest uppercase text-xs sm:text-sm mb-3 block border border-[#83b745] inline-block px-3 py-1 rounded-sm">
              Dashboard Mayorista B2B
           </span>
           <h1 className="text-3xl lg:text-5xl font-black text-white font-serif mb-4 leading-tight">
             Portal <span className="text-blue-400">Restaurantes</span>
           </h1>
           <p className="text-gray-300 font-medium max-w-2xl mx-auto md:mx-0">
             Gestione sus insumos diarios con la máxima eficiencia. Sus precios mayoristas ya han sido aplicados automáticamente a todo el catálogo.
           </p>
        </div>
      </div>

      {/* Professional Dashboard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Gasto Mes Actual</span>
            <span className="text-2xl font-black text-slate-800 mt-2">$2.450.000</span>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Días Restantes de Crédito</span>
            <span className="text-2xl font-black text-[#83b745] mt-2">14 Días</span>
         </div>
         <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Plantillas de Menú</span>
            <span className="text-2xl font-black text-slate-800 mt-2">3 Activas</span>
         </div>
         <button className="bg-[#1C2059] hover:bg-[#151842] text-white p-5 rounded-2xl shadow-sm flex items-center justify-between group transition-colors">
            <span className="font-bold text-lg">Pagar Saldo <br/>con Bold</span>
            <span className="text-3xl group-hover:translate-x-2 transition-transform">→</span>
         </button>
      </div>

      {/* Plantillas de Compra Rapid */}
      <h2 className="text-xl font-black text-slate-800 mb-6 font-serif">Mis Recetas / Plantillas de Compra</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
         <div className="border border-gray-200 rounded-xl p-5 bg-white flex justify-between items-center hover:border-blue-400 cursor-pointer transition-colors">
            <div>
               <h3 className="font-bold text-slate-800 text-lg">Insumos Sancocho Trifásico</h3>
               <p className="text-sm text-gray-500">12 items • Última compra hace 2 días</p>
            </div>
            <button className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold px-4 py-2 rounded-lg text-sm transition-colors">
               Añadir todo al carrito
            </button>
         </div>
         <div className="border border-gray-200 rounded-xl p-5 bg-white flex justify-between items-center hover:border-blue-400 cursor-pointer transition-colors">
            <div>
               <h3 className="font-bold text-slate-800 text-lg">Verduras Base Semanal</h3>
               <p className="text-sm text-gray-500">8 items • Última compra hace 5 días</p>
            </div>
            <button className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold px-4 py-2 rounded-lg text-sm transition-colors">
               Añadir todo al carrito
            </button>
         </div>
      </div>

      {/* Suggested Products */}
      <div className="mb-6 flex justify-between items-end">
         <h2 className="text-2xl font-black text-slate-800 font-serif">Catálogo Mayorista Relevante</h2>
         <a href="/shop" className="text-sm font-bold text-blue-600 hover:text-blue-800 underline">Ir a compras</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {wholesalePicks.map(p => (
            <ProductCard key={p.id} product={p} />
         ))}
      </div>
    </div>
  );
}
