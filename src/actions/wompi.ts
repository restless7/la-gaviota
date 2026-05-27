'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { generateIntegritySignature, formatToCents } from '@/src/lib/wompi';
import { createOrder } from './orders';
import { CheckoutItem } from './checkoutAction';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function initializeWompiTransaction(formData: FormData, items: CheckoutItem[]) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("Usuario no autenticado");
  }

  // 1. Fetch user role to determine correct pricing
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata?.tier as string) || 'Personas Naturales';

  // 2. Fetch fresh prices and stock from the database for anti-tampering
  const productIds = items.map(item => item.product.id);
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, name, price_retail, price_micro, price_restaurant, stock_quantity')
    .in('id', productIds);

  if (error || !dbProducts) {
    throw new Error('Error validando productos en la base de datos');
  }

  // 3. Evaluate Inventory Feature Flag
  const { getInventorySettings } = await import('@/src/actions/settings');
  const { track_inventory } = await getInventorySettings();

  if (track_inventory) {
    for (const clientItem of items) {
      const dbProduct = dbProducts.find(p => p.id === clientItem.product.id);
      if (dbProduct && dbProduct.stock_quantity < clientItem.quantity) {
        throw new Error(`Stock insuficiente para ${dbProduct.name}. Disponibles: ${dbProduct.stock_quantity}`);
      }
    }
  }

  // 3. Calculate true total
  let serverTotal = 0;
  const orderItemsData = items.map(clientItem => {
    const dbProduct = dbProducts.find(p => p.id === clientItem.product.id);
    if (!dbProduct) throw new Error(`Producto ${clientItem.product.id} no encontrado`);

    let priceToUse = dbProduct.price_retail;
    if (role === 'Micromercados') priceToUse = dbProduct.price_micro;
    if (role === 'Restaurantes') priceToUse = dbProduct.price_restaurant;

    serverTotal += priceToUse * clientItem.quantity;

    return {
      product_id: dbProduct.id,
      product_name: dbProduct.name,
      quantity: clientItem.quantity,
      price_at_purchase: priceToUse,
    };
  });

  // Calculate delivery fee logic (matching frontend)
  const deliveryCost = serverTotal >= 150000 && role === 'Personas Naturales' ? 0 : 
                       (serverTotal >= 150000 ? 0 : 10000); // Generalized logic, adjust if necessary. 
  // Wait, frontend logic is: remainingForFreeShipping = max(0, 150000 - total). If 0, delivery is 0. Else 10000.
  // Actually, minOrder for Micromercados is 150000, and Restaurantes 300000, so they never pay delivery if they can checkout.
  // So if order can be placed, and total >= 150000, it's 0. Else 10000 (only possible for Personas Naturales).
  const finalServerTotal = serverTotal + (serverTotal >= 150000 ? 0 : 10000);

  // 5. Save order as Pending in Database
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const apartment = formData.get('apartment') as string;
  const neighborhood = formData.get('neighborhood') as string;
  const city = formData.get('city') as string;
  const notes = formData.get('notes') as string;

  const fullAddress = `${address}${apartment ? `, ${apartment}` : ''}${neighborhood ? `, ${neighborhood}` : ''}`;

  const orderData = {
    clerk_user_id: userId,
    customer_name: `${firstName} ${lastName}`,
    customer_email: email,
    customer_phone: phone,
    delivery_address: fullAddress,
    delivery_municipality: city,
    total_amount: finalServerTotal,
    status: 'Pendiente' as const, // Pending payment confirmation
    payment_method: 'wompi',
    notes: notes,
  };

  // We save the order to Supabase first to get the official ID
  const orderResult = await createOrder(orderData, orderItemsData);
  const reference = orderResult.orderId;
  
  const amountInCents = formatToCents(finalServerTotal);

  // 6. Generate Wompi Integrity Signature
  const signature = generateIntegritySignature(reference, amountInCents, 'COP');

  // 7. Return payload for the Widget
  return {
    publicKey: process.env.NEXT_PUBLIC_WOMPI_PUB_KEY,
    currency: 'COP',
    amountInCents,
    reference,
    signature,
    customerData: {
      email,
      fullName: `${firstName} ${lastName}`,
      phoneNumber: phone,
      phonePrefix: '+57',
    }
  };
}
