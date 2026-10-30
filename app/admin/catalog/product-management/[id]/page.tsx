export const dynamic = 'force-dynamic';

import React from 'react';
import { fetchAdminProducts } from '@/src/actions/products';
import ProductForm from '../ProductForm';

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const decodedId = decodeURIComponent(id || '').trim();
  const products = await fetchAdminProducts();
  const product = products.find(p => String(p.id).trim() === decodedId);

  if (!product) {
    return (
      <div className="p-8 text-center text-slate-500">
        Producto no encontrado. ID buscado: {decodedId}
      </div>
    );
  }

  return <ProductForm initialData={product} />;
}
