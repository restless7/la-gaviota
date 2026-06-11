import React from 'react';
import { redirect } from 'next/navigation';

export default async function CategoriaRedirect(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const decodedSlug = decodeURIComponent(slug);
  let categoryMap: Record<string, string> = {
    'frutas': 'Frutas',
    'verduras': 'Verduras Y Hortalizas',
    'carnes': 'Carnes',
  };
  
  const mappedCategory = categoryMap[decodedSlug.toLowerCase()] || decodedSlug;
  
  redirect(`/shop?category=${encodeURIComponent(mappedCategory)}`);
}
