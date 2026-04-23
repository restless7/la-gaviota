import { notFound } from 'next/navigation';
import { getProductBySlug, products } from '@/src/data/products';
import ProductDetailClient from '@/src/components/store/ProductDetailClient';

export async function generateStaticParams() {
   return products.map((product) => ({
      slug: product.slug,
   }));
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
   const { slug } = await props.params;
   const product = getProductBySlug(slug);
   
   if (!product) {
      notFound();
   }

   const relatedProducts = products
      .filter(p => p.category === product.category && p.slug !== product.slug)
      .slice(0, 4);

   return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
