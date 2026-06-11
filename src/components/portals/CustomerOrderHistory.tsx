import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { OrderHistoryClient } from './OrderHistoryClient';
import { fetchProducts } from '@/src/actions/products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function CustomerOrderHistory() {
  const { userId } = await auth();
  if (!userId) return null;

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
