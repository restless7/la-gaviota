import 'server-only';
import { normalizeCheckoutItems, quoteCheckout, readCheckoutDetails, assertExpectedCheckoutTotal } from '@/src/lib/checkoutValidation';
import { getActor, assertIssuedActor } from './authorization';
import { getServerDatabase, readPublicInventoryFlag } from './database';

/** Validates before writes; client prices, totals, tier and ownership are never authoritative. */
export async function prepareCheckout(formData: FormData, items: unknown, expectedTotal?: number) {
  const lines = normalizeCheckoutItems(items);
  const details = readCheckoutDetails(formData);
  const actor = await getActor();
  assertIssuedActor(actor);
  const db = getServerDatabase(actor);
  const { data, error } = await db.from('products')
    .select('id,name,is_active,price_retail,price_micro,price_restaurant,stock_quantity')
    .in('id', lines.map(line => line.productId));
  if (error || !data) throw new Error('Error validando productos en la base de datos');
  const { track_inventory } = await readPublicInventoryFlag();
  const quote = quoteCheckout(lines, data, actor.tier, details.city, track_inventory);
  assertExpectedCheckoutTotal(expectedTotal, quote.totalAmount);
  return { userId: actor.userId!, details, ...quote };
}
