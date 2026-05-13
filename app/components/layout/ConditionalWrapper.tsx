"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
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
      
      <Footer />
      
      {/* Global UI Overlays */}
      <FloatingWhatsApp />
      <CartDrawer />
    </>
  );
}
