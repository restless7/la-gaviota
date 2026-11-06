import React from 'react';
import { ContactForm } from '@/src/components/support/ContactForm';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function ContactoPage() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'pedidos@lagaviota.co';
  const rawPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') || '573112694676';
  const phone = /^\d{10,15}$/.test(rawPhone) ? rawPhone : '573112694676';
  const hasWhatsApp = true;
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
                        <p className="font-bold text-lg mb-1">Sede Comercial</p>
                        <p className="text-sm text-white/90 leading-relaxed">
                          Plaza de Mercado San Francisco<br />
                          Calle 13 #22-49, Local 10<br />
                          Bucaramanga, Santander
                        </p>
                        <p className="text-xs text-white/75 mt-1">Titular: Eduard Iván Velazco López</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <Phone className="w-6 h-6 shrink-0 mt-1" />
                     <div>
                        <p className="font-bold text-lg mb-1">Teléfono / WhatsApp</p>
                        <a 
                          href={`https://wa.me/${phone}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="underline hover:text-white/80 transition-colors"
                        >
                          +57 311 269 4676
                        </a>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <Mail className="w-6 h-6 shrink-0 mt-1" />
                     <div>
                        <p className="font-bold text-lg mb-1">Correo electrónico</p>
                        {email ? <a href={`mailto:${email}`} className="underline">{email}</a> : <p>pedidos@lagaviota.co</p>}
                     </div>
                  </div>
                  <div className="pt-4 border-t border-white/20">
                     <p className="font-bold text-sm mb-3">Síguenos en redes</p>
                     <div className="flex gap-4">
                        <a 
                          href="https://www.instagram.com/lagaviotafruver/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all"
                          aria-label="Instagram"
                        >
                          Instagram
                        </a>
                        <a 
                          href="https://www.facebook.com/lagaviotafruver/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all"
                          aria-label="Facebook"
                        >
                          Facebook
                        </a>
                     </div>
                  </div>
               </div>
            </div>

            {/* Contact Form */}
            <div className="w-full lg:w-3/5 xl:w-2/3 p-10 lg:p-16">
               <h3 className="font-black text-slate-800 text-3xl mb-6">Envíanos un mensaje</h3>
               <p className="text-gray-500 mb-8">Si representas un restaurante o micromercado y deseas conocer nuestros precios por tier, déjanos tus datos.</p>
               
               <ContactForm />
            </div>
         </div>
      </div>
      
    </div>
  );
}
