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
  title: {
    template: '%s | La Gaviota Fruver',
    default: 'Surtifruver La Gaviota | Verduras y Frutas Frescas a Domicilio en Bucaramanga',
  },
  description: 'Mercado fresco directo del campo. Proveedor mayorista de frutas y verduras frescas para restaurantes y hogares en Bucaramanga, Floridablanca y Girón. Envíos gratis desde $50.000.',
  keywords: ['Fruver Bucaramanga', 'verduras a domicilio', 'proveedor restaurantes Bucaramanga', 'frutas al por mayor', 'mercado fresco Bucaramanga', 'fruver a domicilio', 'frutas y verduras Floridablanca'],
  authors: [{ name: 'La Gaviota Fruver' }],
  creator: 'La Gaviota Fruver',
  publisher: 'La Gaviota Fruver',
  alternates: {
    canonical: 'https://www.lagaviotafruver.com',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://www.lagaviotafruver.com',
    siteName: 'La Gaviota Fruver Bucaramanga',
    title: 'Surtifruver La Gaviota | Frutas y Verduras a Domicilio',
    description: 'Proveedor de frutas y verduras en Bucaramanga, Floridablanca y Girón. Mercado fresco directo del campo.',
    images: [
      {
        url: 'https://www.lagaviotafruver.com/IMAGES/logo.jpeg',
        width: 800,
        height: 600,
        alt: 'Surtifruver La Gaviota',
      }
    ]
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Surtifruver La Gaviota',
  image: 'https://www.lagaviotafruver.com/IMAGES/logo.jpeg',
  description: 'Proveedor mayorista de frutas y verduras frescas para restaurantes y hogares en Bucaramanga, Floridablanca y Girón.',
  url: 'https://www.lagaviotafruver.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bucaramanga',
    addressRegion: 'Santander',
    postalCode: '680001',
    addressCountry: 'CO'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 7.1193,
    longitude: -73.1227
  },
  priceRange: 'COP',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
      ],
      opens: '08:00',
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
