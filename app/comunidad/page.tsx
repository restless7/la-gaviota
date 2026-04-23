import React from 'react';
import Image from 'next/image';
import { Users, Heart, Star, ShoppingBag } from 'lucide-react';

export default function ComunidadPage() {
  return (
    <div className="min-h-screen bg-white animate-fade-in pb-24">
      
      {/* Dynamic Seagull Hero */}
      <section className="relative w-full h-[50vh] min-h-[400px]">
        <Image 
           src="/IMAGES/Seagull_holding_basket_202604221736.jpeg"
           alt="La Gaviota Mascota"
           fill
           priority
           className="object-cover object-top brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>
        <div className="absolute bottom-16 left-0 w-full text-center px-4">
           <h1 className="text-5xl md:text-7xl font-black text-slate-800 font-serif drop-shadow-xl tracking-tight mb-4">
             Familia Gaviota
           </h1>
           <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto">
             Donde los agricultores, las familias y los chefs se unen por el amor a los buenos ingredientes.
           </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
           <div className="bg-slate-50 rounded-3xl p-8 text-center border border-gray-100 hover:border-[#E30613] hover:shadow-lg transition-all group">
              <Users className="w-10 h-10 text-[#E30613] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-2xl text-slate-800 mb-2">+10k</h3>
              <p className="text-sm text-gray-500 font-medium">Familias Alimentadas</p>
           </div>
           <div className="bg-slate-50 rounded-3xl p-8 text-center border border-gray-100 hover:border-[#4CAF50] hover:shadow-lg transition-all group">
              <ShoppingBag className="w-10 h-10 text-[#4CAF50] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-2xl text-slate-800 mb-2">500+</h3>
              <p className="text-sm text-gray-500 font-medium">Restaurantes Aliados</p>
           </div>
           <div className="bg-slate-50 rounded-3xl p-8 text-center border border-gray-100 hover:border-[#FFCC00] hover:shadow-lg transition-all group">
              <Star className="w-10 h-10 text-[#ca8a04] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-2xl text-slate-800 mb-2">4.9/5</h3>
              <p className="text-sm text-gray-500 font-medium">Calificación Promedio</p>
           </div>
           <div className="bg-slate-50 rounded-3xl p-8 text-center border border-gray-100 hover:border-[#E30613] hover:shadow-lg transition-all group">
              <Heart className="w-10 h-10 text-[#E30613] mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-2xl text-slate-800 mb-2">100%</h3>
              <p className="text-sm text-gray-500 font-medium">Compromiso Local</p>
           </div>
        </div>

        <div className="bg-[#4CAF50] rounded-3xl overflow-hidden shadow-2xl relative">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
           <div className="relative z-10 px-8 py-16 md:p-20 text-center">
              <span className="text-white/80 font-bold tracking-widest uppercase text-sm mb-3 block">Programa de Beneficios</span>
              <h2 className="text-3xl md:text-5xl font-black text-white font-serif mb-6 leading-tight">Club del Buen Sabor</h2>
              <p className="text-green-50 text-lg md:text-xl max-w-3xl mx-auto mb-10 opacity-90">
                 Acumula gaviotas (puntos) con cada compra de vegetales frescos y canjéalos por Kits Chéveres, domicilios gratis, o dona tus gaviotas a bancos de alimentos locales.
              </p>
              <button className="bg-white text-[#4CAF50] font-black px-10 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg tracking-wide">
                 Únete Completamente Gratis
              </button>
           </div>
        </div>
      </section>

    </div>
  );
}
