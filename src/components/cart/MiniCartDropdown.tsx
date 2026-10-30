'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/src/contexts/CartContext';
import { CartItems } from './CartItems';

export function MiniCartDropdown({ onClose }: { onClose: () => void }) {
  const { items, cartTotal } = useCart();
  const dropdown = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (!dropdown.current?.getClientRects().length) return; if (dropdown.current && !dropdown.current.contains(event.target as Node) && !(event.target as Element).closest('[data-testid="cart-toggle"]')) onClose(); };
    const escape = (event: KeyboardEvent) => { if (!dropdown.current?.getClientRects().length) return; if (event.key === 'Escape') { onClose(); document.querySelector<HTMLButtonElement>('[data-testid="cart-toggle"]')?.focus(); } };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [onClose]);
  return <section ref={dropdown} aria-label="Tu carrito" className="absolute right-0 top-full z-50 mt-3 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
    <div className="mb-3 flex items-center justify-between"><h2 className="font-black text-green-900">Tu Carrito</h2><button type="button" aria-label="Cerrar carrito" onClick={onClose} className="h-11 w-11 rounded-full hover:bg-slate-100">✕</button></div>
    <div className="max-h-[min(55dvh,450px)] overflow-y-auto">{items.length ? <CartItems /> : <p className="py-8 text-center text-sm text-slate-600">Tu carrito está vacío.</p>}</div>
    <p className="my-4 flex justify-between gap-2 text-sm font-bold"><span>Subtotal estimado</span><span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cartTotal)}</span></p>
    <p className="mb-3 text-xs text-slate-600">Precio, disponibilidad y envío se confirman al finalizar.</p>
    <button type="button" onClick={onClose} className="mb-2 min-h-11 w-full rounded-xl border border-gray-300 font-bold text-slate-700">Seguir comprando</button>
    {items.length > 0 && <Link href="/cart" onClick={onClose} className="block rounded-xl bg-green-800 py-3 text-center font-bold text-white">Ver carrito</Link>}
  </section>;
}
