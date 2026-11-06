import { notFound } from 'next/navigation';
import { fetchProducts } from '@/src/actions/products';
import ProductDetailClient from '@/src/components/store/ProductDetailClient';
import { cache } from 'react';

// Prices depend on the current customer tier and must be resolved per request.
export const dynamic = 'force-dynamic';
const readCatalog = cache(fetchProducts);

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
   const { id } = await props.params;
   const products = await readCatalog();
   const product = products.find(p => p.id === id);

   if (!product) {
      return { title: 'Producto No Encontrado' };
   }

   const desc = product.description?.trim() 
     ? product.description.slice(0, 160) 
     : `Compra ${product.name} fresco a domicilio en Bucaramanga, Floridablanca y Girón. Calidad del campo santandereano para hogares y restaurantes en Surtifruver La Gaviota.`;

   return {
      title: `${product.name} Fresco a Domicilio en Bucaramanga`,
      description: desc,
      keywords: [
         `${product.name} Bucaramanga`,
         `comprar ${product.name.toLowerCase()} a domicilio`,
         `${product.name.toLowerCase()} fresco Santander`,
         `${product.category.toLowerCase()} Bucaramanga`,
         'fruver a domicilio Bucaramanga',
         'Surtifruver La Gaviota'
      ],
      alternates: { canonical: `https://www.lagaviotafruver.com/product/${encodeURIComponent(product.id)}` },
      openGraph: {
         title: `${product.name} Fresco a Domicilio | Surtifruver La Gaviota`,
         description: desc,
         images: product.imageUrl ? [product.imageUrl] : [],
      }
   };
}

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
   const { id } = await props.params;
   const products = await readCatalog();
   const product = products.find(p => p.id === id);
   
   if (!product) {
      notFound();
   }

   const relatedProducts = products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);

   const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.imageUrl || 'https://www.lagaviotafruver.com/IMAGES/logo.jpeg',
      description: product.description || `Compra ${product.name} de la mejor calidad.`,
      sku: product.id,
      brand: {
         '@type': 'Brand',
         name: 'La Gaviota Fruver'
      },
      offers: {
         '@type': 'Offer',
         url: `https://www.lagaviotafruver.com/product/${product.id}`,
         priceCurrency: 'COP',
         price: product.price,
         availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
         seller: {
            '@type': 'Organization',
            name: 'La Gaviota Fruver'
         }
      }
   };

   return (
      <>
         <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
         />
         <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      </>
   );
}
