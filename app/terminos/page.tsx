import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Surtifruver La Gaviota',
  description: 'Términos y condiciones de uso de la plataforma de Surtifruver La Gaviota.',
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gaviota-red/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al inicio
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gaviota-red/20 p-3 rounded-2xl">
              <FileText size={32} className="text-gaviota-red" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-serif">Términos y Condiciones</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">Última actualización: Mayo 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-10">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">1. Aceptación de los Términos</h2>
            <p className="text-gray-600 leading-relaxed">
              Al acceder y utilizar la plataforma de <strong>Surtifruver La Gaviota</strong> (en adelante, &ldquo;la Plataforma&rdquo;), aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna de estas condiciones, te rogamos abstenerte de utilizar nuestros servicios.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">2. Descripción del Servicio</h2>
            <p className="text-gray-600 leading-relaxed">
              La Gaviota es una plataforma de comercio electrónico especializada en la venta y distribución de productos frescos (frutas, verduras, hortalizas, carnes y preparados) directamente del campo colombiano. Ofrecemos tres niveles de servicio:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-gray-100 text-center">
                <div className="text-3xl mb-2">🛒</div>
                <h4 className="font-bold text-slate-800">Detal</h4>
                <p className="text-xs text-gray-500 mt-1">Personas naturales, precios regulares.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-gray-100 text-center">
                <div className="text-3xl mb-2">🍳</div>
                <h4 className="font-bold text-slate-800">Restaurantes</h4>
                <p className="text-xs text-gray-500 mt-1">Precios mayoristas preferenciales.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-gray-100 text-center">
                <div className="text-3xl mb-2">🏪</div>
                <h4 className="font-bold text-slate-800">Micromercados</h4>
                <p className="text-xs text-gray-500 mt-1">Tarifas especiales para reventa.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">3. Registro y Cuenta de Usuario</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4">
              <li>Para realizar compras debes registrarte con datos verídicos y actualizados.</li>
              <li>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.</li>
              <li>El acceso a los portales B2B (Restaurantes / Micromercados) requiere aprobación previa por parte de nuestro equipo comercial.</li>
              <li>Nos reservamos el derecho de suspender cuentas que incumplan estos términos.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">4. Pedidos y Entregas</h2>
            <div className="bg-gaviota-green/5 border border-gaviota-green/20 rounded-2xl p-6 space-y-3">
              <p className="text-gray-600"><strong>⏰ Horario de corte:</strong> Los pedidos realizados antes de las 8:00 PM serán programados para entrega al siguiente día hábil.</p>
              <p className="text-gray-600"><strong>🚚 Ventana de entrega:</strong> De 10:00 AM a 5:00 PM en el día programado.</p>
              <p className="text-gray-600"><strong>📍 Zona de cobertura:</strong> Área metropolitana de Bucaramanga, Santander.</p>
              <p className="text-gray-600"><strong>✅ Garantía:</strong> Si tu pedido no llega en la fecha prometida, te compensaremos conforme a nuestra política de garantía.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">5. Precios y Pagos</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4">
              <li>Los precios están expresados en Pesos Colombianos (COP) e incluyen IVA cuando aplique.</li>
              <li>Los precios de productos frescos están sujetos a variaciones por condiciones del mercado.</li>
              <li>Aceptamos pagos a través de pasarelas certificadas (Wompi/Bold) con protección PCI-DSS.</li>
              <li>Los clientes B2B aprobados podrán acceder a líneas de crédito según su perfil comercial.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">6. Devoluciones y Garantía de Calidad</h2>
            <p className="text-gray-600 leading-relaxed">
              Si un producto llega en condiciones no óptimas (daño, maduración excesiva, producto diferente al solicitado), podrás reportarlo dentro de las 24 horas posteriores a la entrega. Evaluaremos tu caso y procederemos con reemplazo o reembolso según corresponda.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">7. Propiedad Intelectual</h2>
            <p className="text-gray-600 leading-relaxed">
              Todo el contenido de la Plataforma (logos, imágenes, textos, diseños, software) es propiedad exclusiva de Surtifruver La Gaviota SAS o de sus licenciantes. Queda prohibida su reproducción, distribución o modificación sin autorización escrita.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">8. Legislación Aplicable</h2>
            <p className="text-gray-600 leading-relaxed">
              Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia será resuelta ante los tribunales competentes de la ciudad de Bucaramanga, Santander.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
