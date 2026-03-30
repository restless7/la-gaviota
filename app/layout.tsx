import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { UserProvider } from "@/app/context/UserContext";
import Header from "@/app/components/layout/Header";
import WhatsAppHook from "@/app/components/ui/WhatsAppHook";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Surtifruver La Gaviota",
  description: "E-Commerce platform for Surtifruver La Gaviota.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} overflow-x-hidden`}>
        <UserProvider>
          <div className="min-h-screen flex flex-col bg-slate-50">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            
            {/* Simple Footer directly in layout for completion */}
            <footer className="bg-gaviota-red text-white py-8 mt-12">
              <div className="max-w-7xl mx-auto px-4 text-center text-sm opacity-90">
                <p>&copy; {new Date().getFullYear()} Surtifruver La Gaviota. Todos los derechos reservados.</p>
                <p className="mt-2 text-red-200">Powered by APEX AI Solutions.</p>
              </div>
            </footer>
          </div>
          <WhatsAppHook />
        </UserProvider>
      </body>
    </html>
  );
}
