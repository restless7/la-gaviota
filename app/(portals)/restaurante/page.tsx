import React from 'react';
import { fetchProducts } from '@/src/actions/products';
import { getB2BProfile, getMonthlySpend, getBuyingTemplates } from '@/src/actions/b2b';
import RestauranteClient from './RestauranteClient';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { CustomerOrderHistory } from '@/src/components/portals/CustomerOrderHistory';

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

  // Enterprise Recommendation Engine (Simulated): Mixes frequently ordered products with new seasonal items
  const activeProducts = products.filter(p => p.isActive && p.stockQuantity > 0);
  const wholesalePicks = [...activeProducts].sort(() => 0.5 - Math.random()).slice(0, 4);

  return (
    <div className="space-y-12">
      <RestauranteClient 
        wholesalePicks={wholesalePicks}
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
