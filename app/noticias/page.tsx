import React from 'react';

export default function NoticiasPage() {
  const news = [
    { id: 1, title: '¡Nueva Cosecha de Tomate Chonto!', date: 'Octubre 2026', emoji: '🍅' },
    { id: 2, title: 'Apoyando a nuestros agricultores locales en la ola invernal.', date: 'Septiembre 2026', emoji: '🌧️' },
    { id: 3, title: 'Inauguración de nuestro nuevo centro de acopio sustentable.', date: 'Agosto 2026', emoji: '♻️' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
      <h1 className="text-4xl font-black text-gaviota-red font-serif mb-8 drop-shadow-sm">Noticias y Actualidad</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {news.map(item => (
          <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-lg transition-all group">
             <div className="text-5xl mb-6 group-hover:scale-110 transition-transform origin-left">{item.emoji}</div>
             <p className="text-sm text-gaviota-green font-bold mb-2 tracking-wide uppercase">{item.date}</p>
             <h3 className="text-xl font-bold text-slate-800 leading-snug">{item.title}</h3>
             <button className="mt-6 text-[#CC0000] font-bold text-sm hover:underline flex items-center gap-1">
               Leer más <span aria-hidden="true">&rarr;</span>
             </button>
          </div>
        ))}
      </div>
    </div>
  );
}
