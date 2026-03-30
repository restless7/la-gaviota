import ProductGrid from './components/store/ProductGrid';

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero Section */}
      <section className="relative w-full rounded-3xl overflow-hidden bg-gaviota-red text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/90 to-red-500/80 z-10"></div>
        {/* Decorative Wave Divider at the bottom inside hero */}
        <div className="wave-divider absolute bottom-0 left-0 right-0 h-12 z-20"></div>
        
        <div className="relative z-20 px-8 py-16 md:py-24 max-w-2xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold mb-4 border border-white/30">
            🌿 Del campo a tu negocio
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight font-serif drop-shadow-md">
            Frescura que se nota, <br/>
            <span className="text-gaviota-yellow">calidad que se prueba.</span>
          </h1>
          <p className="text-lg md:text-xl text-red-100 mb-8 max-w-xl font-medium leading-relaxed">
            Surtifruver La Gaviota te trae las mejores frutas y verduras. Precios especiales para hogares, micromercados y restaurantes.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-white text-gaviota-red hover:bg-red-50 px-8 py-3.5 rounded-full font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
              Comprar Ahora
            </button>
            <button className="bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white border border-white/20 px-8 py-3.5 rounded-full font-bold transition-colors">
              Nuestras Ofertas
            </button>
          </div>
        </div>
      </section>

      {/* Main Store Content */}
      <ProductGrid />
      
      {/* Testimonials / Features Banner */}
      <section className="mt-8 bg-green-50 rounded-3xl p-8 md:p-12 text-center border border-green-100">
        <h2 className="text-2xl font-black text-gaviota-green font-serif mb-8">¿Por qué elegir La Gaviota?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-4 text-gaviota-green">
              🚜
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Directo del Productor</h3>
            <p className="text-sm text-slate-600">Sin intermediarios, garantizando frescura y el mejor precio del mercado.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-4 text-gaviota-green">
              🛵
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Entrega Rápida</h3>
            <p className="text-sm text-slate-600">Domicilios en toda la ciudad. ¡Gratis por compras superiores a $50.000!</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-4 text-gaviota-green">
              ⭐
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Calidad Garantizada</h3>
            <p className="text-sm text-slate-600">Seleccionamos a mano cada producto para asegurar que lleves solo lo mejor.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
