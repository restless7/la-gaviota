"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '@/src/data/blogPosts';
import { Search, Clock, ArrowRight, Sparkles, Building2, ShoppingBag, MessageCircle, CheckCircle, Tag } from 'lucide-react';

interface NoticiasClientProps {
  posts: BlogPost[];
}

const CATEGORIES = [
  'Todos',
  'Hogar & Ahorro',
  'Restaurantes & B2B',
  'Temporada & Cosechas',
  'Tips de Frescura',
] as const;

export default function NoticiasClient({ posts }: NoticiasClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subscribedEmail, setSubscribedEmail] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  // Filter posts based on category and search query
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'Todos' || post.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const featuredPost = posts[0];
  const gridPosts = selectedCategory === 'Todos' && !searchQuery.trim() 
    ? filteredPosts.slice(1) 
    : filteredPosts;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribedEmail || !subscribedEmail.includes('@')) return;
    setIsSubscribed(true);
    setTimeout(() => {
      setSubscribedEmail('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Hero Banner */}
      <div className="relative w-full h-[400px] md:h-[460px] overflow-hidden">
        <Image
          src="/IMAGES/product-display.jpeg"
          alt="Noticias y Actualidad La Gaviota Fruver Bucaramanga"
          fill
          priority
          className="object-cover brightness-[0.45]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4CAF50]/20 border border-[#4CAF50]/40 text-[#4CAF50] text-xs sm:text-sm font-bold uppercase tracking-wider backdrop-blur-md mb-4">
            <Sparkles className="w-4 h-4 text-[#FFCC00]" />
            Plaza San Francisco • Cosechas de Santander
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white font-serif tracking-tight drop-shadow-lg max-w-4xl mb-4 leading-tight">
            Noticias & Guías de Frescura en Bucaramanga
          </h1>
          
          <p className="text-white/90 text-base sm:text-lg md:text-xl font-medium max-w-2xl mb-8 leading-relaxed">
            Consejos de ahorro para el hogar, temporadas de cosecha campesina y soluciones mayoristas para restaurantes en el área metropolitana.
          </p>

          {/* Search bar inside hero */}
          <div className="w-full max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por tema (ej. aguacate, restaurantes, ahorro, conservación)..."
              className="w-full bg-white/95 backdrop-blur-md text-slate-800 placeholder-gray-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm md:text-base font-medium shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-100 px-2 py-1 rounded-md"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 w-full h-8 bg-slate-50 rounded-t-[2.5rem]" />
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-2 no-scrollbar border-b border-gray-200">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#E30613] text-white shadow-md shadow-red-500/20 scale-105'
                    : 'bg-white text-slate-600 border border-gray-200 hover:border-gray-300 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Featured Post Card (Visible on "Todos" without active search) */}
        {selectedCategory === 'Todos' && !searchQuery.trim() && featuredPost && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E30613] animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Artículo Destacado de la Semana
              </h2>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 grid grid-cols-1 lg:grid-cols-12 group">
              <div className="lg:col-span-7 relative min-h-[300px] lg:min-h-[420px] overflow-hidden">
                <Image
                  src={featuredPost.heroImage.src}
                  alt={featuredPost.heroImage.alt}
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-[#E30613] text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg">
                  {featuredPost.category}
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-bold mb-3">
                    <span>{featuredPost.formattedDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <Link href={`/noticias/${featuredPost.slug}`}>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-[#4CAF50] transition-colors leading-tight mb-4">
                      {featuredPost.title}
                    </h3>
                  </Link>

                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredPost.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-gray-200 relative">
                      <Image
                        src={featuredPost.author.avatar}
                        alt={featuredPost.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{featuredPost.author.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{featuredPost.author.role}</p>
                    </div>
                  </div>

                  <Link
                    href={`/noticias/${featuredPost.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#E30613] hover:text-[#c90510] group-hover:translate-x-1 transition-all"
                  >
                    Leer Artículo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Heading for Grid */}
        <div className="mt-12 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
              {selectedCategory === 'Todos' ? 'Todas las Publicaciones' : selectedCategory}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'artículo disponible' : 'artículos disponibles'}
            </p>
          </div>

          {searchQuery && (
            <p className="text-xs font-medium text-slate-500 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full inline-block">
              Filtrando por: &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Article Grid */}
        {gridPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 my-8">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">No se encontraron artículos</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              No hay publicaciones que coincidan con tus criterios de búsqueda. Intenta con otros términos o cambia de categoría.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#4CAF50] text-white font-bold text-sm shadow hover:bg-emerald-600 transition-colors"
            >
              Ver todas las noticias
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
              >
                <div className="relative w-full aspect-video overflow-hidden">
                  <Image
                    src={post.heroImage.src}
                    alt={post.heroImage.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div
                    className={`absolute top-4 left-4 text-xs font-black px-3 py-1 rounded-full shadow-lg ${
                      post.categorySlug === 'restaurantes-b2b'
                        ? 'bg-[#1e293b] text-[#FFCC00]'
                        : post.categorySlug === 'tips-frescura'
                        ? 'bg-[#4CAF50] text-white'
                        : post.categorySlug === 'temporada-cosechas'
                        ? 'bg-[#FFCC00] text-amber-950'
                        : 'bg-[#E30613] text-white'
                    }`}
                  >
                    {post.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-2.5">
                      <span>{post.formattedDate}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>

                    <Link href={`/noticias/${post.slug}`}>
                      <h3 className="font-bold text-slate-800 text-lg sm:text-xl mb-3 leading-snug group-hover:text-[#4CAF50] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-500 font-medium">
                        Por <strong className="text-slate-700">{post.author.name}</strong>
                      </span>
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                        {post.targetAudience}
                      </span>
                    </div>

                    <Link
                      href={`/noticias/${post.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider py-2.5 rounded-xl bg-slate-50 group-hover:bg-[#E30613] text-slate-700 group-hover:text-white transition-all duration-300"
                    >
                      Leer Más
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* High Conversion Banner: B2B for Restaurants & Businesses */}
        <div className="mt-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-700">
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#E30613]/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-[#4CAF50]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-400/30">
                <Building2 className="w-4 h-4" />
                Para Restaurantes, Hoteles & Cafeterías
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-serif tracking-tight mb-4">
                ¿Administras una cocina o restaurante en Bucaramanga?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl">
                Accede a nuestra lista mayorista exclusiva: entregas garantizadas antes de las 9:00 AM, factura electrónica DIAN, calibres estandarizados y crédito rotativo a 8 y 15 días.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Link
                  href="/aplicar-negocio"
                  className="px-6 py-3.5 rounded-xl bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] font-black text-sm shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 inline-flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Solicitar Tarifa Mayorista
                </Link>
                <a
                  href="https://wa.me/573112694676?text=Hola,%20tengo%20un%20restaurante%20en%20Bucaramanga%20y%20quiero%20cotizar%20precios%20B2B"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all inline-flex items-center gap-2 backdrop-blur-md"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Hablar con Asesor B2B
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <h4 className="text-base font-bold text-white mb-3">Beneficios Comprobados:</h4>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4CAF50] shrink-0" />
                  <span>Hasta 28% de ahorro en Food Cost</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4CAF50] shrink-0" />
                  <span>Cero merma por maduración descontrolada</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4CAF50] shrink-0" />
                  <span>Rutas prioritarias en Cabecera y Cañaveral</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4CAF50] shrink-0" />
                  <span>Soporte 24/7 de reposición inmediata</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter & WhatsApp VIP Deals */}
        <div className="mt-12 bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <span className="text-xs font-black uppercase tracking-wider text-[#4CAF50]">
              Club de Frescura & Precios
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif mt-1 mb-3">
              Recibe la lista de cosechas y ofertas de temporada
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
              Te avisamos cuando bajen los precios del aguacate, cítricos o papa en la Plaza San Francisco y cuando tengamos promociones especiales del Kit Chévere. Cero spam, pura frescura.
            </p>
          </div>

          <div className="md:col-span-5">
            {isSubscribed ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-sm">¡Bienvenido al Club de Frescura!</h4>
                <p className="text-xs text-emerald-600 mt-1">
                  Te mantendremos al tanto de las mejores cosechas campesinas.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={subscribedEmail}
                    onChange={(e) => setSubscribedEmail(e.target.value)}
                    placeholder="Tu correo electrónico..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#4CAF50] hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Unirme al Club de Ahorro
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
