import React from 'react';

export default function SobreNosotrosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
      <h1 className="text-4xl font-black text-gaviota-green font-serif mb-6 drop-shadow-sm">Sobre Nosotros</h1>
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/2">
           <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center text-6xl shadow-inner text-slate-300">
             🚜
           </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center">
           <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">De la Granja a tu Mesa</h2>
           <p className="text-gray-600 leading-relaxed mb-6 font-medium text-[15px]">
             En La Gaviota nos enorgullece trabajar de la mano con los mejores productores locales. Nuestra meta es ofrecer la máxima calidad, directamente del campo a los hogares, micromercados y restaurantes de nuestra región.
           </p>
           <p className="text-gray-600 leading-relaxed font-medium text-[15px]">
             Promovemos el mercado justo, la frescura garantizada y un trato humano excepcional. Porque sabemos que los mejores momentos se comparten alrededor de una buena comida.
           </p>
        </div>
      </div>
    </div>
  );
}
