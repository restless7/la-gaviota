import React from 'react';
import { fetchProducts } from '@/src/actions/products';
import { getB2BProfile, getMonthlySpend, getBuyingTemplates } from '@/src/actions/b2b';
import RestauranteClient from './RestauranteClient';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { CustomerOrderHistory } from '@/src/components/portals/CustomerOrderHistory';
import { ActiveCustomerOrderBanner } from '@/src/components/orders/ActiveCustomerOrderBanner';

export default async function RestauranteDashboard() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  if (user?.publicMetadata?.tier !== 'Restaurantes') {
    redirect('/?error=unauthorized-tier');
  }

  const products = await fetchProducts();
  
  // Fetch real B2B Data in Server Component
  const monthlySpend = await getMonthlySpend();
  const creditProfile = await getB2BProfile();
  const templates = await getBuyingTemplates();

  const activeProducts = products.filter(p => p.isActive && p.stockQuantity > 0);
  const seasonalProducts = activeProducts.filter(p => p.isInSeason);
  const wholesalePicks = (seasonalProducts.length >= 4 ? seasonalProducts : activeProducts).slice(0, 4);

  return (
    <div className="space-y-12">
      <ActiveCustomerOrderBanner />
      <RestauranteClient 
        wholesalePicks={wholesalePicks}
        allProducts={activeProducts}
        monthlySpend={monthlySpend}
        creditProfile={creditProfile}
        templates={templates}
      />
      <div id="order-history">
        <CustomerOrderHistory />
      </div>
    </div>
  );
}
