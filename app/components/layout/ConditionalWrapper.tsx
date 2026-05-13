"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';
import FloatingWhatsApp from '../ui/FloatingWhatsApp';
import { CartDrawer } from '@/src/components/cart/CartDrawer';

export default function ConditionalWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <main className="flex-1 w-full flex flex-col leading-relaxed">
        {children}
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full flex flex-col leading-relaxed">
        {children}
      </main>
      
      <footer className="bg-slate-900 text-white py-12 mt-auto relative z-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm opacity-90">
          <p className="font-serif italic text-2xl mb-4 text-[#FFCC00]">La Gaviota</p>
          <p>&copy; {new Date().getFullYear()} Surtifruver La Gaviota. Todos los derechos reservados.</p>
          <p className="mt-2 text-gray-400">La forma chévere de mercar | Plataforma impulsada por APEX</p>
        </div>
      </footer>
      
      {/* Global UI Overlays */}
      <FloatingWhatsApp />
      <CartDrawer />
    </>
  );
}
