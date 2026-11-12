'use client';

import type { Product } from '@/src/actions/products';
import { useCart } from '@/src/contexts/CartContext';
import { CatalogImage } from './CatalogImage';
import { KitIngredientsList } from './KitIngredientsList';
import { QuantitySelector } from './QuantitySelector';
import { ProductCard } from './ProductCard';

export default function ProductDetailClient({ product, relatedProducts }: { product: Product; relatedProducts: Product[] }) {
  const { items, addToCart, updateQuantity, cartReady } = useCart();
  const quantity = items.find(item => item.product.id === product.id)?.quantity ?? 0;
  const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  return <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8">
    <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
      <div className={`relative overflow-hidden rounded-3xl border border-gray-100 bg-slate-50 self-start ${product.isKit ? 'aspect-[16/9]' : 'aspect-square'}`}><CatalogImage src={product.imageUrl || '/IMAGES/logo.jpeg'} alt={product.name} fill sizes="(max-width: 767px) 95vw, 550px" priority className="object-contain p-3" /></div>
      <div className="flex min-w-0 flex-col justify-center gap-5">
        <p className="text-xs font-bold uppercase tracking-wide text-green-800">{product.category}{product.subcategory ? ` · ${product.subcategory}` : ''}</p>
        <h1 className="font-serif text-3xl font-black text-slate-800 sm:text-4xl">{product.name}</h1>
        <p className="whitespace-pre-wrap leading-relaxed text-slate-600">{product.description || 'Consulta la presentación y disponibilidad al confirmar tu pedido.'}</p>
        <p className="text-3xl font-black text-slate-900">{money(product.price)} <span className="text-sm font-medium text-slate-600">/ {product.unit}</span></p>
        <div>
          <p className="mb-2 text-sm font-bold text-slate-700">Cantidad en tu carrito</p>
          <QuantitySelector
            quantity={quantity}
            productName={product.name}
            disabled={!cartReady || !product.isActive}
            onIncrement={() => (quantity === 0 ? addToCart(product, 1) : updateQuantity(product.id, current => current + 1))}
            onDecrement={() => updateQuantity(product.id, current => current - 1)}
          />
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
    {relatedProducts.length > 0 && <section className="border-t border-gray-100 pt-10"><h2 className="mb-6 font-serif text-2xl font-black text-slate-800">Productos similares</h2><div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">{relatedProducts.map(related => <ProductCard key={related.id} product={related} />)}</div></section>}
  </div>;
}
