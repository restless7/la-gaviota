import React from 'react';
import type { Metadata } from 'next';
import { BLOG_POSTS } from '@/src/data/blogPosts';
import NoticiasClient from './NoticiasClient';

export const metadata: Metadata = {
  title: 'Noticias y Blog Fruver Bucaramanga | Frutas y Verduras Frescas',
  description:
    'Consejos de expertos para comprar verduras y frutas frescas en Bucaramanga, Floridablanca y Girón. Guías de ahorro familiar, cosechas de Santander y proveedores B2B para restaurantes.',
  keywords: [
    'Noticias La Gaviota',
    'Fruver Bucaramanga blog',
    'frutas y verduras Bucaramanga',
    'verduras frescas a domicilio',
    'ahorro mercado familiar Santander',
    'proveedor mayorista restaurantes Bucaramanga',
    'Plaza San Francisco Bucaramanga',
  ],
  alternates: {
    canonical: 'https://www.lagaviotafruver.com/noticias',
  },
  openGraph: {
    title: 'Noticias y Blog Fruver Bucaramanga | La Gaviota',
    description:
      'Guías de compra, ahorro familiar y abastecimiento para restaurantes en Bucaramanga y Santander.',
    url: 'https://www.lagaviotafruver.com/noticias',
    siteName: 'La Gaviota Fruver',
    images: [
      {
        url: 'https://www.lagaviotafruver.com/IMAGES/product-display.jpeg',
        width: 1200,
        height: 630,
        alt: 'Noticias y Guías Fruver La Gaviota Bucaramanga',
      },
    ],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noticias y Blog Fruver Bucaramanga | La Gaviota',
    description:
      'Guías de frescura, temporadas de cosecha campesina y ahorro en mercado para Bucaramanga y Floridablanca.',
    images: ['https://www.lagaviotafruver.com/IMAGES/product-display.jpeg'],
  },
};

export default function NoticiasPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog y Noticias La Gaviota Fruver',
    description:
      'Artículos, guías y actualidad sobre el abastecimiento de frutas y verduras frescas en Bucaramanga y Santander.',
    url: 'https://www.lagaviotafruver.com/noticias',
    publisher: {
      '@type': 'Organization',
      name: 'La Gaviota Fruver',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.lagaviotafruver.com/IMAGES/logo.png',
      },
    },
    blogPost: BLOG_POSTS.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url: `https://www.lagaviotafruver.com/noticias/${post.slug}`,
      datePublished: post.publishedAt,
      author: {
        '@type': 'Person',
        name: post.author.name,
      },
      image: `https://www.lagaviotafruver.com${post.heroImage.src}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NoticiasClient posts={BLOG_POSTS} />
    </>
  );
}
