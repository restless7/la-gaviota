import Image from 'next/image';
import ProductGrid from './components/store/ProductGrid';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Sweeping Red Curve (Reference design match) */}
      <div className="relative w-[100vw] left-[50%] -ml-[50vw] z-0 h-24 md:h-40 overflow-hidden flex items-start -mt-[1px]">
         <svg className="absolute top-0 w-full object-cover min-w-[1440px] h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="#CC0000" fillOpacity="1" d="M0,96L80,112C160,128,320,160,480,170.7C640,181,800,171,960,138.7C1120,107,1280,53,1360,26.7L1440,0L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
         </svg>
      </div>

      {/* Hero Section exactly like the reference "De la Granja a la Mesa" */}
      <section className="relative w-[100vw] left-[50%] -ml-[50vw] overflow-hidden bg-white text-slate-800 mb-12 -mt-16 sm:-mt-24">
        {/* Leaf Background Motifs (using SVG shapes inside absolute divs) */}
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none w-1/2 h-full flex items-center justify-end overflow-hidden">
           <svg className="w-[600px] h-[600px] text-gaviota-green fill-current" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#22c55e" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.2C90.8,-33.3,96.8,-17.6,96.5,-2.1C96.2,13.4,89.5,26.8,79.9,38.8C70.3,50.8,57.7,61.4,43.4,68.9C29.1,76.4,13.1,80.8,-2.6,85.1C-18.3,89.4,-36.6,93.6,-50.7,86.2C-64.8,78.8,-74.7,59.8,-81.9,41C-89.1,22.2,-93.6,3.6,-92,-14.2C-90.4,-32,-82.7,-49,-69.7,-60.7C-56.7,-72.4,-38.4,-78.8,-21.8,-82.5C-5.2,-86.2,9.7,-87.2,24.4,-84.9C39.1,-82.6,53.6,-77.1,44.7,-76.4Z" transform="translate(100 100) scale(1.1)" />
           </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center gap-12 relative z-10">
          
          {/* Left Farmer Image */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start">
             <div className="relative w-full max-w-lg aspect-square mb-12 lg:mb-0">
                {/* Real photo overlaying the background */}
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white z-20 bg-slate-100 flex items-center justify-center">
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 opacity-0 hidden">
                     <span className="text-6xl mb-4">👨‍🌾</span>
                     <span className="text-sm font-semibold max-w-[200px] text-center">Imagen del Productor Local</span>
                   </div>
                   
                   <Image 
                     src="/IMAGES/Colombian_produce_on_202603260851.jpeg" 
                     alt="Productor Local La Gaviota" 
                     fill 
                     sizes="(max-width: 768px) 100vw, 50vw"
                     className="object-cover" 
                     priority
                   />
                </div>
             </div>
          </div>

          {/* Right Text Context */}
          <div className="w-full md:w-1/2 flex flex-col space-y-6">
             <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gaviota-green font-serif leading-tight">
               De la Granja a la Mesa: Nuestra Historia
             </h1>
             <p className="text-gray-600 leading-relaxed text-sm md:text-base">
               En La Gaviota nos sentimos orgullosos de trabajar de la mano con las familias campesinas de nuestra región. Nuestro modelo elimina intermediarios para que recibas productos frescos, directamente desde la tierra hasta tu mesa, garantizando una calidad superior y un pago justo para el agricultor local.
             </p>
             <p className="text-2xl md:text-3xl font-bold font-serif text-gaviota-red italic">
               &quot;La forma chévere de mercar&quot;
             </p>
             <p className="text-gray-600 leading-relaxed text-sm md:text-base">
               Nuestra misión es transformar la manera en que compras tus frutas y verduras. Con entregas rápidas, selección cuidadosa y precios dinámicos competitivos para hogares y restaurantes, te aseguramos una experiencia excepcional con auténtico sabor a campo.
             </p>
          </div>
          
        </div>
      </section>

      {/* Main Store Content - Now with Sidebar Layout in ProductGrid Component */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-20 relative">
        {/* Soft background glow for the grid area */}
        <div className="absolute -inset-x-0 -top-20 h-40 bg-gradient-to-b from-transparent to-slate-50/50 pointer-events-none"></div>
        <ProductGrid />
      </div>
    </div>
  );
}
