/** Pure checkout validation. Limits bound request/DB integer sizes, not purchase policy. */
export const MAX_CHECKOUT_LINES = 100;
export const MAX_ITEM_QUANTITY = 10000;
const MAX_DB_INTEGER = 2147483647;
export interface CheckoutLine { productId: string; quantity: number }
export interface CheckoutProduct {
  id: string; name: string; is_active: boolean; stock_quantity: number;
  price_retail: number; price_micro: number; price_restaurant: number;
}
export type CheckoutTier = 'Personas Naturales' | 'Micromercados' | 'Restaurantes';
export const CHECKOUT_CITIES = [
  'Bucaramanga',
  'Floridablanca',
  'Girón',
  'Piedecuesta',
  'Bogotá Norte',
  'Bogotá Sur',
] as const;

export function calculateCheckoutDeliveryCost(city: string, subtotal: number): number {
  if (subtotal >= 50000) return 0;
  if (city === 'Bucaramanga') return 5000;
  if (city === 'Floridablanca' || city === 'Girón') return 8000;
  return 10000;
}
export function normalizeCheckoutItems(input: unknown): CheckoutLine[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_CHECKOUT_LINES) throw new Error('Carrito vacío o demasiado grande');
  const quantities = new Map<string, number>();
  for (const item of input) {
    const id = item?.product?.id;
    const quantity = item?.quantity;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error('Producto inválido');
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > MAX_ITEM_QUANTITY) throw new Error('Cantidad inválida');
    const combined = (quantities.get(id) || 0) + quantity;
    if (combined > MAX_ITEM_QUANTITY) throw new Error('Cantidad demasiado grande');
    quantities.set(id, combined);
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}
function money(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_DB_INTEGER) throw new Error('Precio o total inválido');
  return value;
}
export function quoteCheckout(
  lines: CheckoutLine[],
  products: CheckoutProduct[],
  tier: CheckoutTier,
  city: string,
  trackInventory: boolean,
  discountAmount: number = 0,
  discountLabel: string = ''
) {
  if (!lines.length || typeof trackInventory !== 'boolean') throw new Error('Carrito o inventario inválido');
  const seen = new Set<string>();
  const orderItems = lines.map(line => {
    if (seen.has(line.productId) || !Number.isSafeInteger(line.quantity) || line.quantity <= 0 || line.quantity > MAX_ITEM_QUANTITY) throw new Error('Cantidad inválida');
    seen.add(line.productId);
    const matches = products.filter(product => product.id === line.productId);
    const product = matches[0];
    if (matches.length !== 1 || product.is_active !== true) throw new Error('Producto no disponible');
    if (trackInventory && (!Number.isSafeInteger(product.stock_quantity) || product.stock_quantity < line.quantity)) throw new Error(`Stock insuficiente para ${product.name}`);
    const retailPrice = money(product.price_retail);
    const rawTierPrice = tier === 'Micromercados' ? product.price_micro : tier === 'Restaurantes' ? product.price_restaurant : retailPrice;
    const price = money(typeof rawTierPrice === 'number' && rawTierPrice > 0 ? Math.round(rawTierPrice) : retailPrice);
    money(price * line.quantity);
    return { product_id: product.id, product_name: product.name, quantity: line.quantity, price_at_purchase: price };
  });
  const subtotal = money(orderItems.reduce((sum, item) => money(sum + item.quantity * item.price_at_purchase), 0));
  // Same minimums currently shown in checkout, enforced at the server boundary as well.
  if (tier === 'Micromercados' && subtotal < 150000 || tier === 'Restaurantes' && subtotal < 300000) throw new Error('No se ha alcanzado el pedido mínimo para tu perfil');
  if (!(CHECKOUT_CITIES as readonly string[]).includes(city)) throw new Error('Selecciona una ciudad disponible');
  const safeDiscount = money(Math.min(subtotal, Math.max(0, Math.round(discountAmount || 0))));
  const discountedSubtotal = money(Math.max(0, subtotal - safeDiscount));
  const deliveryCost = calculateCheckoutDeliveryCost(city, discountedSubtotal);
  return {
    orderItems,
    subtotal,
    discountAmount: safeDiscount,
    discountLabel: safeDiscount > 0 ? discountLabel : '',
    deliveryCost,
    totalAmount: money(discountedSubtotal + deliveryCost)
  };
}
export function readCheckoutDetails(formData: FormData) {
  function field(name: string, required = false, max = 256) {
    const value = formData.get(name);
    if (value === null && !required) return '';
    if (typeof value !== 'string' || value.trim().length > max || required && !value.trim()) throw new Error(`Campo inválido: ${name}`);
    return value.trim();
  }
  const firstName = field('firstName', true, 100), lastName = field('lastName', true, 100);
  const email = field('email', true), phone = field('phone', true, 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Correo inválido');
  const address = field('address', true), apartment = field('apartment'), neighborhood = field('neighborhood');
  const deliveryTimeRange = field('deliveryTimeRange', false, 120);
  const rawNotes = field('notes', false, 2000);
  const notes = deliveryTimeRange
    ? `[Franja deseada: ${deliveryTimeRange}]${rawNotes ? ` ${rawNotes}` : ''}`.slice(0, 2000)
    : rawNotes;
  return { firstName, lastName, email, phone, city: field('city', true, 100), notes,
    fullAddress: `${address}${apartment ? `, ${apartment}` : ''}${neighborhood ? `, ${neighborhood}` : ''}` };
}

export function assertExpectedCheckoutTotal(expected: unknown, actual: number): void {
  if (expected !== undefined && (!Number.isSafeInteger(expected) || expected !== actual)) throw new Error('El precio del carrito cambió. Actualiza el carrito y revisa el total antes de confirmar.');
}

/** Defense at the private writer boundary, before the first durable insert. */
export function assertOrderWrite(
  total: number,
  items: { product_id: string; quantity: number; price_at_purchase: number }[],
  discount: number = 0
) {
  money(total);
  const normalized = normalizeCheckoutItems(items.map(item => ({ product: { id: item.product_id }, quantity: item.quantity })));
  if (normalized.length !== items.length) throw new Error('Productos duplicados sin normalizar');
  const subtotal = items.reduce((sum, item) => money(sum + money(item.price_at_purchase) * item.quantity), 0);
  const safeDiscount = Math.max(0, Math.round(discount || 0));
  if (subtotal - safeDiscount > total) throw new Error('Total inconsistente');
}
