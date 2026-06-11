'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { MiniCartDropdown } from '@/src/components/cart/MiniCartDropdown';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';
import { CATEGORIES } from '@/src/constants/productConstants';
import { useRouter } from 'next/navigation';

const TIER_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  'Personas Naturales': { label: 'Detal', color: 'text-[#E30613]', bg: 'bg-red-50 border-red-200' },
  'Micromercados': { label: 'Micro ✓', color: 'text-[#ca8a04]', bg: 'bg-yellow-50 border-yellow-200' },
  'Restaurantes': { label: 'Mayorista ✓', color: 'text-[#4CAF50]', bg: 'bg-green-50 border-green-200' },
};

export default function Header() {
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();
  const { role, isSignedIn } = useUserRole();
  const pathname = usePathname();
  const router = useRouter();
  const badge = TIER_BADGES[role];
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleCategoryClick = (cat: string) => {
    setIsMenuOpen(false);
    router.push(`/shop?category=${encodeURIComponent(cat)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md transition-all shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0.5 flex items-center justify-between">
          {/* Left Side: Hamburger & Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
           <button 
             className="md:hidden p-2 text-gray-700 hover:text-[#E30613] transition-colors"
             onClick={() => setIsMenuOpen(true)}
           >
             <Menu className="w-6 h-6" />
           </button>
           <Link href="/" className="flex items-center gap-2">
              <div className="relative w-[180px] sm:w-[420px] md:w-[510px] h-[70px] sm:h-[100px] md:h-[144px] flex items-center">
                 <Image 
                   src="/IMAGES/logo.jpeg" 
                   alt="La Gaviota Logo" 
                   fill
                   className="object-contain object-left md:object-center"
                   priority
                 />
              </div>
           </Link>
        </div>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-gray-700">
           <Link href="/" className="hover:text-[#E30613] transition-colors pb-1">Inicio</Link>
           <Link href="/shop" className="hover:text-[#E30613] transition-colors pb-1 font-bold">Tienda</Link>
           <Link href="/sobre-nosotros" className="hover:text-[#E30613] transition-colors pb-1">Nosotros</Link>
           
           <SignedIn>
             <Link href="/dashboard" className="text-[#83b745] hover:text-[#6c9c36] font-black transition-colors pb-1 flex items-center gap-1 bg-[#83b745]/10 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Mi Portal
             </Link>
           </SignedIn>
           
           <SignedOut>
             <Link href="/aplicar-negocio" className="text-[#FFCC00] bg-slate-800 hover:bg-slate-900 font-bold px-4 py-1.5 rounded-full transition-colors text-sm">
                Precios Negocio
             </Link>
           </SignedOut>
        </nav>

        {/* Actions Menu */}
        <div className="flex items-center gap-3">
          {/* Tier Badge */}
          <SignedIn>
            {badge && (
              <span className={`hidden sm:inline-flex text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.bg} ${badge.color}`}>
                {badge.label}
              </span>
            )}
          </SignedIn>

          {/* Cart */}
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

             {isCartOpen && (
                <div className="hidden md:block">
                   <MiniCartDropdown onClose={() => setIsCartOpen(false)} />
                </div>
             )}
          </div>

          {/* Auth Buttons */}
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-9 h-9 ring-2 ring-[#E30613]/20',
                }
              }}
            />
          </SignedIn>
          
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] px-4 py-2 rounded-full font-bold text-sm shadow-md transition-all hover:-translate-y-0.5">
                Ingresar
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
           {/* Overlay */}
           <div 
             className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             onClick={() => setIsMenuOpen(false)}
           />
           {/* Panel */}
           <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                 <span className="font-black text-xl text-slate-800">Menú</span>
                 <button 
                   onClick={() => setIsMenuOpen(false)}
                   className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                 {/* Main Navigation */}
                 <nav className="flex flex-col gap-2">
                    <Link onClick={() => setIsMenuOpen(false)} href="/" className="text-lg font-bold text-slate-700 py-2 hover:text-[#E30613]">Inicio</Link>
                    <Link onClick={() => setIsMenuOpen(false)} href="/shop" className="text-lg font-bold text-slate-700 py-2 hover:text-[#E30613]">Tienda General</Link>
                    <Link onClick={() => setIsMenuOpen(false)} href="/sobre-nosotros" className="text-lg font-bold text-slate-700 py-2 hover:text-[#E30613]">Sobre Nosotros</Link>
                 </nav>
                 
                 <div className="h-px w-full bg-gray-100" />
                 
                 {/* Categories */}
                 <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Categorías</h3>
                    <div className="flex flex-col gap-1">
                       {CATEGORIES.map(cat => (
                          <button 
                             key={cat}
                             onClick={() => handleCategoryClick(cat)}
                             className="text-left text-sm font-bold text-gray-600 py-2 hover:text-[#4CAF50] transition-colors"
                          >
                             {cat}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
}
