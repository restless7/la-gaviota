import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getBlogPostBySlug,
  getAllBlogSlugs,
  getRelatedBlogPosts,
} from '@/src/data/blogPosts';
import {
  Clock,
  Calendar,
  User,
  ArrowLeft,
  ArrowRight,
  Share2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Quote,
  Building2,
  ShoppingBag,
  Package,
  MessageCircle,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Artículo No Encontrado | La Gaviota Fruver',
    };
  }

  const url = `https://www.lagaviotafruver.com/noticias/${post.slug}`;
  const imageUrl = `https://www.lagaviotafruver.com${post.heroImage.src}`;

  return {
    title: post.seoTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: url,
      siteName: 'La Gaviota Fruver',
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.heroImage.alt,
        },
      ],
      locale: 'es_CO',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedBlogPosts(post.slug, 3);

  // Structured Data (Article + Breadcrumb + FAQ if exists)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    image: `https://www.lagaviotafruver.com${post.heroImage.src}`,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'La Gaviota Fruver',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.lagaviotafruver.com/IMAGES/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.lagaviotafruver.com/noticias/${post.slug}`,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://www.lagaviotafruver.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Noticias',
        item: 'https://www.lagaviotafruver.com/noticias',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://www.lagaviotafruver.com/noticias/${post.slug}`,
      },
    ],
  };

  const faqSchema = post.faqs && post.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  const shareText = encodeURIComponent(
    `Te recomiendo este artículo de La Gaviota Fruver: ${post.title} https://www.lagaviotafruver.com/noticias/${post.slug}`
  );

  return (
    <article className="min-h-screen bg-slate-50 pb-24">
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-100 py-3.5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-xs font-semibold text-gray-500 overflow-x-auto no-scrollbar gap-2">
            <Link href="/" className="hover:text-[#E30613] transition-colors shrink-0">
              Inicio
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <Link href="/noticias" className="hover:text-[#E30613] transition-colors shrink-0">
              Noticias & Blog
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-slate-800 truncate font-bold">
              {post.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Post Header */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6">
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span
            className={`text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-sm ${
              post.categorySlug === 'restaurantes-b2b'
                ? 'bg-slate-900 text-[#FFCC00]'
                : post.categorySlug === 'tips-frescura'
                ? 'bg-[#4CAF50] text-white'
                : post.categorySlug === 'temporada-cosechas'
                ? 'bg-[#FFCC00] text-amber-950'
                : 'bg-[#E30613] text-white'
            }`}
          >
            {post.category}
          </span>
          <span className="text-xs font-bold text-gray-500 bg-slate-200/60 px-3 py-1 rounded-full">
            {post.targetAudience}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-950 font-serif tracking-tight leading-tight mb-6">
          {post.title}
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed font-normal mb-8">
          {post.excerpt}
        </p>

        {/* Author & Metadata Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm relative">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{post.author.name}</p>
              <p className="text-xs text-gray-500">{post.author.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              {post.formattedDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              {post.readTime}
            </span>
          </div>
        </div>
      </header>

      {/* Featured Hero Image */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="relative w-full aspect-video sm:aspect-[21/9] rounded-3xl overflow-hidden shadow-xl border border-gray-100">
          <Image
            src={post.heroImage.src}
            alt={post.heroImage.alt}
            fill
            priority
            className="object-cover"
          />
        </div>
        {post.heroImage.caption && (
          <p className="text-center text-xs text-gray-400 italic mt-3 font-medium">
            {post.heroImage.caption}
          </p>
        )}
      </div>

      {/* Article Content Layout: Body + Sticky Sidebar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Body */}
          <main className="lg:col-span-8">
            {/* Table of Contents Box */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-10">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                En este artículo aprenderás:
              </h2>
              <ul className="space-y-2">
                {post.sections.map((section, idx) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-sm font-semibold text-slate-700 hover:text-[#E30613] transition-colors flex items-start gap-2"
                    >
                      <span className="text-xs text-gray-400 font-bold">{idx + 1}.</span>
                      <span>{section.heading}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sections Content */}
            <div className="space-y-12">
              {post.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif mb-4 leading-snug">
                    {section.heading}
                  </h2>

                  <div className="prose prose-slate max-w-none text-gray-700 text-base leading-relaxed space-y-4 font-normal">
                    {section.content.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Bullet points if present */}
                  {section.bulletPoints && section.bulletPoints.length > 0 && (
                    <div className="my-6 bg-slate-100/70 rounded-2xl p-6 border border-gray-200">
                      <ul className="space-y-3">
                        {section.bulletPoints.map((point, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-3 text-sm text-slate-800 leading-relaxed font-medium">
                            <CheckCircle2 className="w-5 h-5 text-[#4CAF50] shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Section Aligned Image if present */}
                  {section.image && (
                    <div className="my-8">
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-md border border-gray-100">
                        <Image
                          src={section.image.src}
                          alt={section.image.alt}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {section.image.caption && (
                        <p className="text-center text-xs text-gray-400 italic mt-2.5 font-medium">
                          {section.image.caption}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Section Callout Box if present */}
                  {section.callout && (
                    <div
                      className={`my-6 rounded-2xl p-6 border-l-4 shadow-sm ${
                        section.callout.type === 'tip'
                          ? 'bg-emerald-50/70 border-l-[#4CAF50] text-emerald-950'
                          : section.callout.type === 'warning'
                          ? 'bg-amber-50/70 border-l-amber-500 text-amber-950'
                          : section.callout.type === 'quote'
                          ? 'bg-slate-100 border-l-slate-800 text-slate-900 italic'
                          : 'bg-rose-50/70 border-l-[#E30613] text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                        {section.callout.type === 'tip' && <Lightbulb className="w-4 h-4 text-[#4CAF50]" />}
                        {section.callout.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                        {section.callout.type === 'quote' && <Quote className="w-4 h-4 text-slate-700" />}
                        {section.callout.type === 'stat' && <CheckCircle2 className="w-4 h-4 text-[#E30613]" />}
                        <span>{section.callout.title}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{section.callout.text}</p>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* FAQs Accordion/List if present */}
            {post.faqs && post.faqs.length > 0 && (
              <div className="mt-14 pt-10 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="w-5 h-5 text-[#4CAF50]" />
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                    Preguntas Frecuentes Relacionadas
                  </h3>
                </div>

                <div className="space-y-4">
                  {post.faqs.map((faq, fIdx) => (
                    <div
                      key={fIdx}
                      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                    >
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-2">
                        {faq.question}
                      </h4>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In-Article Conversion Callout Box */}
            <div className="mt-14 bg-gradient-to-br from-[#E30613] to-[#c90510] text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
                <ShoppingBag className="w-64 h-64" />
              </div>

              <div className="relative z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-[#FFCC00] text-xs font-black uppercase tracking-wider mb-3 backdrop-blur-md">
                  {post.cta.badge}
                </span>

                <h3 className="text-2xl sm:text-3xl font-black font-serif mb-3 leading-snug">
                  {post.cta.title}
                </h3>

                <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
                  {post.cta.description}
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={post.cta.primaryButtonLink}
                    className="px-6 py-3.5 rounded-xl bg-[#FFCC00] hover:bg-yellow-400 text-slate-950 font-black text-sm shadow-lg transition-transform transform hover:-translate-y-0.5 inline-flex items-center gap-2"
                  >
                    {post.cta.type === 'b2b' ? <Building2 className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    {post.cta.primaryButtonText}
                  </Link>

                  {post.cta.secondaryButtonLink && (
                    <a
                      href={post.cta.secondaryButtonLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/30 transition-all inline-flex items-center gap-2 backdrop-blur-md"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-300" />
                      {post.cta.secondaryButtonText}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Tags and Share Button */}
            <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-400">Etiquetas:</span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-bold bg-white text-slate-700 border border-gray-200 px-3 py-1 rounded-lg"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <a
                href={`https://api.whatsapp.com/send?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                Compartir por WhatsApp
              </a>
            </div>
          </main>

          {/* Sticky Desktop Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Quick Purchase Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#4CAF50] mb-3">
                <Package className="w-4 h-4" />
                Despacho Express Bucaramanga
              </div>

              <h4 className="font-bold text-slate-900 text-lg mb-2">
                ¿Listo para tu mercado fresco?
              </h4>

              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Recibe cosechas frescas de Santander en la puerta de tu casa o negocio con envío gratis desde $50.000.
              </p>

              <div className="space-y-2.5">
                <Link
                  href="/#productos"
                  className="w-full bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-transform transform hover:-translate-y-0.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Ir a la Tienda
                </Link>

                <Link
                  href="/aplicar-negocio"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-[#FFCC00]" />
                  Soy un Restaurante / Negocio
                </Link>

                <a
                  href="https://wa.me/573112694676?text=Hola%20La%20Gaviota,%20quiero%20hacer%20un%20pedido%20directo%20por%20WhatsApp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  Asesor WhatsApp (+57 311 2694676)
                </a>
              </div>

              {/* Guarantees List */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-2 text-[11px] text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF50]" />
                  <span>Garantía de Frescura &quot;Sí o Sí&quot;</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF50]" />
                  <span>Pago Contra Entrega o con Wompi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF50]" />
                  <span>Corte de pedidos diarios hasta las 10:00 PM</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Related Posts Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-12 border-t border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#E30613]">
              Continúa Leyendo
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif mt-1">
              Más Guías del Campo Santandereano
            </h2>
          </div>

          <Link
            href="/noticias"
            className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#E30613] transition-colors inline-flex items-center gap-1"
          >
            Ver todas las noticias
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedPosts.map((related) => (
            <Link
              key={related.slug}
              href={`/noticias/${related.slug}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col group"
            >
              <div className="relative w-full aspect-video overflow-hidden">
                <Image
                  src={related.heroImage.src}
                  alt={related.heroImage.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {related.category}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold mb-1.5">{related.formattedDate}</p>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#4CAF50] transition-colors line-clamp-2 leading-snug mb-2">
                    {related.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {related.excerpt}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-[#E30613]">
                  <span>Leer Artículo</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
