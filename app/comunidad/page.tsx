import React from 'react';

export default function ComunidadPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in text-center">
      <h1 className="text-4xl font-black text-[#ca8a04] font-serif mb-6 drop-shadow-sm">Nuestra Comunidad</h1>
      <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">Únete a cientos de restaurantes y familias que confían en La Gaviota.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="text-6xl mb-4">👨‍🍳</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Restaurantes Aliados</h3>
          <p className="text-sm text-gray-500 text-center">Descubre quiénes preparan sus mejores platos con nuestros ingredientes frescos.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="text-6xl mb-4">👩‍🌾</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Historias del Campo</h3>
          <p className="text-sm text-gray-500 text-center">Conoce a los campesinos colombianos que hacen posible que tengas la mejor calidad en tu mesa.</p>
        </div>
      </div>
    </div>
  );
}
