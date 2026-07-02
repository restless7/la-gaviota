'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { createOrder } from './orders';
import { Product } from './products';

export interface CheckoutItem {
  product: Product;
  quantity: number;
}

export async function submitCheckoutOrder(formData: FormData, items: CheckoutItem[], totalAmount: number) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Usuario no autenticado");
  
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const apartment = formData.get('apartment') as string;
  const neighborhood = formData.get('neighborhood') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const notes = formData.get('notes') as string;
  const paymentMethod = formData.get('paymentMethod') as string || 'bold';

  const fullAddress = `${address}${apartment ? `, ${apartment}` : ''}${neighborhood ? `, ${neighborhood}` : ''}`;

  // 1. Fetch user role to determine correct pricing
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata?.tier as string) || 'Personas Naturales';

  // 2. Fetch fresh prices and stock from the database for anti-tampering
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const productIds = items.map(item => item.product.id);
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id, name, price_retail, price_micro, price_restaurant, stock_quantity')
    .in('id', productIds);

  if (error || !dbProducts) {
    throw new Error('Error validando productos en la base de datos');
  }

  // Calculate true total
  let serverTotal = 0;
  const orderItems = items.map(clientItem => {
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

  // Calculate delivery fee logic
  let deliveryCost = 10000;
  if (serverTotal >= 50000) {
    deliveryCost = 0;
  } else {
    if (city === 'Bucaramanga') deliveryCost = 5000;
    else if (city === 'Floridablanca' || city === 'Girón') deliveryCost = 8000;
  }
  const finalServerTotal = serverTotal + deliveryCost;

  const orderData = {
    clerk_user_id: userId,
    customer_name: `${firstName} ${lastName}`,
    customer_email: email,
    customer_phone: phone,
    delivery_address: fullAddress,
    delivery_municipality: city,
    total_amount: finalServerTotal,
    status: 'Pendiente' as const,
    payment_method: paymentMethod,
    notes: notes,
  };

  const result = await createOrder(orderData, orderItems, false);
  
  return {
    success: true,
    orderId: result.orderId,
    timestamp: new Date().toISOString()
  };
  } catch (error: any) {
    console.error('[CheckoutAction] Error:', error);
    throw new Error(error.message || 'Error interno procesando la orden. Por favor intente de nuevo.');
  }
}
