import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Surtifruver La Gaviota',
  description: 'Conoce cómo protegemos y tratamos tus datos personales en Surtifruver La Gaviota.',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gaviota-green/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al inicio
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gaviota-green/20 p-3 rounded-2xl">
              <ShieldCheck size={32} className="text-gaviota-green" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-serif">Política de Privacidad</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">Última actualización: Mayo 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-10">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">1. Responsable del Tratamiento</h2>
            <p className="text-gray-600 leading-relaxed">
              <strong>Surtifruver La Gaviota SAS</strong>, identificada con NIT 900.123.456-7, con domicilio en Bucaramanga, Santander, Colombia, es la responsable del tratamiento de los datos personales recopilados a través de esta plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">2. Datos que Recopilamos</h2>
            <p className="text-gray-600 leading-relaxed">Recopilamos la siguiente información cuando interactúas con nuestra plataforma:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4">
              <li>Datos de identificación: nombre completo, correo electrónico, número de teléfono.</li>
              <li>Datos de ubicación: dirección de entrega y zona de cobertura.</li>
              <li>Datos transaccionales: historial de pedidos, métodos de pago utilizados.</li>
              <li>Datos técnicos: dirección IP, tipo de navegador, dispositivo utilizado.</li>
              <li>Datos comerciales: preferencias de productos, categorías favoritas.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">3. Finalidad del Tratamiento</h2>
            <p className="text-gray-600 leading-relaxed">Tus datos personales serán utilizados para:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4">
              <li>Procesar y entregar tus pedidos de productos frescos.</li>
              <li>Gestionar tu cuenta de usuario y nivel de precios (Detal, Restaurante, Micromercado).</li>
              <li>Enviar comunicaciones comerciales y ofertas personalizadas (con tu consentimiento).</li>
              <li>Mejorar la experiencia de la plataforma mediante análisis de uso.</li>
              <li>Cumplir con obligaciones legales y tributarias.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">4. Derechos del Titular (ARCO)</h2>
            <p className="text-gray-600 leading-relaxed">
              De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013, como titular de tus datos personales, tienes derecho a:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 rounded-2xl p-5 border border-gray-100">
                <h4 className="font-bold text-slate-800 mb-1">📋 Acceso</h4>
                <p className="text-sm text-gray-500">Conocer los datos personales que tenemos sobre ti.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-gray-100">
                <h4 className="font-bold text-slate-800 mb-1">✏️ Rectificación</h4>
                <p className="text-sm text-gray-500">Solicitar la corrección de datos incompletos o inexactos.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-gray-100">
                <h4 className="font-bold text-slate-800 mb-1">🗑️ Cancelación</h4>
                <p className="text-sm text-gray-500">Solicitar la eliminación de tus datos cuando ya no sean necesarios.</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-gray-100">
                <h4 className="font-bold text-slate-800 mb-1">🚫 Oposición</h4>
                <p className="text-sm text-gray-500">Oponerte al tratamiento de tus datos para fines específicos.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">5. Seguridad de los Datos</h2>
            <p className="text-gray-600 leading-relaxed">
              Implementamos medidas técnicas y organizativas de seguridad, incluyendo cifrado SSL/TLS, autenticación segura mediante Clerk, y almacenamiento protegido en Supabase con políticas de Row Level Security (RLS). Los pagos son procesados de forma segura a través de pasarelas certificadas PCI-DSS.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800 font-serif">6. Contacto</h2>
            <p className="text-gray-600 leading-relaxed">
              Para ejercer tus derechos o realizar cualquier consulta sobre el tratamiento de tus datos personales, puedes contactarnos a:
            </p>
            <div className="bg-gaviota-green/5 border border-gaviota-green/20 rounded-2xl p-6">
              <p className="font-bold text-slate-800">📧 pedidos@lagaviota.co</p>
              <p className="text-sm text-gray-500 mt-1">Respuesta en un plazo máximo de 15 días hábiles conforme a la ley.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
