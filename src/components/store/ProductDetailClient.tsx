'use client';

import type { Product } from '@/src/actions/products';
import { useCart } from '@/src/contexts/CartContext';
import { CatalogImage } from './CatalogImage';
import { KitIngredientsList } from './KitIngredientsList';
import { QuantitySelector } from './QuantitySelector';
import { ProductCard } from './ProductCard';

export default function ProductDetailClient({ product, relatedProducts, trackInventory = false }: { product: Product; relatedProducts: Product[]; trackInventory?: boolean }) {
  const { items, addToCart, updateQuantity, cartReady } = useCart();
  const quantity = items.find(item => item.product.id === product.id)?.quantity ?? 0;
  const isOutOfStock = trackInventory && !product.isKit && product.stockQuantity <= 0;
  const isLowStock = trackInventory && !product.isKit && product.stockQuantity > 0 && product.stockQuantity <= 5;
  const stockCapped = trackInventory && !product.isKit && product.stockQuantity > 0 && quantity >= product.stockQuantity;
  const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  return <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8">
    <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
      <div className={`relative overflow-hidden rounded-3xl border border-gray-100 bg-slate-50 self-start ${product.isKit ? 'aspect-[16/9]' : 'aspect-square'}`}>
        <CatalogImage src={product.imageUrl || '/IMAGES/logo.jpeg'} alt={product.name} fill sizes="(max-width: 767px) 95vw, 550px" priority className={`object-contain p-3 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`} />
        {isOutOfStock && (
          <span className="absolute top-4 left-4 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm">
            Agotado
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-5">
        <p className="text-xs font-bold uppercase tracking-wide text-green-800">{product.category}{product.subcategory ? ` · ${product.subcategory}` : ''}</p>
        <h1 className="font-serif text-3xl font-black text-slate-800 sm:text-4xl">{product.name}</h1>
        <p className="whitespace-pre-wrap leading-relaxed text-slate-600">{product.description || 'Consulta la presentación y disponibilidad al confirmar tu pedido.'}</p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-3xl font-black text-slate-900">{money(product.price)} <span className="text-sm font-medium text-slate-600">/ {product.unit}</span></p>
          {isLowStock && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800">
              ¡Solo quedan {product.stockQuantity} unidades!
            </span>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-slate-700">Cantidad en tu carrito</p>
          {isOutOfStock ? (
            <div className="inline-flex min-h-11 items-center rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-extrabold uppercase tracking-wider text-red-700">
              Producto agotado temporalmente
            </div>
          ) : (
            <QuantitySelector
              quantity={quantity}
              productName={product.name}
              disabled={!cartReady || !product.isActive}
              maxReached={stockCapped}
              onIncrement={() => (quantity === 0 ? addToCart(product, 1) : updateQuantity(product.id, current => current + 1))}
              onDecrement={() => updateQuantity(product.id, current => current - 1)}
            />
          )}
        </div>
        {quantity > 0 && <p className="font-bold text-slate-800">Subtotal estimado: {money(product.price * quantity)}</p>}
        <p className="text-sm text-slate-500">Precio, disponibilidad y envío se confirman al finalizar. Puedes seguir comprando sin abrir el carrito.</p>
      </div>
    </div>
    {product.kitItems && product.kitItems.length > 0 && (
      <section className="rounded-3xl border border-amber-200 bg-amber-50/30 p-5 sm:p-7">
        <h2 className="mb-4 font-serif text-2xl font-black text-slate-800">
          Productos incluidos en este kit ({product.kitItems.length})
        </h2>
        <KitIngredientsList items={product.kitItems} theme="light" maxHeightClass="max-h-[420px]" />
      </section>
    )}
    {relatedProducts.length > 0 && <section className="border-t border-gray-100 pt-10"><h2 className="mb-6 font-serif text-2xl font-black text-slate-800">Productos similares</h2><div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">{relatedProducts.map(related => <ProductCard key={related.id} product={related} trackInventory={trackInventory} />)}</div></section>}
  </div>;
}
