import React from 'react';
import { redirect } from 'next/navigation';

export default async function CategoriaRedirect({ params }: { params: { slug: string } }) {
  // Extract slug from URL and ensure it's capital case if needed
  const decodedSlug = decodeURIComponent(params.slug);
  let categoryMap: Record<string, string> = {
    'frutas': 'Frutas',
    'verduras': 'Verduras Y Hortalizas',
    'carnes': 'Carnes',
  };
  
  const mappedCategory = categoryMap[decodedSlug.toLowerCase()] || decodedSlug;
  
  redirect(`/shop?category=${encodeURIComponent(mappedCategory)}`);
}
