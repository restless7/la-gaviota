'use client';

import Link from 'next/link';
import { useCart } from '@/src/contexts/CartContext';
import { CatalogImage } from '@/src/components/store/CatalogImage';
import { QuantitySelector } from '@/src/components/store/QuantitySelector';

const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export function CartItems() {
  const { items, updateQuantity, removeFromCart, cartReady } = useCart();
  return <ul className="space-y-4">{items.map(({ product, quantity }) => <li key={product.id} data-testid="cart-line" className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3">
    <Link href={`/product/${encodeURIComponent(product.id)}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-20 sm:w-20"><CatalogImage src={product.imageUrl || '/IMAGES/logo.jpeg'} alt={product.name} fill sizes="80px" className="object-contain p-1" /></Link>
    <div className="min-w-0 flex-1">
      <Link href={`/product/${encodeURIComponent(product.id)}`} className="text-sm font-bold text-slate-800 hover:text-red-700">{product.name}</Link>
      <p className="my-1 text-xs text-slate-600">{money(product.price)} / {product.unit}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <QuantitySelector
          quantity={quantity}
          productName={product.name}
          disabled={!cartReady}
          onIncrement={() => updateQuantity(product.id, current => current + 1)}
          onDecrement={() => updateQuantity(product.id, current => current - 1)}
        />
        <span className="text-sm font-black text-slate-900">{money(product.price * quantity)}</span>
      </div>
      <button
        type="button"
        disabled={!cartReady}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          removeFromCart(product.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={`Eliminar ${product.name} del carrito`}
        className="mt-1 inline-flex min-h-9 items-center px-2 -ml-2 text-xs font-bold text-red-700 underline hover:bg-red-50 rounded-lg touch-manipulation disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  </li>)}</ul>;
}
