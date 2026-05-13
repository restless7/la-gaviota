'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Truck,
  Leaf
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-white relative overflow-hidden border-t border-white/5">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gaviota-red/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gaviota-green/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none"></div>

      {/* Top Banner: Trust Pillars */}
      <div className="border-b border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 group">
              <div className="p-3 bg-gaviota-green/10 rounded-2xl text-gaviota-green group-hover:bg-gaviota-green group-hover:text-white transition-all">
                <Leaf size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">100% Orgánico</h4>
                <p className="text-sm text-gray-400">Directo de granjas certificadas.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-3 bg-gaviota-red/10 rounded-2xl text-gaviota-red group-hover:bg-gaviota-red group-hover:text-white transition-all">
                <Truck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Entrega Express</h4>
                <p className="text-sm text-gray-400">En tu puerta en menos de 24h.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-3 bg-gaviota-yellow/10 rounded-2xl text-gaviota-yellow group-hover:bg-gaviota-yellow group-hover:text-slate-900 transition-all">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Pago Seguro</h4>
                <p className="text-sm text-gray-400">Transacciones protegidas SSL.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
               <div className="relative w-48 h-12 flex items-center brightness-0 invert opacity-90">
                  <Image 
                    src="/IMAGES/logo.jpeg" 
                    alt="La Gaviota Logo" 
                    fill
                    className="object-contain"
                  />
               </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Llevando la frescura del campo colombiano a tu mesa. Somos la conexión directa entre el productor y tu familia.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gaviota-red transition-all border border-white/10 group">
                <Instagram size={18} className="text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gaviota-red transition-all border border-white/10 group">
                <Facebook size={18} className="text-gray-400 group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gaviota-red transition-all border border-white/10 group">
                <Twitter size={18} className="text-gray-400 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gaviota-red"></span>
              Explora
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/shop" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-5 transition-all" /> Tienda Online</Link></li>
              <li><Link href="/categoria/frutas" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-5 transition-all" /> Frutas Frescas</Link></li>
              <li><Link href="/categoria/verduras-y-hortalizas" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-5 transition-all" /> Verduras</Link></li>
              <li><Link href="/comunidad" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-5 transition-all" /> Comunidad Gaviota</Link></li>
              <li><Link href="/noticias" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-5 transition-all" /> Blog del Campo</Link></li>
            </ul>
          </div>

          {/* B2B / Partners */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gaviota-green"></span>
              Negocios
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><Link href="/aplicar-negocio" className="hover:text-white transition-colors flex items-center gap-2 group font-bold text-gaviota-yellow/80"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-5 transition-all" /> Programa Aliados</Link></li>
              <li><Link href="/restaurante" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-5 transition-all" /> Para Restaurantes</Link></li>
              <li><Link href="/micromercado" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-5 transition-all" /> Para Micromercados</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-5 transition-all" /> Portal Administrativo</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gaviota-yellow"></span>
              Contacto
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1 text-gaviota-red"><MapPin size={18} /></div>
                <div className="text-sm text-gray-400">
                  <p className="text-white font-medium">Bucaramanga, Santander</p>
                  <p>Calle Principal Surtifruver</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 text-gaviota-red"><Phone size={18} /></div>
                <div className="text-sm text-gray-400">
                  <p className="text-white font-medium">+57 315 123 4567</p>
                  <p>Lun - Sab, 6:00 AM - 8:00 PM</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 text-gaviota-red"><Mail size={18} /></div>
                <div className="text-sm text-gray-400">
                  <p className="text-white font-medium">pedidos@lagaviota.co</p>
                  <p>Soporte 24/7 online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5 bg-black/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-xs text-gray-500 font-medium">
              &copy; {currentYear} Surtifruver La Gaviota SAS. Todos los derechos reservados. NIT: 900.123.456-7
            </div>
            <div className="flex gap-8 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
              <Link href="#" className="hover:text-white transition-colors">Términos</Link>
              <Link href="#" className="hover:text-white transition-colors">PQRS</Link>
            </div>
            <div className="flex items-center gap-2 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-[10px] uppercase font-black tracking-tighter text-gray-400">Powered by</span>
              <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-black text-white italic">APEX IA</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
