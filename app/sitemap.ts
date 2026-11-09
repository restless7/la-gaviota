import { MetadataRoute } from 'next';
import { fetchProducts } from '@/src/actions/products';
import { BLOG_POSTS } from '@/src/data/blogPosts';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.lagaviotafruver.com';
  
  // Static Routes
  const staticRoutes = [
    '',
    '/nosotros',
    '/sobre-nosotros',
    '/contacto',
    '/comunidad',
    '/aplicar-negocio',
    '/noticias',
    '/privacidad',
    '/terminos',
    '/pqrs',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Blog Routes
  const blogRoutes = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/noticias/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
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

    return [...staticRoutes, ...blogRoutes, ...productRoutes];
  } catch (error) {
    console.error('Failed to generate sitemap for products', error);
    return [...staticRoutes, ...blogRoutes];
  }
}
