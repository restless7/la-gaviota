import React from 'react';
import PricingClient from './PricingClient';
import { fetchProducts } from '@/src/actions/products';

export default async function PricingPage() {
  const products = await fetchProducts();
  
  return (
    <PricingClient initialProducts={products} />
  );
}
