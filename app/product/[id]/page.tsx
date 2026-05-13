import { notFound } from 'next/navigation';
import { fetchProducts } from '@/src/actions/products';
import ProductDetailClient from '@/src/components/store/ProductDetailClient';

export async function generateStaticParams() {
   const products = await fetchProducts();
   return products.map((product) => ({
      id: product.id,
   }));
}

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
   const { id } = await props.params;
   const products = await fetchProducts();
   const product = products.find(p => p.id === id);
   
   if (!product) {
      notFound();
   }

   const relatedProducts = products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);

   return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
