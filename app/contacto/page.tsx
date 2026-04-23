import React from 'react';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in relative pb-24">
      
      {/* Banner */}
      <div className="relative w-full h-[300px]">
         <div className="absolute inset-0 bg-[#E30613] overflow-hidden">
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
            </svg>
         </div>
         <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
            <h1 className="text-4xl md:text-6xl font-black text-white font-serif tracking-tight drop-shadow-xl mb-3">
              Contacto
            </h1>
            <p className="text-white/90 text-lg font-medium">Estamos listos para atender tus pedidos y resolver tus dudas.</p>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
         <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">
            
            {/* Contact Info Sidebar */}
            <div className="w-full lg:w-2/5 xl:w-1/3 bg-[#4CAF50] text-white p-10 lg:p-12">
               <h3 className="font-serif font-black text-3xl mb-8">Hablemos</h3>
               
               <div className="space-y-8">
                  <div className="flex items-start gap-4">
                     <MapPin className="w-6 h-6 shrink-0 mt-1" />
                     <div>
                        <p className="font-bold text-lg mb-1">Centro de Acopio Principal</p>
                        <p className="text-green-50/90 leading-relaxed">
                           Km 4 Vía Girón - Bucaramanga<br />
                           Santander, Colombia
                        </p>
                     </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                     <Phone className="w-6 h-6 shrink-0 mt-1" />
                     <div>
                        <p className="font-bold text-lg mb-1">Línea Mayorista</p>
                        <p className="text-green-50/90 leading-relaxed font-medium">
                           +57 300 123 4567<br />
                           +57 320 987 6543
                        </p>
                     </div>
                  </div>

                  <div className="flex items-start gap-4">
                     <Mail className="w-6 h-6 shrink-0 mt-1" />
                     <div>
                        <p className="font-bold text-lg mb-1">Correo Electrónico</p>
                        <p className="text-green-50/90 leading-relaxed font-medium">
                           pedidos@lagaviota.co<br />
                           soporte@lagaviota.co
                        </p>
                     </div>
                  </div>

                  <div className="flex items-start gap-4">
                     <Clock className="w-6 h-6 shrink-0 mt-1" />
                     <div>
                        <p className="font-bold text-lg mb-1">Horario de Despachos</p>
                        <p className="text-green-50/90 leading-relaxed">
                           Lunes - Sábado:<br /> 4:00 AM - 6:00 PM<br />
                           Domingos: Cerrado
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Contact Form */}
            <div className="w-full lg:w-3/5 xl:w-2/3 p-10 lg:p-16">
               <h3 className="font-black text-slate-800 text-3xl mb-6">Envíanos un mensaje</h3>
               <p className="text-gray-500 mb-8">Si representas un restaurante o micromercado y deseas conocer nuestros precios por tier, déjanos tus datos.</p>
               
               <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo</label>
                        <input type="text" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] outline-none transition-all" placeholder="Ej. Carlos Mendoza" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono / WhatsApp</label>
                        <input type="tel" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] outline-none transition-all" placeholder="+57 300 000 0000" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Cliente</label>
                     <select className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] outline-none transition-all">
                        <option>Familia / Hogar (Detal)</option>
                        <option>Restaurante / Hotel</option>
                        <option>Micromercado / Tienda</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Mensaje o Solicitud de Pedido</label>
                     <textarea rows={4} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] outline-none transition-all resize-none" placeholder="¿En qué te podemos ayudar?"></textarea>
                  </div>
                  <button type="button" className="bg-[#E30613] hover:bg-[#c60510] text-white font-black px-8 py-4 rounded-xl shadow-md transition-transform hover:-translate-y-1 w-full md:w-auto uppercase tracking-wide">
                     Enviar Mensaje
                  </button>
               </form>
            </div>
         </div>
      </div>
      
    </div>
  );
}
