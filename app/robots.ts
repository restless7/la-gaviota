import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/*',
        '/api/*',
        '/cart',
        '/checkout',
        '/dashboard',
        '/retail',
        '/restaurante',
        '/micromercado',
        '/sign-in',
        '/sign-up',
      ],
    },
    sitemap: 'https://www.lagaviotafruver.com/sitemap.xml',
  };
}
