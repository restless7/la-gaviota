import { MetadataRoute } from 'next';
import { fetchProducts } from '@/src/actions/products';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.lagaviotafruver.com';
  
  // Static Routes
  const routes = [
    '',
    '/shop',
    '/cart',
    '/checkout',
    '/nosotros',
    '/contacto',
    '/comunidad',
    '/aplicar-negocio',
    '/restaurante',
    '/micromercado',
    '/retail',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Product Routes
  try {
    const products = await fetchProducts();
    const productRoutes = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date().toISOString(), // In a real app, use product updated_at
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...routes, ...productRoutes];
  } catch (error) {
    console.error('Failed to generate sitemap for products', error);
    return routes;
  }
}
