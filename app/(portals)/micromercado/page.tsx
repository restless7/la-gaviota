import React from 'react';
import { fetchProducts } from '@/src/actions/products';
import { getLastOrder, getBuyingTemplates } from '@/src/actions/b2b';
import MicromercadoClient from './MicromercadoClient';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { CustomerOrderHistory } from '@/src/components/portals/CustomerOrderHistory';
import { ActiveCustomerOrderBanner } from '@/src/components/orders/ActiveCustomerOrderBanner';

export default async function MicromercadoDashboard() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  if (user?.publicMetadata?.tier !== 'Micromercados') {
    redirect('/?error=unauthorized-tier');
  }

  const products = await fetchProducts();
  const lastOrder = await getLastOrder();
  const templates = await getBuyingTemplates();

  const activeProducts = products.filter(p => p.isActive && p.stockQuantity > 0);
  const seasonalProducts = activeProducts.filter(p => p.isInSeason);
  const bulkPicks = (seasonalProducts.length >= 4 ? seasonalProducts : activeProducts).slice(0, 4);

  return (
    <div className="space-y-12">
      <ActiveCustomerOrderBanner />
      <MicromercadoClient 
        bulkPicks={bulkPicks}
        allProducts={activeProducts}
        lastOrder={lastOrder}
        templates={templates}
      />
      <div id="order-history">
        <CustomerOrderHistory />
      </div>
    </div>
  );
}
