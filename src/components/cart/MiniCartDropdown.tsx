'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { CartItems } from './CartItems';

const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

export function MiniCartDropdown({ onClose }: { onClose: () => void }) {
  const { items, cartTotal, remainingForFreeShipping } = useCart();
  const { role } = useUserRole();
  const dropdown = useRef<HTMLDivElement>(null);

  const minOrder = role === 'Restaurantes' ? 300000 : role === 'Micromercados' ? 150000 : 0;
  const remainingForMinOrder = Math.max(0, minOrder - cartTotal);

  useEffect(() => {
    const outside = (event: MouseEvent) => {
      if (!dropdown.current?.getClientRects().length) return;
      if (dropdown.current && !dropdown.current.contains(event.target as Node) && !(event.target as Element).closest('[data-testid="cart-toggle"]')) {
        onClose();
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (!dropdown.current?.getClientRects().length) return;
      if (event.key === 'Escape') {
        onClose();
        document.querySelector<HTMLButtonElement>('[data-testid="cart-toggle"]')?.focus();
      }
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [onClose]);

  return (
    <section
      ref={dropdown}
      aria-label="Tu carrito"
      className="fixed inset-x-3 top-20 z-50 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[390px] sm:max-w-[calc(100vw-2rem)]"
    >
      <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2.5">
        <div>
          <h2 className="font-black text-green-900">Tu Carrito</h2>
          <p className="text-[11px] font-bold text-slate-500">
            Tarifa activa: <span className="text-slate-800">{role}</span>
          </p>
        </div>
        <button type="button" aria-label="Cerrar carrito" onClick={onClose} className="h-9 w-9 rounded-full text-slate-600 hover:bg-slate-100">
          ✕
        </button>
      </div>

      {items.length > 0 && (
        <div className="mb-3 rounded-xl bg-slate-50 p-2.5 text-xs">
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

      <div className="max-h-[min(50dvh,380px)] overflow-y-auto">
        {items.length ? <CartItems /> : <p className="py-8 text-center text-sm text-slate-600">Tu carrito está vacío.</p>}
      </div>

      <p className="my-3 flex justify-between gap-2 border-t border-gray-100 pt-3 text-sm font-bold">
        <span>Subtotal estimado</span>
        <span className="text-base font-black text-slate-900">{formatCOP(cartTotal)}</span>
      </p>
      <p className="mb-3 text-[11px] text-slate-500">Precio, disponibilidad y envío se confirman al finalizar.</p>

      <div className="flex flex-col gap-2">
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/cart"
              onClick={onClose}
              className="rounded-xl border border-green-800 py-2.5 text-center text-sm font-bold text-green-900 hover:bg-green-50"
            >
              Ver carrito
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="rounded-xl bg-[#83b745] py-2.5 text-center text-sm font-black text-white shadow-sm hover:bg-[#6c9c36]"
            >
              Finalizar pedido
            </Link>
          </div>
        )}
        <button type="button" onClick={onClose} className="min-h-10 w-full rounded-xl border border-gray-200 text-xs font-bold text-slate-600 hover:bg-slate-50">
          Seguir comprando
        </button>
      </div>
    </section>
  );
}
