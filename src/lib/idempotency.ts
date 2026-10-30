import { createHash } from 'node:crypto';

export interface CanonicalCheckoutItem {
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  unit?: string;
}

export interface CanonicalCheckoutIntent {
  clerk_user_id: string;
  purchase_tier: string;
  items: CanonicalCheckoutItem[];
  delivery_address: string;
  delivery_municipality: string;
  delivery_fee?: number;
  total_amount: number;
  currency?: string;
  payment_method?: string;
}

/**
 * Normalizes checkout items:
 * - Aggregates duplicate product_ids
 * - Sorts items strictly ascending by product_id
 * - Rounds quantities and prices to canonical precision
 */
export function normalizeCheckoutItems(items: CanonicalCheckoutItem[]): CanonicalCheckoutItem[] {
  const aggregated = new Map<string, CanonicalCheckoutItem>();

  for (const item of items) {
    if (!item.product_id) continue;
    const existing = aggregated.get(item.product_id);
    if (existing) {
      existing.quantity = Math.round((existing.quantity + item.quantity) * 1000) / 1000;
    } else {
      aggregated.set(item.product_id, {
        product_id: String(item.product_id).trim(),
        quantity: Math.round(Number(item.quantity) * 1000) / 1000,
        price_at_purchase: Math.round(Number(item.price_at_purchase) * 100) / 100,
        unit: item.unit ? String(item.unit).trim().toLowerCase() : undefined,
      });
    }
  }

  return Array.from(aggregated.values()).sort((a, b) => a.product_id.localeCompare(b.product_id));
}

/**
 * Computes a deterministic SHA-256 fingerprint for a checkout intent.
 * Invariant: Reordering items produces identical fingerprint.
 * Any change to SKU, quantity, customer, address, tier, or total produces a distinct fingerprint.
 */
export function computeCheckoutFingerprint(intent: CanonicalCheckoutIntent): string {
  const normalizedItems = normalizeCheckoutItems(intent.items);

  const canonicalPayload = {
    clerk_user_id: String(intent.clerk_user_id || '').trim(),
    currency: String(intent.currency || 'COP').trim().toUpperCase(),
    delivery_address: String(intent.delivery_address || '').trim().toLowerCase(),
    delivery_fee: Math.round(Number(intent.delivery_fee || 0) * 100) / 100,
    delivery_municipality: String(intent.delivery_municipality || 'bucaramanga').trim().toLowerCase(),
    items: normalizedItems,
    payment_method: String(intent.payment_method || 'cash').trim().toLowerCase(),
    purchase_tier: String(intent.purchase_tier || 'retail').trim().toLowerCase(),
    total_amount: Math.round(Number(intent.total_amount || 0) * 100) / 100,
  };

  const canonicalJson = JSON.stringify(canonicalPayload);
  return createHash('sha256').update(canonicalJson).digest('hex');
}
