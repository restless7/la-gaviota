'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/src/actions/products';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { CatalogImage } from './CatalogImage';
import { QuantitySelector } from './QuantitySelector';

const formatPrice = (price: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

export function ProductCard({ product }: { product: Product }) {
  const { items, addToCart, updateQuantity, cartReady } = useCart();
  const { role } = useUserRole();
  const quantity = items.find(item => item.product.id === product.id)?.quantity ?? 0;
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const tierTag = role === 'Restaurantes'
    ? { label: 'Tarifa Restaurante', classes: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    : role === 'Micromercados'
      ? { label: 'Tarifa Mayorista', classes: 'bg-amber-50 text-amber-800 border-amber-200' }
      : { label: 'Precio Detal', classes: 'bg-slate-100 text-slate-600 border-slate-200' };

  const hasSavings = typeof product.previousPrice === 'number' && product.previousPrice > product.price;

  useEffect(() => {
    if (expanded) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [expanded]);

  const handleIncrement = () => {
    if (quantity === 0) {
      addToCart(product, 1);
    } else {
      updateQuantity(product.id, current => current + 1);
    }
  };

  const handleDecrement = () => {
    updateQuantity(product.id, current => current - 1);
  };

  return (
    <>
      <article
        data-testid="product-card"
        data-product-id={product.id}
        className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
      >
        <button
          type="button"
          aria-label={`Ver detalles de ${product.name}`}
          onClick={() => setExpanded(true)}
          className="relative aspect-square w-full bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red-600"
        >
          {product.imageUrl ? (
            <CatalogImage
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 200px"
              className="object-contain p-2"
            />
          ) : (
            <span className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-slate-500">
              <span aria-hidden="true" className="text-4xl">🧺</span>
              <span className="text-xs">Foto no disponible</span>
            </span>
          )}
        </button>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <p className="truncate text-[9px] font-bold uppercase tracking-wide text-green-800">{product.category}</p>
          <h3 className="min-h-10 text-sm font-bold leading-snug text-slate-800">
            <button
              type="button"
              className="text-left hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-600"
              onClick={() => setExpanded(true)}
            >
              {product.name}
            </button>
          </h3>
          <div className="mt-auto">
            {hasSavings && (
              <p className="text-[11px] font-medium text-slate-400 line-through">
                {formatPrice(product.previousPrice!)}
              </p>
            )}
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <div>
                <p className="text-lg font-black text-slate-900">{formatPrice(product.price)}</p>
                <p className="text-xs text-slate-600">/ {product.unit}</p>
              </div>
              <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-tight ${tierTag.classes}`}>
                {tierTag.label}
              </span>
            </div>
          </div>
          <div className="mt-1">
            <QuantitySelector
              quantity={quantity}
              productName={product.name}
              disabled={!cartReady || !product.isActive}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          </div>
        </div>
      </article>

      {expanded && (
        <dialog
          ref={dialogRef}
          aria-label={`Detalles de ${product.name}`}
          onCancel={() => setExpanded(false)}
          onClose={() => setExpanded(false)}
          onClick={event => {
            if (event.target === event.currentTarget) setExpanded(false);
          }}
          className="fixed inset-0 m-auto max-h-[90dvh] w-[92vw] max-w-3xl overflow-y-auto rounded-3xl border-0 bg-white p-5 shadow-2xl backdrop:bg-slate-900/60 sm:p-8"
        >
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              aria-label="Cerrar detalles"
              onClick={() => setExpanded(false)}
              className="h-11 w-11 rounded-full bg-slate-100 text-xl text-slate-700 hover:bg-slate-200"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-50 sm:w-1/2">
              <CatalogImage
                src={product.imageUrl || '/IMAGES/logo.jpeg'}
                alt={product.name}
                fill
                sizes="(max-width: 639px) 90vw, 350px"
                className="object-contain p-3"
              />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <p className="text-xs font-bold uppercase text-green-800">{product.category}</p>
              <h2 className="text-2xl font-black text-slate-800">{product.name}</h2>
              <p className="text-3xl font-black text-slate-900">
                {formatPrice(product.price)} <span className="text-sm font-medium">/ {product.unit}</span>
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {product.description || 'Consulta la presentación y disponibilidad al confirmar tu pedido.'}
              </p>
              <div>
                <QuantitySelector
                  quantity={quantity}
                  productName={product.name}
                  disabled={!cartReady || !product.isActive}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                />
              </div>
              <p className="text-xs text-slate-500">Subtotal estimado. Precio y disponibilidad se confirman al finalizar.</p>
              <Link href={`/product/${encodeURIComponent(product.id)}`} className="py-2 text-sm font-bold text-red-700 underline">
                Ver producto completo
              </Link>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}

