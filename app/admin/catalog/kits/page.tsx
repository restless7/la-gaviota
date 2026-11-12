import React from 'react';
import KitsClient from './KitsClient';
import { fetchAdminProducts } from '@/src/actions/products';
import { fetchKits } from '@/src/actions/kits';
import { listKitBannerGallery } from '@/src/actions/media';

export default async function KitsAndPromotionsPage() {
  const [productsResult, kitsResult, galleryResult] = await Promise.allSettled([
    fetchAdminProducts(),
    fetchKits(),
    listKitBannerGallery(),
  ]);

  const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
  const kits = kitsResult.status === 'fulfilled' ? kitsResult.value : [];
  const bannerGallery = galleryResult.status === 'fulfilled' ? galleryResult.value : [];

  return (
    <KitsClient
      initialProducts={products}
      initialKits={kits}
      initialBannerGallery={bannerGallery}
    />
  );
}
