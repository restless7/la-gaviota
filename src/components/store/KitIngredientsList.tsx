'use client';

import type { KitItemSummary } from '@/src/actions/products';
import { CatalogImage } from './CatalogImage';

interface KitIngredientsListProps {
  items: KitItemSummary[];
  theme?: 'dark' | 'light';
  maxHeightClass?: string;
}

function formatQuantity(qty: number): string {
  return Number.isInteger(qty) ? String(qty) : qty.toFixed(1).replace(/\.0$/, '');
}

export function KitIngredientsList({
  items,
  theme = 'light',
  maxHeightClass = 'max-h-72',
}: KitIngredientsListProps) {
  if (!items || items.length === 0) return null;

  const isDark = theme === 'dark';

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto pr-1 ${maxHeightClass}`}
    >
      {items.map((item) => (
        <div
          key={`${item.productId}-${item.name}`}
          className={`flex items-center gap-2.5 rounded-xl border p-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white'
              : 'border-slate-200 bg-slate-50 text-slate-800'
          }`}
        >
          <div
            className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ${
              isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'
            }`}
          >
            {item.imageUrl ? (
              <CatalogImage
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm" aria-hidden="true">
                🥬
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {item.name}
            </p>
            <p className={`text-[11px] font-medium ${isDark ? 'text-amber-300' : 'text-emerald-700'}`}>
              {formatQuantity(item.quantity)} × {item.unit}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

