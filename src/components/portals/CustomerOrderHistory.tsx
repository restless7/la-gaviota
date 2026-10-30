import { getActor } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';
import React from 'react';
import { auth } from '@clerk/nextjs/server';

import { OrderHistoryClient } from './OrderHistoryClient';
import { fetchProducts } from '@/src/actions/products';


export async function CustomerOrderHistory() {
  const { userId } = await auth();
  if (!userId) return null;
  const actor = await getActor();
  const supabase = getServerDatabase(actor);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !orders) {
    return <OrderHistoryClient orders={[]} />;
  }
  
  const products = await fetchProducts();

  return <OrderHistoryClient orders={orders} catalogProducts={products} />;
}
