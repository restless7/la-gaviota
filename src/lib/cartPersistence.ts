import type { Product } from '@/src/actions/products';
export interface CartDraft { version: 2; items: { id: string; quantity: number }[] }
export function parseCartDraft(raw: string): CartDraft {
  if (raw.length > 1048576) throw new Error('CART_RESTORE_OVERSIZED');
  const value: unknown = JSON.parse(raw);
  const rows = Array.isArray(value) ? value : value && typeof value === 'object' && 'version' in value && value.version === 2 && 'items' in value ? value.items : null;
  if (!Array.isArray(rows) || rows.length > 300) throw new Error('CART_RESTORE_INVALID');
  const items: CartDraft['items'] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') throw new Error('CART_RESTORE_INVALID');
    const record = row as Record<string, unknown>;
    const product = record.product;
    const id = typeof record.id === 'string' ? record.id : product && typeof product === 'object' && 'id' in product ? product.id : null;
    const quantity = record.quantity;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id) || typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 1000000) throw new Error('CART_RESTORE_INVALID');
    if (items.some(item => item.id === id)) throw new Error('CART_RESTORE_DUPLICATE');
    items.push({ id, quantity });
  }
  return { version: 2, items };
}
export function reconcileCartDraft(draft: CartDraft, catalog: Product[], now: number) {
  const items: { product: Product; quantity: number; addedAt: number }[] = [];
  const rejected: string[] = [];
  for (const line of draft.items) {
    const product = catalog.find(p => p.id === line.id);
    if (!product || !product.isActive || !Number.isFinite(product.price) || product.price < 0) { rejected.push(line.id); continue; }
    items.push({ product, quantity: line.quantity, addedAt: now });
  }
  return { items, rejected };
}
