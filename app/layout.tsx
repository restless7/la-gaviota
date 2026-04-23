import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { UserRoleProvider } from "@/src/contexts/UserRoleContext";
import { CartProvider } from "@/src/contexts/CartContext";
import Header from "@/app/components/layout/Header";
import FloatingWhatsApp from "@/app/components/ui/FloatingWhatsApp";
import { RoleSwitcher } from "@/src/components/RoleSwitcher";
import { CartDrawer } from "@/src/components/cart/CartDrawer";
import { ConvexProvider } from "@/src/components/convex-provider";

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
    <html lang="es">
      <body className={`${inter.className} overflow-x-hidden min-h-screen flex flex-col bg-slate-50 text-slate-800`}>
        <ConvexProvider>
          <UserRoleProvider>
            <CartProvider>
              <Header />
              <main className="flex-1 w-full flex flex-col leading-relaxed">
                {children}
              </main>
              
              <footer className="bg-slate-900 text-white py-12 mt-auto relative z-20">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm opacity-90">
                  <p className="font-serif italic text-2xl mb-4 text-[#FFCC00]">La Gaviota</p>
                  <p>&copy; {new Date().getFullYear()} Surtifruver La Gaviota. Todos los derechos reservados.</p>
                  <p className="mt-2 text-gray-400">La forma chévere de mercar | Plataforma impulsada por APEX</p>
                </div>
              </footer>
              
              {/* Global UI Overlays */}
              <RoleSwitcher />
              <FloatingWhatsApp />
              <CartDrawer />
            </CartProvider>
          </UserRoleProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
