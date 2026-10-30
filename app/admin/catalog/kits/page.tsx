import React from 'react';
import KitsClient from './KitsClient';
import { fetchAdminProducts } from '@/src/actions/products';

export default async function KitsAndPromotionsPage() {
  const products = await fetchAdminProducts();
  
  return (
    <KitsClient initialProducts={products} />
  );
}
