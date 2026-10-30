import { MetadataRoute } from 'next';
import { fetchProducts } from '@/src/actions/products';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.lagaviotafruver.com';
  
  // Static Routes
  const routes = [
    '',
    '/nosotros',
    '/sobre-nosotros',
    '/contacto',
    '/comunidad',
    '/aplicar-negocio',
    '/privacidad',
    '/terminos',
    '/pqrs',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Product Routes
  try {
    const products = await fetchProducts();
    const activeProducts = products.filter(p => p.isActive);
    const productRoutes = activeProducts.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...routes, ...productRoutes];
  } catch (error) {
    console.error('Failed to generate sitemap for products', error);
    return routes;
  }
}
