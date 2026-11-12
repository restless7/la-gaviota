'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { Menu, X, ShoppingBag, UserRound, Store, ChefHat, Home, Shield } from 'lucide-react';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { useRBAC } from '@/src/hooks/useRBAC';
import { MiniCartDropdown } from '@/src/components/cart/MiniCartDropdown';
import { CATEGORIES } from '@/src/constants/productConstants';
import { categoryHref } from '@/src/lib/categories';

export default function Header() {
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();
  const { role, businessName } = useUserRole();
  const { isAdminAreaUser } = useRBAC();
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
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6 2xl:px-8">
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <button type="button" aria-label="Abrir menú" aria-haspopup="dialog" aria-controls="gaviota-menu" aria-expanded={menuOpen} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-red-600 xl:hidden" onClick={() => { menuRef.current?.showModal(); setMenuOpen(true); }}>
              <Menu aria-hidden="true" size={24} />
            </button>
            <Link href="/" aria-label="La Gaviota, ir a la tienda" className="relative block h-12 w-28 shrink-0 sm:h-14 sm:w-36 xl:h-14 xl:w-36 2xl:w-40">
              <Image src="/IMAGES/logo.jpeg" alt="La Gaviota" fill sizes="(max-width: 639px) 112px, 160px" priority className="object-contain" />
            </Link>
          </div>

          <nav aria-label="Navegación principal" className="hidden shrink-0 items-center gap-2 lg:gap-3 2xl:gap-5 whitespace-nowrap text-xs 2xl:text-sm font-semibold text-slate-700 xl:flex">
            <Link href="/tiendita" className="inline-flex items-center gap-1.5 py-1 px-3 2xl:py-1.5 2xl:px-3.5 rounded-full bg-white text-emerald-800 font-extrabold border-2 border-emerald-500 hover:bg-emerald-50 hover:text-emerald-900 transition-colors shadow-sm">
              <span className="text-sm 2xl:text-base">🎄</span>
              <span>La Tiendita</span>
              <span className="text-[9px] 2xl:text-[10px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">Nuevo</span>
            </Link>
            <Link href="/nosotros" className="py-2.5 px-1 hover:text-red-700 transition-colors">Nuestra Granja</Link>
            <Link href="/sobre-nosotros" className="py-2.5 px-1 hover:text-red-700 transition-colors">Nosotros</Link>
            <Link href="/aplicar-negocio" className="rounded-full bg-slate-800 px-3 py-1.5 2xl:px-4 2xl:py-2 text-yellow-300 hover:bg-slate-900 transition-colors text-xs font-bold">Precios Negocio</Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 2xl:gap-3">
            {isAdminAreaUser && (
              <Link
                href="/admin"
                className="hidden md:inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 2xl:px-3 2xl:py-1.5 text-xs font-extrabold text-purple-900 transition-colors hover:bg-purple-100"
                title="Ir al Panel de Administración"
              >
                <Shield size={13} className="text-purple-700" aria-hidden="true" />
                <span className="hidden 2xl:inline">Panel Admin</span>
                <span className="2xl:hidden">Admin</span>
              </Link>
            )}
            <Link
              href={role === 'Personas Naturales' ? '/aplicar-negocio' : '/dashboard'}
              data-testid="customer-tier-badge"
              title={businessName ? `${tierBadge.label} (${businessName})` : tierBadge.label}
              className={`hidden md:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 2xl:px-3 2xl:py-1.5 text-xs font-extrabold tracking-tight transition-colors hover:opacity-90 ${tierBadge.classes}`}
            >
              <TierIcon size={13} aria-hidden="true" />
              <span className="hidden 2xl:inline">{tierBadge.label}</span>
              <span className="2xl:hidden">{tierBadge.shortLabel}</span>
            </Link>
            <Link href="/dashboard" className="flex min-h-9 items-center gap-1 whitespace-nowrap rounded-xl px-2 text-xs font-bold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 sm:px-2.5 sm:text-xs 2xl:text-sm" data-testid="account-link">
              <UserRound size={17} aria-hidden="true" className="hidden sm:block" />
              <span className="hidden 2xl:inline">Mi Cuenta / Portal</span>
              <span className="2xl:hidden">Mi Cuenta</span>
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
            {isAdminAreaUser && (
              <Link href="/admin" onClick={closeMenu} className="mb-2 rounded-xl bg-purple-50 px-4 py-3 font-bold text-purple-800 flex items-center gap-2">
                <Shield size={16} className="text-purple-700" /> Panel Administrador
              </Link>
            )}
            <Link href="/dashboard" onClick={closeMenu} className="mb-3 rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">Mi Cuenta · Mis pedidos</Link>
            <Link href="/tiendita" onClick={closeMenu} className="mb-2 rounded-xl bg-white border-2 border-emerald-400 px-4 py-3 font-black text-emerald-900 flex items-center justify-between shadow-sm">
              <span className="flex items-center gap-2">🎄 La Tiendita Navideña</span>
              <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase">Nuevo</span>
            </Link>
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
