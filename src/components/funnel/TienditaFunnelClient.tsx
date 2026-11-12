'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Sparkles, 
  Check, 
  Truck, 
  ShieldCheck, 
  Star, 
  Gift, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  PhoneCall, 
  Layers
} from 'lucide-react';
import { CHRISTMAS_CUSHIONS, type ChristmasProduct } from '@/src/data/christmasProducts';
import { useCart } from '@/src/contexts/CartContext';

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function TienditaFunnelClient() {
  const [selectedCushion, setSelectedCushion] = useState<ChristmasProduct>(CHRISTMAS_CUSHIONS[0]);
  const [selectedTheme, setSelectedTheme] = useState<string>('todos');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const { addToCart, setIsCartOpen, items } = useCart();
  const router = useRouter();

  const filteredCushions = selectedTheme === 'todos'
    ? CHRISTMAS_CUSHIONS.filter(c => c.id !== 'prd_nav_combo4')
    : CHRISTMAS_CUSHIONS.filter(c => c.theme === selectedTheme && c.id !== 'prd_nav_combo4');

  const comboProduct = CHRISTMAS_CUSHIONS.find(c => c.id === 'prd_nav_combo4') || CHRISTMAS_CUSHIONS[0];

  const handleAddToCart = (product: ChristmasProduct, qty = 1, openMiniCart = false) => {
    addToCart(product, qty);
    setAddedToast(`¡${product.name} añadido a tu carrito!`);
    setTimeout(() => setAddedToast(null), 3000);
    if (openMiniCart) {
      setIsCartOpen(true);
    }
  };

  const handleBuyNow = (product: ChristmasProduct, qty = 1) => {
    addToCart(product, qty);
    router.push('/checkout');
  };

  const totalCushionsInCart = items
    .filter(i => i.product.id.startsWith('prd_nav_'))
    .reduce((sum, i) => sum + i.quantity, 0);

  const faqs = [
    {
      q: '¿Cuáles son las medidas y especificaciones de los cojines?',
      a: 'Cada cojín mide 45 cm x 45 cm. Están confeccionados en microfibra velvet tipo piel de durazno ultra suave, con relleno de fibra siliconada 100% virgen antialérgica y cremallera invisible para desenfundar fácilmente.',
    },
    {
      q: '¿Cómo se pueden lavar sin que pierdan color?',
      a: 'La funda es completamente desmontable. Puedes lavarla a mano o en lavadora en ciclo suave con agua fría. El estampado de alta definición no decolora ni se desgasta con las lavadas.',
    },
    {
      q: '¿Cuánto tiempo tarda la entrega en Bucaramanga y su Área Metropolitana?',
      a: 'Entregamos el mismo día o al día siguiente hábil en Bucaramanga, Floridablanca, Girón y Piedecuesta. También realizamos envíos seguros a Bogotá Norte y Bogotá Sur.',
    },
    {
      q: '¿Puedo pagar contra entrega en efectivo o tarjeta?',
      a: '¡Sí! Al momento de finalizar tu pedido puedes elegir Pago Contra Entrega en efectivo al recibir, o pagar en línea con tarjeta de crédito, débito, PSE y Nequi a través de Wompi.',
    },
    {
      q: '¿Puedo combinar mi compra con frutas, verduras o kits de la tienda?',
      a: 'Totalmente. Al agregar tus cojines a la canasta, puedes seguir mercando tus frutas y verduras frescas habituales; todo viajará en un solo domicilio consolidado.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf7] text-slate-900 selection:bg-emerald-600 selection:text-white">
      
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-24 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 font-bold text-xs sm:text-sm border border-emerald-400">
          <Check size={18} />
          <span>{addedToast}</span>
        </div>
      )}

      {/* Top Holiday Ribbon */}
      <div className="bg-gradient-to-r from-red-600 via-emerald-600 to-red-600 text-white py-2 px-4 text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
        <span>🎄 EDICIÓN ESPECIAL NAVIDAD 2026</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">¡ENVÍO GRATIS EN BUCARAMANGA POR COMPRAS DESDE $50.000!</span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-100/60 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-emerald-100/60 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumb / Category Tag */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Link href="/" className="hover:text-red-700 transition-colors">Tienda</Link>
              <span>/</span>
              <span className="text-emerald-800 font-bold">Miscelánea</span>
              <span>/</span>
              <span className="text-slate-900 font-extrabold">La Tiendita Navideña</span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-900">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Edición Limitada · Temporada 2026</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Copy & Funnel Value Props */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-amber-900">
                <Sparkles size={14} className="text-amber-600" />
                <span>Colección Exclusiva de Temporada</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-serif text-slate-900 leading-tight">
                Viste tu sala de magia <br className="hidden sm:inline" />
                <span className="text-red-600">
                  esta Navidad 🎄✨
                </span>
              </h1>

              <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Cojines decorativos premium con ilustración en alta definición, tacto terciopelo y relleno siliconado ultrasuave. Llena tu hogar de calidez santandereana durante las novenas.
              </p>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
                  <Star size={15} className="text-amber-500 fill-amber-500" />
                  <span>4.9 / 5 Calidad Garantizada</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
                  <Truck size={15} className="text-emerald-600" />
                  <span>Entrega Rápida 24h</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
                  <ShieldCheck size={15} className="text-blue-600" />
                  <span>Pago Contra Entrega</span>
                </div>
              </div>

              {/* Pricing Cards Mini-Funnel */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* Single Unit Option */}
                <div className="p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">1 Cojín Individual</span>
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        20% OFF
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-slate-900">{formatCOP(40000)}</span>
                      <span className="text-xs text-slate-400 line-through">{formatCOP(50000)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">45x45 cm · Relleno siliconado incluido</p>
                  </div>
                  <button
                    onClick={() => handleAddToCart(selectedCushion, 1, true)}
                    className="mt-4 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShoppingBag size={14} /> Añadir 1 Cojín ($40.000)
                  </button>
                </div>

                {/* Best Value 4-Pack Combo */}
                <div className="p-5 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/60 relative overflow-hidden flex flex-col justify-between shadow-md">
                  <div className="absolute top-2 right-2 bg-red-600 text-white font-black text-[9px] uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
                    Mejor Ahorro 🔥 30% OFF
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">Set Familiar x4 Cojines</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-emerald-800">{formatCOP(139900)}</span>
                      <span className="text-xs text-slate-400 line-through">{formatCOP(200000)}</span>
                    </div>
                    <p className="text-xs text-emerald-700 font-extrabold mt-1">
                      ✨ Ahorras $60.100 + Domicilio GRATIS
                    </p>
                  </div>
                  <button
                    onClick={() => handleBuyNow(comboProduct, 1)}
                    className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Gift size={14} /> Comprar Set x4 Ahora
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Featured Interactive Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xl">
                {/* Design Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-red-100 border border-red-300 text-red-800 px-3 py-1 text-xs font-black uppercase tracking-wider">
                    {selectedCushion.badge || 'Diseño Más Querido'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Ref: {selectedCushion.id}
                  </span>
                </div>

                {/* Main Product Showcase Image */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group">
                  <Image
                    src={selectedCushion.imageUrl || '/IMAGES/mascota.jpeg'}
                    alt={selectedCushion.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 450px"
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs uppercase tracking-wider text-amber-300 font-black">
                      {selectedCushion.unit}
                    </p>
                    <h3 className="text-lg font-black text-white leading-snug drop-shadow-sm">
                      {selectedCushion.name}
                    </h3>
                  </div>
                </div>

                {/* Thumbnails Quick Switcher */}
                <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {CHRISTMAS_CUSHIONS.slice(0, 6).map((cushion) => (
                    <button
                      key={cushion.id}
                      onClick={() => setSelectedCushion(cushion)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        selectedCushion.id === cushion.id
                          ? 'border-emerald-600 scale-105 ring-2 ring-emerald-500/40'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={cushion.imageUrl || '/IMAGES/mascota.jpeg'}
                        alt={cushion.name}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Action Row */}
                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-slate-900">{formatCOP(selectedCushion.price)}</span>
                      <span className="text-xs text-slate-400 line-through">{formatCOP(50000)}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block">Ahorras $10.000 COP</span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(selectedCushion, 1, true)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 text-xs font-black uppercase tracking-wider transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <ShoppingBag size={14} /> Añadir al Carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Product Catalog / Design Selector */}
      <section id="catalogo-navidad" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-300">
            Escoge tus Diseños Favoritos
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-serif text-slate-900">
            10 Estilos Únicos para Cada Rincón de tu Casa
          </h2>
          <p className="text-slate-600 text-sm">
            Desde los pesebres más clásicos y solemnes hasta los personajes navideños más tiernos para alegrar a los niños.
          </p>

          {/* Theme Filters */}
          <div className="flex flex-wrap justify-center gap-2 pt-3">
            {[
              { id: 'todos', label: 'Todos los Diseños 🎁' },
              { id: 'pesebre', label: 'Sagrada Familia & Pesebre ✨' },
              { id: 'santa', label: 'Papá Noel & Renos 🎅' },
              { id: 'osito', label: 'Ositos & Muñecos 🧸' },
              { id: 'duendes', label: 'Duendecillos Navideños 🧝' },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedTheme(filter.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  selectedTheme === filter.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-xs'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCushions.map((product) => {
            const isCurrentlySelected = selectedCushion.id === product.id;

            return (
              <div
                key={product.id}
                className={`rounded-3xl bg-white border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-sm ${
                  isCurrentlySelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' : 'border-slate-200 hover:border-emerald-300 hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Image Container */}
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                    <Image
                      src={product.imageUrl || '/IMAGES/mascota.jpeg'}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                        {product.badge}
                      </span>
                    )}
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-xs">
                      45x45 cm
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2">
                    <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <div className="flex items-baseline justify-between mb-4 border-t border-slate-100 pt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-900">{formatCOP(product.price)}</span>
                      {product.previousPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCOP(product.previousPrice)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      20% OFF
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAddToCart(product, 1, false)}
                      className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag size={13} /> Añadir
                    </button>
                    <button
                      onClick={() => handleBuyNow(product, 1)}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      Comprar →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* High-Converting Bundle Spotlight Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border-2 border-emerald-500 bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/80 p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white font-black text-xs uppercase px-3.5 py-1 shadow-xs">
                <Gift size={14} /> Oferta Especial de la Semana
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif text-slate-900">
                Set Familiar Navideño x4 Cojines
              </h2>
              <p className="text-slate-600 text-sm sm:text-base max-w-xl leading-relaxed">
                Elige 4 diseños para ambientar toda tu sala o para regalar a tus seres queridos. Obtienes un <strong>ahorro de más de $60.000 COP</strong> y nosotros asumimos el 100% del costo del domicilio en Bucaramanga, Floridablanca, Girón o Piedecuesta.
              </p>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <div className="text-left bg-white border-2 border-emerald-300 px-4 py-2.5 rounded-2xl shadow-sm">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Precio Especial Combo x4:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-800">{formatCOP(139900)}</span>
                    <span className="text-sm text-slate-400 line-through">{formatCOP(200000)}</span>
                  </div>
                </div>

                <div className="flex flex-col text-xs text-emerald-800 font-bold space-y-1">
                  <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> 4 Rellenos siliconados incluidos</span>
                  <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> Envío GRATIS en Santander AMB</span>
                  <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-600" /> Paga al recibir en tu puerta</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center">
              <button
                onClick={() => handleBuyNow(comboProduct, 1)}
                className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-3 text-center"
              >
                <span>¡Quiero el Set x4 con Envío Gratis!</span>
                <ArrowRight size={18} />
              </button>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Puedes especificar los 4 diseños elegidos en las notas del checkout o por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Craftsmanship Specifications */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Calidad Santandereana
          </span>
          <h2 className="text-3xl font-black font-serif text-slate-900 mt-3">
            ¿Por qué nuestros cojines son diferentes?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto md:mx-0">
              <Sparkles size={24} />
            </div>
            <h3 className="font-black text-slate-900 text-base">Tacto Terciopelo</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Microfibra peach-skin sublimada de gramaje grueso. Suavidad extrema al tacto con brillo cálido no reflectivo.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto md:mx-0">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-black text-slate-900 text-base">Relleno Siliconado</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fibra siliconada 100% virgen antialérgica. No se deforma, no acumula ácaros y recupera su forma esponjosa de inmediato.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-800 flex items-center justify-center mx-auto md:mx-0">
              <Layers size={24} />
            </div>
            <h3 className="font-black text-slate-900 text-base">Fácil Lavado</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cremallera invisible reforzada en la base. Desenfunda en 5 segundos y lava en lavadora sin temor a que se descolore.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto md:mx-0">
              <Truck size={24} />
            </div>
            <h3 className="font-black text-slate-900 text-base">Despacho en 24h</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Logística propia de Surtifruver La Gaviota. Recibe tus cojines en tu puerta junto con tu mercado de la semana.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-200">
        <div className="text-center mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Resolvemos tus dudas</span>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-slate-900 mt-1">Preguntas Frecuentes</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-800 hover:text-slate-900"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} className="shrink-0 text-emerald-600" /> : <ChevronDown size={18} className="shrink-0 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action with Mascot */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t border-slate-200 relative">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl relative bg-white">
          <Image src="/IMAGES/mascota.jpeg" alt="Gaviota Mascot" fill className="object-cover" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-black font-serif text-slate-900 mb-3">
          ¿Listo para llenar tu hogar de alegría navideña?
        </h2>
        <p className="text-slate-600 text-sm max-w-lg mx-auto mb-8">
          Haz tu pedido hoy mismo antes de que se agoten las unidades de la temporada. ¡Mercar y decorar nunca fue tan chévere!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => handleBuyNow(comboProduct, 1)}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            Llevar Combo x4 Cojines Navideños ($139.900)
          </button>
          <a
            href="https://wa.me/573112694676?text=¡Hola%20Surtifruver%20La%20Gaviota!%20🧺%20Quisiera%20asesoría%20sobre%20la%20colección%20de%20cojines%20navideños."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <PhoneCall size={16} /> Preguntar por WhatsApp
          </a>
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs"
          >
            Volver a la Tienda de Frutas y Verduras
          </Link>
        </div>
      </section>

      {/* Floating Bottom Conversion Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 flex items-center justify-between gap-3 sm:hidden shadow-2xl">
        <div className="text-xs">
          <span className="text-slate-500 block font-medium">Cojines en canasta:</span>
          <span className="font-black text-emerald-800 font-mono">{totalCushionsInCart} unidades</span>
        </div>
        <button
          onClick={() => {
            if (totalCushionsInCart === 0) {
              handleAddToCart(selectedCushion, 1, false);
            }
            router.push('/checkout');
          }}
          className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg"
        >
          <ShoppingBag size={14} />
          <span>{totalCushionsInCart > 0 ? 'Pagar Mi Pedido' : 'Pedir Cojín ($40.000)'}</span>
        </button>
      </div>

    </div>
  );
}

export { TienditaFunnelClient };
