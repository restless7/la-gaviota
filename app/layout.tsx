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
  title: "Surtifruver La Gaviota | La forma chévere de mercar",
  description: "Mercado fresco directo del campo. Precios justos al detalle, descuentos para micromercados y tarifas mayoristas para restaurantes.",
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
        <body className={`${inter.className} overflow-x-hidden min-h-screen flex flex-col bg-slate-50 text-slate-800`}>
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
