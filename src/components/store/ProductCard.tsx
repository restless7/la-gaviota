'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/src/actions/products';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { CatalogImage } from './CatalogImage';
import { KitIngredientsList } from './KitIngredientsList';
import { QuantitySelector } from './QuantitySelector';

const formatPrice = (price: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);

export function ProductCard({ product, trackInventory = false }: { product: Product; trackInventory?: boolean }) {
  const { items, addToCart, updateQuantity, cartReady } = useCart();
  const { role } = useUserRole();
  const quantity = items.find(item => item.product.id === product.id)?.quantity ?? 0;
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const isOutOfStock = trackInventory && !product.isKit && product.stockQuantity <= 0;
  const isLowStock = trackInventory && !product.isKit && product.stockQuantity > 0 && product.stockQuantity <= 5;
  const stockCapped = trackInventory && !product.isKit && product.stockQuantity > 0 && quantity >= product.stockQuantity;

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
              className={`object-contain p-2 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
            />
          ) : (
            <span className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-slate-500">
              <span aria-hidden="true" className="text-4xl">🧺</span>
              <span className="text-xs">Foto no disponible</span>
            </span>
          )}
          {isOutOfStock ? (
            <span className="absolute top-2 left-2 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              Agotado
            </span>
          ) : isLowStock ? (
            <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              Quedan {product.stockQuantity}
            </span>
          ) : null}
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
          {product.isKit && product.kitItems && product.kitItems.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="self-start rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition-colors"
            >
              🧺 {product.kitItems.length} ingredientes · Ver lista
            </button>
          )}
          {product.description && (
            <p className="line-clamp-2 text-[11px] leading-snug text-slate-500">
              {product.description}
            </p>
          )}
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
          <div className="mt-1 flex flex-col gap-1.5">
            {isOutOfStock ? (
              <div className="flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-extrabold uppercase tracking-wider text-red-700">
                Agotado temporalmente
              </div>
            ) : (
              <QuantitySelector
                quantity={quantity}
                productName={product.name}
                disabled={!cartReady || !product.isActive}
                maxReached={stockCapped}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
              />
            )}
            {quantity > 1 && (
              <div 
                className="flex items-center justify-between rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200/60"
                aria-live="polite"
              >
                <span className="text-slate-500 font-medium">Total:</span>
                <span>{quantity} × {formatPrice(product.price)} = <span className="font-extrabold text-emerald-950">{formatPrice(quantity * product.price)}</span></span>
              </div>
            )}
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
            <div className={`relative w-full overflow-hidden rounded-2xl bg-slate-50 sm:w-1/2 self-start ${product.isKit ? 'aspect-[16/9]' : 'aspect-square'}`}>
              <CatalogImage
                src={product.imageUrl || '/IMAGES/logo.jpeg'}
                alt={product.name}
                fill
                sizes="(max-width: 639px) 90vw, 350px"
                className="object-contain p-2"
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
              {product.kitItems && product.kitItems.length > 0 && (
                <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/40 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-900">
                    Productos incluidos ({product.kitItems.length})
                  </p>
                  <KitIngredientsList items={product.kitItems} theme="light" maxHeightClass="max-h-56" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                {isOutOfStock ? (
                  <div className="flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-extrabold uppercase tracking-wider text-red-700">
                    Producto Agotado
                  </div>
                ) : (
                  <QuantitySelector
                    quantity={quantity}
                    productName={product.name}
                    disabled={!cartReady || !product.isActive}
                    maxReached={stockCapped}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                  />
                )}
                {quantity > 1 && (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <span className="text-slate-600 font-medium">Subtotal ({quantity} {product.unit}s):</span>
                    <span>{quantity} × {formatPrice(product.price)} = <span className="font-black text-emerald-950 text-sm">{formatPrice(quantity * product.price)}</span></span>
                  </div>
                )}
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

