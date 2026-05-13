import React from 'react';
import InventoryClient from './InventoryClient';
import { fetchProducts } from '@/src/actions/products';

export default async function InventoryPage() {
  const products = await fetchProducts();
  
  return (
    <InventoryClient initialProducts={products} />
  );
}
