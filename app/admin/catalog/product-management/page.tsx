import React from 'react';
import InventoryClient from './InventoryClient';
import { fetchAdminProducts } from '@/src/actions/products';
import { getInventorySettings } from '@/src/actions/settings';

export default async function InventoryPage() {
  const products = await fetchAdminProducts();
  const { track_inventory } = await getInventorySettings();
  
  return (
    <InventoryClient initialProducts={products} trackInventory={track_inventory} />
  );
}
