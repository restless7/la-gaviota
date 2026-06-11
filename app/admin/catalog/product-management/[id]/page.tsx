import React from 'react';
import { fetchProducts } from '@/src/actions/products';
import ProductForm from '../ProductForm';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  // We can optimize this by creating a fetchProductById action, but since fetchProducts
  // already fetches all, we can just filter it. Or we can just fetch it directly.
  const products = await fetchProducts();
  const product = products.find(p => p.id === params.id);

  if (!product) {
    return (
      <div className="p-8 text-center text-slate-500">
        Producto no encontrado.
      </div>
    );
  }

  return <ProductForm initialData={product} />;
}
