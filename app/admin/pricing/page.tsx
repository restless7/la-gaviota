import React from 'react';
import PricingClient from './PricingClient';
import { fetchAdminProducts } from '@/src/actions/products';

export default async function PricingPage() {
  const products = await fetchAdminProducts();
  
  return (
    <PricingClient initialProducts={products} />
  );
}
