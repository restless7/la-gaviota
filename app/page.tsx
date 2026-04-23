import React from 'react';
import Image from 'next/image';
import HeroBanner from './components/ui/HeroBanner';
import ImageCarousel from './components/ui/ImageCarousel';
import CategoryBanner from './components/ui/CategoryBanner';
import PromotionalBanner from './components/ui/PromotionalBanner';
import ProductGrid from './components/store/ProductGrid';

export default function Home() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* 1. Hero Section */}
      <HeroBanner />

      {/* 2. Image Carousel / Hero Slider */}
      <ImageCarousel />

      {/* 3. Kit Chévere de la Semana Banner */}
      <PromotionalBanner />

      {/* 4. Categorías Section */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 font-serif">Nuestras <span className="text-gaviota-green italic">Categorías</span></h2>
              <p className="text-lg text-gray-500 font-medium tracking-tight">Seleccionado con amor en tierras Santandereanas.</p>
            </div>
            <button className="text-gaviota-red font-black text-lg border-b-4 border-gaviota-red pb-1 hover:text-red-700 hover:border-red-700 transition-all">
              Ver Todo el Catálogo
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CategoryBanner 
              title="Frutas" 
              image="/IMAGES/frutas-banner.jpeg" 
              href="/categoria/frutas" 
              color="yellow" 
            />
            <CategoryBanner 
              title="Verduras" 
              image="/IMAGES/verduras-banner.jpeg" 
              href="/categoria/verduras" 
              color="green" 
            />
            <CategoryBanner 
              title="Carnes" 
              image="/IMAGES/carnes-banner1.jpeg" 
              href="/categoria/carnes" 
              color="red" 
            />
          </div>
        </div>
      </section>

      {/* 5. De la Granja a la Mesa Section */}
      <section className="bg-white py-20 px-4 overflow-hidden relative">
        {/* Wavy Background Decoration */}
        <div className="absolute top-0 left-0 w-full opacity-5 pointer-events-none">
          <svg viewBox="0 0 1440 320" className="w-full h-auto">
            <path fill="#4CAF50" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,197.3C960,171,1056,117,1152,101.3C1248,85,1344,107,1392,117.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2 relative">
             <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white transform lg:-rotate-2 hover:rotate-0 transition-transform duration-500">
               <Image 
                 src="/IMAGES/about-granja-mesa3.jpeg" 
                 alt="De la Granja a la Mesa" 
                 width={800} 
                 height={600} 
                 className="object-cover"
               />
             </div>
             {/* Decorative leaf shape */}
             <div className="absolute -bottom-10 -right-10 bg-gaviota-green w-40 h-40 rounded-full opacity-10 blur-3xl"></div>
          </div>
          
          <div className="w-full lg:w-1/2 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-gaviota-green font-serif leading-tight">
              De la <span className="text-gaviota-red italic underline decoration-gaviota-yellow">Granja</span> a tu Mesa
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed font-medium">
              En La Gaviota nos sentimos orgullosos de trabajar de la mano con las familias campesinas de nuestra región. Nuestro modelo elimina intermediarios para que recibas productos frescos, directamente desde la tierra hasta tu mesa.
            </p>
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="bg-gaviota-yellow/20 p-2 rounded-full">✅</div>
                <p className="font-bold text-slate-800">Calidad superior garantizada</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-gaviota-yellow/20 p-2 rounded-full">✅</div>
                <p className="font-bold text-slate-800">Pago justo para el agricultor local</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-gaviota-yellow/20 p-2 rounded-full">✅</div>
                <p className="font-bold text-slate-800">Fomento del mercado justo en Santander</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Popular Products Grid */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 font-serif">Nuestros <span className="text-gaviota-red italic">Más Pedidos</span></h2>
             <div className="w-24 h-2 bg-gaviota-yellow mx-auto rounded-full"></div>
          </div>
          <ProductGrid />
        </div>
      </section>
    </div>
  );
}
