import { Metadata } from 'next';
import { TienditaFunnelClient } from '@/src/components/funnel/TienditaFunnelClient';

export const metadata: Metadata = {
  title: 'Especial de Navidad 🎄 | La Tiendita de La Gaviota',
  description: 'Descubre la magia de la Navidad en La Tiendita de Surtifruver La Gaviota: Cojines decorativos de colección para toda la familia.',
};

export default function NavidadPage() {
  return <TienditaFunnelClient />;
}

