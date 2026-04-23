'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';

const SLIDES = [
  {
    id: 1,
    image: '/IMAGES/slide-freshness-24h.jpeg',
    title: 'Frescura 24h',
    desc: 'Desde la cosecha hasta tu puerta en menos de un día.'
  },
  {
    id: 2,
    image: '/IMAGES/slide-tiered-pricing.jpeg',
    title: 'Precios Justos',
    desc: 'Bajo costo para hogares, mejores precios para negocios.'
  },
  {
    id: 3,
    image: '/IMAGES/slide-santander-pride.jpeg',
    title: 'Orgullo Santandereano',
    desc: 'Apoyando lo nuestro, cultivando el futuro.'
  }
];

export default function ImageCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  return (
    <section className="bg-white py-8 w-full overflow-x-hidden">
      <div className="w-full overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {SLIDES.map((slide) => (
            <div className="flex-[0_0_100%] min-w-0 relative aspect-[16/9] w-full" key={slide.id}>
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-md">{slide.title}</h2>
                <p className="text-lg md:text-xl text-white/90 font-medium drop-shadow-sm max-w-xl">{slide.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
