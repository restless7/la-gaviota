import 'server-only';
import { normalizeCheckoutItems, quoteCheckout, readCheckoutDetails, assertExpectedCheckoutTotal, type CheckoutProduct } from '@/src/lib/checkoutValidation';
import { getActor, assertIssuedActor } from './authorization';
import { getServerDatabase, getGuestCheckoutDatabase, readPublicInventoryFlag } from './database';

/** Validates before writes; client prices, totals, tier and ownership are never authoritative. */
export async function prepareCheckout(formData: FormData, items: unknown, expectedTotal?: number) {
  const lines = normalizeCheckoutItems(items);
  const details = readCheckoutDetails(formData);
  const actor = await getActor();

  if (actor.role === 'INVALID') {
    assertIssuedActor(actor);
  }

  const isGuest = actor.role === 'GUEST' || !actor.userId;
  if (!isGuest) {
    assertIssuedActor(actor);
  }

  const db = isGuest ? getGuestCheckoutDatabase() : getServerDatabase(actor);
  const lineIds = lines.map(line => line.productId);

  const { data: productsData, error } = await db.from('products')
    .select('id,name,is_active,price_retail,price_micro,price_restaurant,stock_quantity')
    .in('id', lineIds);
  if (error || !productsData) throw new Error('Error validando productos en la base de datos');

  const catalogProducts: CheckoutProduct[] = [...(productsData as CheckoutProduct[])];

  // Also check kits table if any requested line item ID was not found in products
  const foundIds = new Set(catalogProducts.map(p => p.id));
  const missingIds = lineIds.filter(id => !foundIds.has(id));
  if (missingIds.length > 0 && typeof (db as unknown as { from: (t: string) => { select?: unknown } }).from('kits')?.select === 'function') {
    const { data: kitsData } = await db.from('kits')
      .select('id,name,fixed_price,status')
      .in('id', missingIds);
    if (Array.isArray(kitsData)) {
      for (const kit of kitsData) {
        const fixedPrice = Math.round(Number(kit.fixed_price) || 0);
        catalogProducts.push({
          id: kit.id,
          name: kit.name,
          is_active: kit.status === 'active',
          stock_quantity: 999,
          price_retail: fixedPrice,
          price_micro: fixedPrice,
          price_restaurant: fixedPrice,
        });
      }
    }
  }

  const { track_inventory } = await readPublicInventoryFlag();
  const effectiveTier = isGuest ? 'Personas Naturales' : actor.tier;
  const quote = quoteCheckout(lines, catalogProducts, effectiveTier, details.city, track_inventory);
  assertExpectedCheckoutTotal(expectedTotal, quote.totalAmount);
  return { userId: actor.userId || null, tier: effectiveTier, details, ...quote };
}
