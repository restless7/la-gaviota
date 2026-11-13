import 'server-only';
import { normalizeCheckoutItems, quoteCheckout, readCheckoutDetails, assertExpectedCheckoutTotal, type CheckoutProduct } from '@/src/lib/checkoutValidation';
import { getActor, assertIssuedActor } from './authorization';
import { getServerDatabase, getGuestCheckoutDatabase, readPublicInventoryFlag } from './database';
import { CHRISTMAS_CUSHIONS } from '@/src/data/christmasProducts';
import { getActivePromotion, calculateDiscount } from './promotions';

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

  // Also check Christmas / Miscelánea catalogue if any requested line item ID is still missing
  const stillFoundIds = new Set(catalogProducts.map(p => p.id));
  const stillMissing = lineIds.filter(id => !stillFoundIds.has(id));
  if (stillMissing.length > 0) {
    for (const id of stillMissing) {
      const navItem = CHRISTMAS_CUSHIONS.find(c => c.id === id);
      if (navItem) {
        catalogProducts.push({
          id: navItem.id,
          name: navItem.name,
          is_active: navItem.isActive,
          stock_quantity: navItem.stockQuantity,
          price_retail: navItem.price,
          price_micro: navItem.price,
          price_restaurant: navItem.price,
        });
      }
    }
  }

  const { track_inventory } = await readPublicInventoryFlag();
  const effectiveTier = isGuest ? 'Personas Naturales' : actor.tier;

  // Authoritative server-side subtotal evaluation for promotional discounts
  const rawSubtotal = lines.reduce((acc, line) => {
    const prod = catalogProducts.find(p => p.id === line.productId);
    if (!prod) return acc;
    const price = effectiveTier === 'Micromercados' ? prod.price_micro : effectiveTier === 'Restaurantes' ? prod.price_restaurant : prod.price_retail;
    return acc + (Number(price) || 0) * line.quantity;
  }, 0);

  const activePromo = await getActivePromotion();
  const discountCalc = calculateDiscount(rawSubtotal, effectiveTier, activePromo);

  const quote = quoteCheckout(
    lines,
    catalogProducts,
    effectiveTier,
    details.city,
    track_inventory,
    discountCalc.discountAmount,
    discountCalc.discountLabel
  );

  assertExpectedCheckoutTotal(expectedTotal, quote.totalAmount);
  return { userId: actor.userId || null, tier: effectiveTier, details, ...quote };
}
