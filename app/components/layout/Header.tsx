'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/src/contexts/CartContext';
import { MiniCartDropdown } from '@/src/components/cart/MiniCartDropdown';

export default function Header() {
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full bg-white transition-all shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
           <div className="relative w-[140px] sm:w-[170px] h-12 flex items-center">
              <Image 
                src="/IMAGES/logo.jpeg" 
                alt="La Gaviota Logo" 
                fill
                className="object-contain"
                priority
              />
           </div>
        </Link>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-700">
           <Link href="/" className="hover:text-[#E30613] transition-colors pb-1">Inicio</Link>
           <Link href="/shop" className="hover:text-[#E30613] transition-colors pb-1 font-bold">Tienda</Link>
           <Link href="/sobre-nosotros" className="hover:text-[#E30613] transition-colors pb-1">Nosotros</Link>
           <Link href="/dashboard" className="text-[#83b745] hover:text-[#6c9c36] font-black transition-colors pb-1 flex items-center gap-1 bg-[#83b745]/10 px-3 py-1.5 rounded-full ml-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Mi Portal
           </Link>
        </nav>

        {/* Actions Menu */}
        <div className="flex items-center gap-4">
          <div className="relative">
             <button 
               onClick={() => setIsCartOpen(!isCartOpen)}
               className="flex items-center justify-center p-2 text-gray-700 hover:text-[#E30613] transition-colors relative"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                 <path d="M3 6h18"/>
                 <path d="M16 10a4 4 0 0 1-8 0"/>
               </svg>
               {itemCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-[#FFCC00] text-[#E30613] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm border border-white">
                   {itemCount}
                 </span>
               )}
             </button>

             {/* Rendering the Dropdown directly underneath (Hidden on Mobile) */}
             {isCartOpen && (
                <div className="hidden md:block">
                   <MiniCartDropdown onClose={() => setIsCartOpen(false)} />
                </div>
             )}
          </div>
          
          <button 
             onClick={() => setIsCartOpen(!isCartOpen)}
             className="text-gray-700 p-1 hover:text-[#E30613] transition-colors md:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
