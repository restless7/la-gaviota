import React from 'react';

export default function ContactoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 max-w-3xl mx-auto">
         <h1 className="text-4xl font-black text-gaviota-red font-serif mb-6 text-center drop-shadow-sm">Contáctanos</h1>
         <p className="text-center text-gray-600 mb-10">¿Tienes dudas sobre tu pedido mayorista o quieres ser proveedor? Escríbenos.</p>
         
         <form className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-6">
               <div className="flex-1 flex flex-col">
                 <label className="text-sm font-semibold text-slate-700 mb-2">Nombre Completo</label>
                 <input type="text" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-gaviota-red focus:bg-white transition-all" placeholder="Ej: Juan Pérez" />
               </div>
               <div className="flex-1 flex flex-col">
                 <label className="text-sm font-semibold text-slate-700 mb-2">Teléfono / WhatsApp</label>
                 <input type="tel" className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-gaviota-red focus:bg-white transition-all" placeholder="Ej: 300 123 4567" />
               </div>
            </div>
            
            <div className="flex flex-col">
               <label className="text-sm font-semibold text-slate-700 mb-2">Tipo de Consulta</label>
               <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-gaviota-red focus:bg-white transition-all">
                  <option>Seleccione una opción...</option>
                  <option>Ventas Mayoristas / Restaurantes</option>
                  <option>Dudas sobre un pedido</option>
                  <option>Quiero ser proveedor local</option>
               </select>
            </div>

            <div className="flex flex-col">
               <label className="text-sm font-semibold text-slate-700 mb-2">Mensaje</label>
               <textarea rows={4} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-gaviota-red focus:bg-white transition-all resize-none" placeholder="Escribe tu mensaje aquí..."></textarea>
            </div>
            
            <button type="button" className="bg-[#CC0000] text-white font-bold py-4 rounded-xl shadow-md hover:bg-red-800 transition-colors mt-2">
               Enviar Mensaje
            </button>
         </form>
      </div>
    </div>
  );
}
