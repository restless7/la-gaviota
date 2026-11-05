import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";

import { UserRoleProvider } from "@/src/contexts/UserRoleContext";
import { CartProvider } from "@/src/contexts/CartContext";
import ConditionalWrapper from "@/app/components/layout/ConditionalWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.lagaviotafruver.com'),
  title: {
    template: '%s | La Gaviota Fruver',
    default: 'Surtifruver La Gaviota | Verduras y Frutas Frescas a Domicilio en Bucaramanga',
  },
  description: 'Mercado fresco directo del campo. Proveedor mayorista de frutas y verduras frescas para restaurantes y hogares en Bucaramanga. Envíos gratis desde $50.000.',
  keywords: ['Fruver Bucaramanga', 'verduras a domicilio Bucaramanga', 'proveedor restaurantes Bucaramanga', 'frutas al por mayor', 'mercado fresco Bucaramanga', 'fruver a domicilio Bucaramanga', 'frutas y verduras Bucaramanga'],
  authors: [{ name: 'La Gaviota Fruver' }],
  creator: 'La Gaviota Fruver',
  publisher: 'La Gaviota Fruver',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://www.lagaviotafruver.com',
    siteName: 'Surtifruver La Gaviota',
    title: 'Surtifruver La Gaviota | Frutas y Verduras Frescas a Domicilio',
    description: 'Mercado fresco directo del campo a tu mesa. Frutas y verduras de Santander en Bucaramanga. La forma chévere de mercar.',
    images: [
      {
        url: 'https://www.lagaviotafruver.com/IMAGES/og-lagaviota.jpg',
        secureUrl: 'https://www.lagaviotafruver.com/IMAGES/og-lagaviota.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'Surtifruver La Gaviota - Frescura de Santander a tu mesa',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Surtifruver La Gaviota | Frescura de Santander a tu mesa',
    description: 'Frutas y verduras frescas directo del campo. La forma chévere de mercar en Bucaramanga.',
    images: ['https://www.lagaviotafruver.com/IMAGES/og-lagaviota.jpg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['GroceryStore', 'LocalBusiness'],
  name: 'Frutas y Verduras La Gaviota',
  alternateName: 'Surtifruver La Gaviota',
  image: 'https://www.lagaviotafruver.com/IMAGES/og-lagaviota.png',
  description: 'Comercialización de frutas y verduras frescas de calidad en Bucaramanga. Sede en Plaza de Mercado San Francisco.',
  url: 'https://www.lagaviotafruver.com',
  telephone: '+573184990826',
  founder: {
    '@type': 'Person',
    name: 'Eduard Iván Velazco López'
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Plaza de Mercado San Francisco, Calle 13 #22-49, Local 10',
    addressLocality: 'Bucaramanga',
    addressRegion: 'Santander',
    postalCode: '680001',
    addressCountry: 'CO'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 7.1254,
    longitude: -73.1257
  },
  areaServed: [
    { '@type': 'City', name: 'Bucaramanga' }
  ],
  priceRange: 'COP',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
      ],
      opens: '06:00',
      closes: '20:00'
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={esES}
      appearance={{
        variables: {
          colorPrimary: '#E30613',
          colorText: '#1e293b',
          colorTextOnPrimaryBackground: '#FFCC00',
          borderRadius: '0.75rem',
          fontFamily: 'Inter, sans-serif',
        },
        elements: {
          formButtonPrimary: 'bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] font-bold shadow-lg',
          card: 'shadow-xl border border-gray-100',
          headerTitle: 'font-black',
          headerSubtitle: 'text-gray-500',
          socialButtonsBlockButton: 'border-gray-200 hover:bg-slate-50',
          footerActionLink: 'text-[#E30613] hover:text-[#c90510] font-bold',
        },
      }}
    >
      <html lang="es">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-800`}>
          <UserRoleProvider>
            <CartProvider>
              <ConditionalWrapper>
                {children}
              </ConditionalWrapper>
            </CartProvider>
          </UserRoleProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
