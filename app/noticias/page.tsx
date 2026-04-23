import React from 'react';
import Image from 'next/image';
import { Newspaper } from 'lucide-react';

export default function NoticiasPage() {
  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in relative pb-24">
      
      {/* Header Banner */}
      <div className="relative w-full h-[350px]">
         <Image 
            src="/IMAGES/product-display.jpeg"
            alt="Noticias La Gaviota"
            fill
            className="object-cover brightness-[0.6]"
         />
         <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
            <h1 className="text-4xl md:text-6xl font-black text-white font-serif tracking-tight drop-shadow-xl mb-3">
              Noticias Surtifruver
            </h1>
            <p className="text-white/90 text-lg font-medium">Actualizaciones directamente del campo a tu buzón.</p>
         </div>
         <div className="absolute bottom-0 w-full h-8 bg-slate-50 rounded-t-[2.5rem]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
             <div className="relative w-full aspect-video overflow-hidden">
               <Image src="/IMAGES/Colombian_produce_on_202603260851.jpeg" fill className="object-cover group-hover:scale-105 transition-transform duration-700" alt="News 1" />
               <div className="absolute top-4 left-4 bg-[#E30613] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Actualidad</div>
             </div>
             <div className="p-6">
                <p className="text-xs text-gray-400 font-bold mb-2">22 ABR 2026</p>
                <h3 className="font-bold text-slate-800 text-xl mb-3 leading-tight group-hover:text-[#4CAF50] transition-colors">Nueva cosecha de verduras Santandereanas</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">Descubre cómo los agricultores de la región están implementando nuevas técnicas hidropónicas para mejorar el crujido de nuestra lechuga crespa.</p>
                <button className="text-[#E30613] font-bold text-sm tracking-wide uppercase">Leer Más →</button>
             </div>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
             <div className="relative w-full aspect-video overflow-hidden">
               <Image src="/IMAGES/Canvas_market_tote_202603260917.jpeg" fill className="object-cover group-hover:scale-105 transition-transform duration-700" alt="News 2" />
               <div className="absolute top-4 left-4 bg-[#FFCC00] text-[#ca8a04] text-xs font-bold px-3 py-1 rounded-full shadow-lg">Corporativo</div>
             </div>
             <div className="p-6">
                <p className="text-xs text-gray-400 font-bold mb-2">18 ABR 2026</p>
                <h3 className="font-bold text-slate-800 text-xl mb-3 leading-tight group-hover:text-[#4CAF50] transition-colors">Lanzamiento de Empaques Reutilizables</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">Como parte de nuestra iniciativa verde, ahora entregamos nuestros Kits Chéveres en tote bags 100% orgánicas y retornables.</p>
                <button className="text-[#E30613] font-bold text-sm tracking-wide uppercase">Leer Más →</button>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-[#4CAF50]/10 text-[#4CAF50] rounded-full flex items-center justify-center mb-6">
               <Newspaper className="w-8 h-8" />
             </div>
             <h3 className="font-bold text-slate-800 text-xl mb-3">Boletín Exclusivo</h3>
             <p className="text-gray-500 text-sm leading-relaxed mb-6">Suscríbete para recibir alertas de caída de precios de la central mayorista y nuevas llegadas de temporada.</p>
             <div className="w-full">
               <input type="email" placeholder="Tu correo electrónico..." className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#4CAF50] outline-none mb-3" />
               <button className="w-full bg-[#4CAF50] text-white font-bold py-3 rounded-xl shadow-md hover:-translate-y-0.5 transition-transform">Suscribirse</button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
