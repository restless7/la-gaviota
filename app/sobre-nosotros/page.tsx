import React from 'react';
import Image from 'next/image';

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-white animate-fade-in relative overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] min-h-[500px]">
        <Image 
           src="/IMAGES/about-granja-mesa3.jpeg"
           alt="La Gaviota Granja"
           fill
           priority
           className="object-cover object-center brightness-75"
           sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
           <h1 className="text-5xl md:text-7xl font-black text-white font-serif drop-shadow-xl tracking-tight mb-4 max-w-4xl">
             Nuestra Historia
           </h1>
           <p className="text-lg md:text-xl text-slate-200 font-medium max-w-2xl text-shadow-sm">
             Cultivando la tierra con pasión para llevar la frescura del campo directamente a tu hogar y negocio.
           </p>
        </div>
        
        {/* Wavy Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-[calc(100%+1.3px)] h-[80px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,114.32,189.92,97.2,234.33,84.34,278.43,73.45,321.39,56.44Z" className="fill-white"></path>
          </svg>
        </div>
      </section>

      {/* Origin Core Value */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2 order-2 lg:order-1 relative">
                <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
                   <Image 
                     src="/IMAGES/slide-santander-pride.jpeg"
                     alt="Orgullo Santandereano"
                     fill
                     className="object-cover transition-transform duration-1000 group-hover:scale-105"
                     sizes="(max-width: 1024px) 100vw, 50vw"
                   />
                </div>
                {/* Decoration */}
                <div className="absolute -bottom-8 -right-8 bg-[#4CAF50] text-white p-8 rounded-[2rem] shadow-xl max-w-[200px] z-10 hidden sm:block">
                   <p className="font-serif font-black text-4xl leading-none mb-2">100%</p>
                   <p className="text-sm font-bold opacity-90 leading-tight">Orgullo Local y Agricultura Responsable</p>
                </div>
            </div>
            
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
               <h3 className="text-[#E30613] font-bold tracking-widest uppercase text-sm mb-3">De la Granja a tu Mesa</h3>
               <h2 className="text-4xl md:text-5xl font-black text-slate-800 font-serif mb-6 leading-tight">Cosechados Hoy, en tu Cocina Mañana.</h2>
               <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  En Surtifruver La Gaviota nos enorgullece trabajar de la mano con los mejores productores y fincas locales. Nuestra dedicación nos permite eliminar intermediarios innecesarios.
               </p>
               <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Promovemos el mercado justo, la frescura garantizada y un trato humano excepcional. Sabemos que los mejores momentos y las grandes recetas nacen de los ingredientes más frescos.
               </p>

               <ul className="space-y-4">
                  <li className="flex items-center gap-4">
                     <span className="w-12 h-12 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] flex items-center justify-center font-bold text-xl drop-shadow-sm">🌱</span>
                     <span className="text-slate-700 font-bold text-lg">Agricultura Sostenible</span>
                  </li>
                  <li className="flex items-center gap-4">
                     <span className="w-12 h-12 rounded-full bg-[#E30613]/10 text-[#E30613] flex items-center justify-center font-bold text-xl drop-shadow-sm">🤝</span>
                     <span className="text-slate-700 font-bold text-lg">Comercio Justo (Fair Trade)</span>
                  </li>
                  <li className="flex items-center gap-4">
                     <span className="w-12 h-12 rounded-full bg-[#FFCC00]/20 text-[#ca8a04] flex items-center justify-center font-bold text-xl drop-shadow-sm">⭐</span>
                     <span className="text-slate-700 font-bold text-lg">Calidad Premium Seleccionada</span>
                  </li>
               </ul>
            </div>
        </div>
      </section>

      {/* Freshness Banner */}
      <section className="relative w-full h-[500px]">
        <Image 
           src="/IMAGES/slide-freshness-24h1.jpeg"
           alt="Frescura 24h"
           fill
           className="object-cover object-bottom"
           sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#E30613]/80 mix-blend-multiply"></div>
        <div className="absolute inset-0 flex flex-col justify-center text-center px-4">
           <h2 className="text-4xl md:text-6xl font-black text-white font-serif drop-shadow-lg tracking-tight mb-6">
             Nuestra Promesa de Frescura
           </h2>
           <p className="text-xl text-white/90 font-medium max-w-3xl mx-auto mb-10 leading-relaxed text-shadow-sm">
             Garantizamos que la mayoría de nuestros productos viajan del cultivo a nuestras instalaciones en menos de 24 horas, asegurando nutrientes, sabor y duración para tu familia o negocio.
           </p>
        </div>
      </section>
      
    </div>
  );
}
