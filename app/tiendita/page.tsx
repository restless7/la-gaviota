import { Metadata } from 'next';
import { TienditaFunnelClient } from '@/src/components/funnel/TienditaFunnelClient';

export const metadata: Metadata = {
  title: 'La Tiendita Navideña 🎄 | Cojines Decorativos Premium | Surtifruver La Gaviota',
  description: 'Colección especial de cojines navideños premium en Bucaramanga. Confección en microfibra velvet con relleno siliconado antialérgico. Entrega a domicilio y pago contra entrega.',
  openGraph: {
    title: 'La Tiendita Navideña 🎄 | Cojines de Colección La Gaviota',
    description: 'Viste tu sala de magia esta Navidad con cojines decorativos de lujo. Relleno siliconado, cierre invisible y envío a domicilio en Santander y Bogotá.',
    images: [{ url: 'https://www.lagaviotafruver.com/IMAGES/navidad/cojin-santa-saco-regalos.jpg', width: 1200, height: 630 }],
  },
};

export default function TienditaPage() {
  return <TienditaFunnelClient />;
}

