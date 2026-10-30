'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/src/contexts/CartContext';
import { CartItems } from './CartItems';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, cartTotal } = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    // Desktop uses the anchored cart; the modal drawer is only for small screens.
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => { if (isCartOpen && media.matches) dialog.current?.showModal(); else dialog.current?.close(); };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [isCartOpen]);
  return <dialog ref={dialog} aria-labelledby="cart-drawer-title" onCancel={() => setIsCartOpen(false)} onClick={event => { if (event.target === event.currentTarget) setIsCartOpen(false); }} className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-md border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-900/50">
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4"><h2 id="cart-drawer-title" className="text-xl font-black text-slate-800">Tu Canasta</h2><button type="button" aria-label="Cerrar carrito" onClick={() => setIsCartOpen(false)} className="h-11 w-11 rounded-full bg-slate-100">✕</button></div>
      <div className="flex-1 overflow-y-auto p-4">{items.length ? <CartItems /> : <p className="py-12 text-center text-slate-600">Tu canasta está vacía. Sigue explorando la tienda.</p>}</div>
      <div className="space-y-3 border-t bg-slate-50 p-4">
        <p className="flex justify-between gap-2 font-bold text-slate-800"><span>Subtotal estimado</span><span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cartTotal)}</span></p>
        <p className="text-xs text-slate-600">Precio, disponibilidad y envío se confirman al finalizar.</p>
        <button type="button" onClick={() => setIsCartOpen(false)} className="min-h-11 w-full rounded-xl border border-gray-300 font-bold text-slate-700">Seguir comprando</button>
        {items.length > 0 && <Link href="/cart" onClick={() => setIsCartOpen(false)} className="block rounded-xl bg-[#E30613] py-3 text-center font-bold text-yellow-300">Ver carrito</Link>}
      </div>
    </div>
  </dialog>;
}
