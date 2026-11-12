'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/src/contexts/CartContext';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { fetchProducts, type Product } from '@/src/actions/products';

const PREFERRED_UPSELL_IDS = ['prd_0019', 'prd_0050', 'prd_0155'] as const;

export function CheckoutUpsell() {
  const { addToCart, items } = useCart();
  const { role } = useUserRole();
  const [catalogState, setCatalogState] = useState<{ role: string; products: Product[] } | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const loading = catalogState?.role !== role;
  const catalog = React.useMemo(() => catalogState?.products ?? [], [catalogState]);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((products) => {
        if (active) setCatalogState({ role, products });
      })
      .catch((err) => {
        console.warn('[CheckoutUpsell] Failed to load live upsell products:', err);
        if (active) setCatalogState((prev) => ({ role, products: prev?.products ?? [] }));
      });
    return () => {
      active = false;
    };
  }, [role]);

  // Select live catalog products matching database prices, prioritizing staple SKUs
  const recommendations = React.useMemo(() => {
    const cartIds = new Set(items.map((i) => i.product.id));
    const available = catalog.filter(
      (p) => p.isActive && !p.isKit && p.stockQuantity > 0
    );
    const byId = new Map(available.map((p) => [p.id, p]));

    const picked: Product[] = [];
    const seen = new Set<string>();

    for (const id of PREFERRED_UPSELL_IDS) {
      const match = byId.get(id);
      if (match) {
        picked.push(match);
        seen.add(match.id);
      }
    }

    if (picked.length < 3) {
      for (const product of available) {
        if (picked.length >= 3) break;
        if (!seen.has(product.id) && !cartIds.has(product.id)) {
          picked.push(product);
          seen.add(product.id);
        }
      }
    }

    return picked;
  }, [catalog, items]);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p);

  const getQty = (id: string) => quantities[id] || 1;
  const changeQty = (id: string, delta: number, maxStock: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.min(Math.max(1, maxStock), Math.max(1, (prev[id] || 1) + delta)),
    }));
  };

  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-50 border border-gray-200 rounded-[1.5rem] p-5 mt-8 overflow-hidden shadow-sm relative">
      <h3 className="text-center font-black text-[#83b745] text-[15px] mb-6 flex justify-center items-center gap-2">
        ¡Que no se le olvide pa&apos; que no l@ regañen en la casa! <span className="text-xl">🏠</span>
      </h3>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="h-[74px] rounded-xl bg-white border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 relative z-10">
          {recommendations.map((rec, index) => {
            const inCart = items.find(i => i.product.id === rec.id);
            const qty = getQty(rec.id);
            return (
              <div key={rec.id} className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3 items-center relative">
                {index === 0 && (
                  <span className="absolute -top-2 left-2 bg-[#83b745] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 uppercase tracking-widest shadow-sm">
                    ⭐ Recomendado!
                  </span>
                )}
                <div className="w-14 h-14 bg-slate-50 rounded-lg overflow-hidden relative shrink-0 border border-gray-100">
                  <Image src={rec.imageUrl || '/IMAGES/product-display.jpeg'} alt={rec.name} fill sizes="56px" unoptimized className="object-contain p-1" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="font-extrabold text-[13px] text-slate-800 leading-tight truncate">{rec.name}</h4>
                  <p className="text-[11px] font-bold text-slate-700 mt-0.5">{formatPrice(rec.price)} <span className="text-gray-400 font-medium">/ {rec.unit}</span></p>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 border border-gray-200 p-1 rounded-lg shrink-0">
                  <button
                    type="button"
                    aria-label={`Menos ${rec.name}`}
                    onClick={() => changeQty(rec.id, -1, rec.stockQuantity)}
                    className="text-xs w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:bg-gray-200 rounded"
                  >
                    -
                  </button>
                  <span className="text-[11px] w-4 text-center font-black text-slate-800">{qty}</span>
                  <button
                    type="button"
                    aria-label={`Más ${rec.name}`}
                    onClick={() => changeQty(rec.id, 1, rec.stockQuantity)}
                    className="text-xs w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:bg-gray-200 rounded"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(rec, qty)}
                  className="bg-[#83b745] hover:bg-[#6c9c36] text-white rounded-md text-[10px] font-black px-3 py-2 uppercase tracking-wide shrink-0 transition-colors shadow-sm"
                >
                  {inCart ? `+${qty} (${inCart.quantity})` : 'Agregar'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
