'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface CategoryBannerProps {
  title: string;
  image: string;
  href: string;
  color: 'red' | 'green' | 'yellow';
}

export default function CategoryBanner({ title, image, href, color }: CategoryBannerProps) {
  const colorMap = {
    red: 'bg-gaviota-red',
    green: 'bg-gaviota-green',
    yellow: 'bg-gaviota-yellow',
  };

  return (
    <motion.a
      href={href}
      whileHover={{ y: -10 }}
      className="relative block w-full h-[250px] md:h-[350px] rounded-[2.5rem] overflow-hidden group shadow-lg hover:shadow-2xl transition-all"
    >
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8">
        <h3 className="text-3xl font-black text-white mb-2 drop-shadow-md">{title}</h3>
        <div className={`w-12 h-1 ${colorMap[color]} rounded-full mb-4 transform origin-left transition-all duration-300 group-hover:w-full`}></div>
        <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
           Ver Selección →
        </span>
      </div>
    </motion.a>
  );
}
