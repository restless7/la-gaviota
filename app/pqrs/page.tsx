'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowLeft, Send, CheckCircle2, PhoneCall, Copy, Check } from 'lucide-react';
import { submitCustomerInquiryAction } from '@/src/actions/inquiries';

export default function PQRSPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [radicadoResult, setRadicadoResult] = useState<{
    code: string;
    type: string;
    customerName: string;
  } | null>(null);
  const [type, setType] = useState('peticion');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const form = new FormData(e.currentTarget);
    form.set('type', type);
    const fullName = String(form.get('name') || '');
    const email = String(form.get('email') || '');
    const phone = String(form.get('phone') || '');
    form.set('contact', phone ? `${phone} / ${email}` : email);

    try {
      const result = await submitCustomerInquiryAction(form);
      if (result.ok && result.radicadoCode) {
        setRadicadoResult({
          code: result.radicadoCode,
          type,
          customerName: fullName,
        });
      } else {
        setErrorMessage(result.error || 'No pudimos registrar tu solicitud. Por favor intenta nuevamente.');
      }
    } catch {
      setErrorMessage('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeLabels: Record<string, { emoji: string; title: string; color: string }> = {
    peticion: { emoji: '📋', title: 'Petición', color: 'bg-blue-500' },
    queja: { emoji: '😤', title: 'Queja', color: 'bg-gaviota-red' },
    reclamo: { emoji: '⚠️', title: 'Reclamo', color: 'bg-orange-500' },
    sugerencia: { emoji: '💡', title: 'Sugerencia', color: 'bg-gaviota-green' },
  };

  const copyRadicado = () => {
    if (!radicadoResult) return;
    navigator.clipboard?.writeText(radicadoResult.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gaviota-yellow/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al inicio
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gaviota-yellow/20 p-3 rounded-2xl">
              <MessageSquare size={32} className="text-gaviota-yellow" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-serif">PQRS</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">Peticiones, Quejas, Reclamos y Sugerencias. Tu voz es importante para nosotros.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        {radicadoResult ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center animate-fade-in max-w-2xl mx-auto">
            <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
              <CheckCircle2 size={44} />
            </div>
            <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800 mb-2">
              Solicitud Radicada Exitosamente
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 font-serif mb-2">
              ¡Gracias, {radicadoResult.customerName || 'Apreciado Cliente'}!
            </h2>
            <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
              Hemos registrado tu {typeLabels[radicadoResult.type]?.title.toLowerCase() || 'solicitud'} en nuestro sistema de atención al cliente.
            </p>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 mb-6 text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Número de Radicado Oficial
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                  {radicadoResult.code}
                </span>
                <button
                  type="button"
                  onClick={copyRadicado}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                ⏱️ Tiempo de respuesta estimado: <strong>máximo 24 a 48 horas hábiles</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <a
                href={`https://wa.me/573112694676?text=${encodeURIComponent(
                  `¡Hola Surtifruver La Gaviota! Acabo de registrar mi ${typeLabels[radicadoResult.type]?.title} con radicado *${radicadoResult.code}*. Agradezco su confirmación y seguimiento.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all text-sm"
              >
                <PhoneCall size={16} /> Notificar por WhatsApp a Soporte
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Volver a la Tienda
              </Link>
            </div>

            <button
              onClick={() => setRadicadoResult(null)}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Radicar otra solicitud
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-xl font-black text-slate-800 font-serif mb-6">¿Qué es PQRS?</h3>
                <div className="space-y-4">
                  {Object.entries(typeLabels).map(([key, val]) => (
                    <div key={key} className="flex items-start gap-3">
                      <span className="text-xl">{val.emoji}</span>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{val.title}</p>
                        <p className="text-xs text-gray-400">
                          {key === 'peticion' && 'Solicitud de información o servicio.'}
                          {key === 'queja' && 'Insatisfacción con nuestro servicio.'}
                          {key === 'reclamo' && 'Exigencia de un derecho vulnerado.'}
                          {key === 'sugerencia' && 'Propuesta de mejora para nuestro servicio.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gaviota-green/5 border border-gaviota-green/20 rounded-3xl p-8">
                <h4 className="font-bold text-slate-800 mb-3">Atención Directa</h4>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Para urgencias en tu domicilio de hoy, contáctanos inmediatamente a nuestra línea de despacho.
                </p>
                <a
                  href="https://wa.me/573112694676"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-green-800 underline block"
                >
                  WhatsApp: +57 311 269 4676 →
                </a>
              </div>

              <div className="bg-slate-100 rounded-3xl p-8">
                <h4 className="font-bold text-slate-800 mb-3">⚖️ Compromiso La Gaviota</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Toda solicitud genera un radicado digital único. Te contactaremos dentro de los plazos legales establecidos.
                </p>
              </div>
            </div>

            {/* Form Panel */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 font-serif mb-2">Enviar Solicitud</h2>
                  <p className="text-gray-500 text-sm">Completa el formulario y te generaremos tu número de radicado inmediato.</p>
                </div>

                {errorMessage && (
                  <div role="alert" className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                    {errorMessage}
                  </div>
                )}

                {/* Type Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Tipo de solicitud</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(typeLabels).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setType(key)}
                        aria-pressed={type === key}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${type === key ? `border-gaviota-green bg-gaviota-green/5 shadow-md` : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <span className="text-xl block mb-1">{val.emoji}</span>
                        <span className="text-xs font-bold text-slate-800">{val.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Nombre completo *</label>
                    <input type="text" required maxLength={200} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium" name="name" aria-label="Nombre completo" placeholder="Tu nombre y apellido" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Correo electrónico *</label>
                    <input type="email" required maxLength={254} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium" name="email" aria-label="Correo electrónico" placeholder="tu@correo.com" />
                  </div>
                </div>

                {/* Phone & Order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Teléfono / WhatsApp *</label>
                    <input type="tel" required maxLength={30} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium" name="phone" aria-label="Teléfono" placeholder="Ej. 311 269 4676" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">No. de pedido (si aplica)</label>
                    <input type="text" maxLength={100} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium" name="orderId" aria-label="Número de pedido" placeholder="Ej. ord_... o código de compra" />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Asunto *</label>
                  <input type="text" required maxLength={200} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium" name="subject" aria-label="Asunto" placeholder="Resumen breve de tu solicitud" />
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Descripción detallada *</label>
                  <textarea required rows={5} maxLength={4000} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium resize-none" name="message" aria-label="Descripción detallada" placeholder="Describe tu solicitud con el mayor detalle posible..."></textarea>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="disabled:opacity-50 disabled:cursor-not-allowed w-full bg-gaviota-green hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3 text-base sm:text-lg"
                >
                  <Send size={20} />
                  {isSubmitting ? 'Radicando...' : `Radicar ${typeLabels[type].title} Oficial`}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Al enviar este formulario, aceptas nuestra <Link href="/privacidad" className="text-gaviota-green font-bold hover:underline">Política de Privacidad</Link> y el tratamiento de tus datos personales.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
