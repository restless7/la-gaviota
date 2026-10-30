'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

type Props = ImageProps & { fallbackSrc?: string };

export function CatalogImage(props: Props) {
  const identity = typeof props.src === 'string' ? props.src : 'src' in props.src ? props.src.src : props.src.default.src;
  return <ImageState key={identity} {...props} />;
}

function ImageState({ fallbackSrc = '/IMAGES/logo.jpeg', alt, onError, ...props }: Props) {
  const [failures, setFailures] = useState(0);
  if (failures >= 2) return <div role="img" aria-label={`Imagen no disponible: ${alt}`} className="absolute inset-0 flex items-center justify-center bg-slate-100 p-3 text-center text-xs text-slate-600">Imagen no disponible</div>;
  return <Image {...props} src={failures ? fallbackSrc : props.src} alt={failures ? `Imagen no disponible: ${alt}` : alt} className={failures ? 'object-contain p-4 bg-white' : props.className} onError={event => { setFailures(count => count + 1); onError?.(event); }} />;
}
