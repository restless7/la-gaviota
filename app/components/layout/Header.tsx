'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { Menu, X, ShoppingBag, UserRound, Store, ChefHat, Home } from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { MiniCartDropdown } from '@/src/components/cart/MiniCartDropdown';
import { CATEGORIES } from '@/src/constants/productConstants';
import { categoryHref } from '@/src/lib/categories';

export default function Header() {
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();
  const { role, businessName } = useUserRole();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => { menuRef.current?.close(); setMenuOpen(false); };
  if (pathname?.startsWith('/admin')) return null;

  const tierBadge = role === 'Restaurantes'
    ? {
        label: 'Mayorista · Restaurante',
        shortLabel: 'Restaurante',
        classes: 'border-emerald-300 bg-emerald-50 text-emerald-800',
        Icon: ChefHat,
      }
    : role === 'Micromercados'
      ? {
          label: 'Mayorista · Micromercado',
          shortLabel: 'Micromercado',
          classes: 'border-amber-300 bg-amber-50 text-amber-800',
          Icon: Store,
        }
      : {
          label: 'Cliente Detal · Hogar',
          shortLabel: 'Detal / Hogar',
          classes: 'border-slate-200 bg-slate-50 text-slate-700',
          Icon: Home,
        };
  const TierIcon = tierBadge.Icon;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-1 sm:gap-3">
            <button type="button" aria-label="Abrir menú" aria-haspopup="dialog" aria-controls="gaviota-menu" aria-expanded={menuOpen} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-red-600 xl:hidden" onClick={() => { menuRef.current?.showModal(); setMenuOpen(true); }}>
              <Menu aria-hidden="true" size={24} />
            </button>
            <Link href="/" aria-label="La Gaviota, ir a la tienda" className="relative block h-16 w-[104px] shrink-0 sm:w-40 xl:w-44">
              <Image src="/IMAGES/logo.jpeg" alt="La Gaviota" fill sizes="(max-width: 639px) 104px, 176px" priority className="object-contain" />
            </Link>
          </div>

          <nav aria-label="Navegación principal" className="hidden items-center gap-5 whitespace-nowrap text-sm font-semibold text-slate-700 xl:flex">
            <Link href="/" className="py-3 hover:text-red-700">Tienda</Link>
            <Link href="/nosotros" className="py-3 hover:text-red-700">Nuestra Granja</Link>
            <Link href="/sobre-nosotros" className="py-3 hover:text-red-700">Nosotros</Link>
            <Link href="/aplicar-negocio" className="rounded-full bg-slate-800 px-4 py-2.5 text-yellow-300 hover:bg-slate-900">Precios Negocio</Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              href={role === 'Personas Naturales' ? '/aplicar-negocio' : '/dashboard'}
              data-testid="customer-tier-badge"
              title={businessName ? `${tierBadge.label} (${businessName})` : tierBadge.label}
              className={`hidden md:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold tracking-tight transition-colors hover:opacity-90 ${tierBadge.classes}`}
            >
              <TierIcon size={14} aria-hidden="true" />
              <span className="hidden lg:inline">{tierBadge.label}</span>
              <span className="lg:hidden">{tierBadge.shortLabel}</span>
            </Link>
            <Link href="/dashboard" className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-xl px-2 text-xs font-bold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 sm:px-3 sm:text-sm" data-testid="account-link">
              <UserRound size={19} aria-hidden="true" className="hidden sm:block" /> Mi Cuenta / Portal
            </Link>
            <div className="relative">
              <button type="button" data-testid="cart-toggle" aria-label={`Abrir carrito, ${itemCount} unidades`} aria-expanded={isCartOpen} onClick={() => setIsCartOpen(!isCartOpen)} className="relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600">
                <ShoppingBag size={25} aria-hidden="true" />
                {itemCount > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-white bg-yellow-300 px-1 text-[10px] font-black text-red-700">{itemCount}</span>}
              </button>
              {isCartOpen && <MiniCartDropdown onClose={() => setIsCartOpen(false)} />}
            </div>
            <div className="hidden sm:block"><SignedIn><UserButton /></SignedIn></div>
          </div>
        </div>
      </header>

      <dialog id="gaviota-menu" ref={menuRef} aria-labelledby="gaviota-menu-title" onClose={() => setMenuOpen(false)} onClick={event => { if (event.target === event.currentTarget) closeMenu(); }} className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(88vw,22rem)] max-w-full border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-900/60">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 id="gaviota-menu-title" className="text-xl font-black text-slate-800">La Gaviota</h2>
              <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${tierBadge.classes}`}>
                <TierIcon size={12} aria-hidden="true" /> {tierBadge.label}
              </span>
            </div>
            <button type="button" aria-label="Cerrar menú" onClick={closeMenu} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-700"><X aria-hidden="true" size={22} /></button>
          </div>
          <nav aria-label="Menú de la tienda" className="flex flex-1 flex-col gap-1 overflow-y-auto p-4 text-sm font-semibold text-slate-700">
            <Link href="/dashboard" onClick={closeMenu} className="mb-3 rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">Mi Cuenta · Mis pedidos</Link>
            <Link href="/" onClick={closeMenu} className="rounded-lg px-3 py-3 hover:bg-slate-50">Tienda General</Link>
            <Link href="/nosotros" onClick={closeMenu} className="rounded-lg px-3 py-3 hover:bg-slate-50">Nuestra Granja</Link>
            <Link href="/sobre-nosotros" onClick={closeMenu} className="rounded-lg px-3 py-3 hover:bg-slate-50">Nosotros</Link>
            <Link href="/aplicar-negocio" onClick={closeMenu} className="rounded-lg px-3 py-3 hover:bg-slate-50">Precios para Negocios</Link>
            <h3 className="mb-1 mt-5 px-3 text-xs font-black uppercase tracking-wide text-slate-500">Categorías</h3>
            {CATEGORIES.map(category => <Link key={category} href={categoryHref(category)} onClick={closeMenu} className="rounded-lg px-3 py-3 text-xs hover:bg-green-50">{category}</Link>)}
          </nav>
        </div>
      </dialog>
    </>
  );
}
