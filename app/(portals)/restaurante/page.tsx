import React from 'react';
import { fetchProducts } from '@/src/actions/products';
import { getB2BProfile, getMonthlySpend, getBuyingTemplates } from '@/src/actions/b2b';
import RestauranteClient from './RestauranteClient';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function RestauranteDashboard() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  if (user?.publicMetadata?.tier !== 'Restaurantes') {
    redirect('/shop?error=unauthorized-tier');
  }

  const products = await fetchProducts();
  
  // Fetch real B2B Data in Server Component
  const monthlySpend = await getMonthlySpend();
  const creditProfile = await getB2BProfile();
  const templates = await getBuyingTemplates();

  // Restaurante focus: All products basically, maybe prioritize Kits and veggies
  const wholesalePicks = products.slice(0, 4);

  return (
    <RestauranteClient 
      wholesalePicks={wholesalePicks}
      monthlySpend={monthlySpend}
      creditProfile={creditProfile}
      templates={templates}
    />
  );
}
