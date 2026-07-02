import { notFound } from 'next/navigation';
import { fetchProducts } from '@/src/actions/products';
import ProductDetailClient from '@/src/components/store/ProductDetailClient';

export async function generateStaticParams() {
   const products = await fetchProducts();
   return products.map((product) => ({
      id: product.id,
   }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
   const { id } = await props.params;
   const products = await fetchProducts();
   const product = products.find(p => p.id === id);

   if (!product) {
      return { title: 'Producto No Encontrado' };
   }

   const desc = product.description?.trim() 
     ? product.description.slice(0, 150) 
     : `Compra ${product.name} de la mejor calidad. Descuentos para restaurantes en Bucaramanga y Floridablanca.`;

   return {
      title: `${product.name} Fresco a Domicilio en Bucaramanga`,
      description: desc,
      openGraph: {
         title: `${product.name} | La Gaviota Fruver`,
         description: desc,
         images: product.imageUrl ? [product.imageUrl] : [],
      }
   };
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
         price: product.priceRetail,
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
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
         />
         <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      </>
   );
}
