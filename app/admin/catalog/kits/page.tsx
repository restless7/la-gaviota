import React from 'react';
import KitsClient from './KitsClient';
import { fetchAdminProducts } from '@/src/actions/products';
import { fetchKits } from '@/src/actions/kits';

export default async function KitsAndPromotionsPage() {
  const [productsResult, kitsResult] = await Promise.allSettled([
    fetchAdminProducts(),
    fetchKits()
  ]);

  const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const kits = kitsResult.status === 'fulfilled' ? kitsResult.value : [];

  return (
    <KitsClient initialProducts={products} initialKits={kits} />
  );
}
