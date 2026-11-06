'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { CartItems } from './CartItems';

const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, cartTotal, remainingForFreeShipping } = useCart();
  const { role } = useUserRole();
  const dialog = useRef<HTMLDialogElement>(null);

  const minOrder = role === 'Restaurantes' ? 300000 : role === 'Micromercados' ? 150000 : 0;
  const remainingForMinOrder = Math.max(0, minOrder - cartTotal);

  useEffect(() => {
    // Desktop uses the anchored cart; the modal drawer is only for small screens.
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      if (isCartOpen && media.matches) {
        if (!dialog.current?.open) dialog.current?.showModal();
      } else {
        if (dialog.current?.open) dialog.current?.close();
      }
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [isCartOpen]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="cart-drawer-title"
      onCancel={() => setIsCartOpen(false)}
      onClick={event => {
        if (event.target === event.currentTarget) setIsCartOpen(false);
      }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-md border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-900/50"
    >
      <div className="flex h-full flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 id="cart-drawer-title" className="text-xl font-black text-slate-800">Tu Canasta</h2>
            <p className="text-[11px] font-bold text-slate-500">
              Tarifa activa: <span className="text-slate-800">{role}</span>
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={() => setIsCartOpen(false)}
            className="h-11 w-11 rounded-full bg-slate-100 font-bold text-slate-700"
          >
            ✕
          </button>
        </div>

        {items.length > 0 && (
          <div className="mx-4 mt-3 rounded-xl bg-slate-50 p-2.5 text-xs">
            {minOrder > 0 ? (
              remainingForMinOrder > 0 ? (
                <p className="font-semibold text-amber-800">
                  Faltan <strong>{formatCOP(remainingForMinOrder)}</strong> para el pedido mínimo de {role} ({formatCOP(minOrder)}).
                </p>
              ) : (
                <p className="font-bold text-emerald-700">✓ Pedido mínimo mayorista alcanzado ({formatCOP(minOrder)}).</p>
              )
            ) : remainingForFreeShipping > 0 ? (
              <p className="font-semibold text-slate-700">
                Agrega <strong>{formatCOP(remainingForFreeShipping)}</strong> más para <strong>envío gratis</strong>.
              </p>
            ) : (
              <p className="font-bold text-emerald-700">🎉 ¡Tienes domicilio gratis activado!</p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {items.length ? (
            <CartItems />
          ) : (
            <p className="py-12 text-center text-slate-600">Tu canasta está vacía. Sigue explorando la tienda.</p>
          )}
        </div>

        <div className="space-y-2.5 border-t bg-slate-50 p-4">
          <p className="flex justify-between gap-2 font-bold text-slate-800">
            <span>Subtotal estimado</span>
            <span className="text-lg font-black text-slate-900">{formatCOP(cartTotal)}</span>
          </p>
          <p className="text-xs text-slate-600">Precio, disponibilidad y envío se confirman al finalizar.</p>
          {items.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/cart"
                onClick={() => setIsCartOpen(false)}
                className="flex min-h-11 items-center justify-center rounded-xl border border-green-800 py-2.5 text-center text-sm font-bold text-green-900 hover:bg-green-50"
              >
                Ver carrito
              </Link>
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="flex min-h-11 items-center justify-center rounded-xl bg-[#83b745] py-2.5 text-center text-sm font-black text-white shadow-sm hover:bg-[#6c9c36]"
              >
                Finalizar pedido
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="min-h-11 w-full rounded-xl border border-gray-300 font-bold text-slate-700"
          >
            Seguir comprando
          </button>
        </div>
      </div>
    </dialog>
  );
}
