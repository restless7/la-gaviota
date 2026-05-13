import React from 'react';
import KitsClient from './KitsClient';
import { fetchProducts } from '@/src/actions/products';

export default async function KitsAndPromotionsPage() {
  const products = await fetchProducts();
  
  return (
    <KitsClient initialProducts={products} />
  );
}
