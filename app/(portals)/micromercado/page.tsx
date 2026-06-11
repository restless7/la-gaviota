import React from 'react';
import { fetchProducts } from '@/src/actions/products';
import { getLastOrder, getB2BOrders } from '@/src/actions/b2b';
import MicromercadoClient from './MicromercadoClient';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function MicromercadoDashboard() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  if (user?.publicMetadata?.tier !== 'Micromercados') {
    redirect('/shop?error=unauthorized-tier');
  }

  const products = await fetchProducts();
  const lastOrder = await getLastOrder();
  const allOrders = await getB2BOrders();

  // Micromercado: Focus on essential vegetables and kits for resale
  const bulkPicks = products.filter(p => p.category === 'Verduras Y Hortalizas' || p.category === 'Kits Negocios').slice(0, 4);

  return (
    <MicromercadoClient 
      bulkPicks={bulkPicks}
      lastOrder={lastOrder}
      allOrders={allOrders}
    />
  );
}
