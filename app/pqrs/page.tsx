'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowLeft, Send, CheckCircle } from 'lucide-react';

export default function PQRSPage() {
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState('peticion');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const typeLabels: Record<string, { emoji: string; title: string; color: string }> = {
    peticion: { emoji: '📋', title: 'Petición', color: 'bg-blue-500' },
    queja: { emoji: '😤', title: 'Queja', color: 'bg-gaviota-red' },
    reclamo: { emoji: '⚠️', title: 'Reclamo', color: 'bg-orange-500' },
    sugerencia: { emoji: '💡', title: 'Sugerencia', color: 'bg-gaviota-green' },
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
        {submitted ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="bg-gaviota-green/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-gaviota-green" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 font-serif mb-4">¡Recibimos tu solicitud!</h2>
            <p className="text-gray-500 text-lg max-w-md mx-auto mb-8">
              Nuestro equipo revisará tu {typeLabels[type].title.toLowerCase()} y te responderemos en un plazo máximo de 15 días hábiles conforme a la Ley 1755 de 2015.
            </p>
            <div className="bg-slate-50 rounded-2xl p-6 max-w-sm mx-auto border border-gray-100 mb-8">
              <p className="text-sm text-gray-500">Número de radicado</p>
              <p className="text-2xl font-black text-slate-800 mt-1">PQRS-{Date.now().toString().slice(-8)}</p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 bg-gaviota-green text-white font-bold py-3 px-8 rounded-full hover:bg-green-600 transition-all shadow-lg">
              Volver al inicio
            </Link>
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
                <h4 className="font-bold text-slate-800 mb-3">📞 ¿Prefieres llamar?</h4>
                <p className="text-sm text-gray-500 mb-4">Nuestro equipo está disponible de Lunes a Sábado de 6:00 AM a 8:00 PM.</p>
                <p className="font-black text-lg text-gaviota-green">+57 315 123 4567</p>
              </div>

              <div className="bg-slate-100 rounded-3xl p-8">
                <h4 className="font-bold text-slate-800 mb-3">⚖️ Marco Legal</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  De conformidad con la Ley 1755 de 2015, respondemos peticiones en máximo 15 días hábiles, quejas y reclamos en 15 días hábiles, y sugerencias en 15 días hábiles.
                </p>
              </div>
            </div>

            {/* Form Panel */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 font-serif mb-2">Enviar Solicitud</h2>
                  <p className="text-gray-500 text-sm">Completa el formulario y te responderemos lo antes posible.</p>
                </div>

                {/* Type Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Tipo de solicitud</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(typeLabels).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setType(key)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${type === key ? `border-gaviota-green bg-gaviota-green/5 shadow-md` : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <span className="text-xl block mb-1">{val.emoji}</span>
                        <span className="text-xs font-bold text-slate-800">{val.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Nombre completo *</label>
                    <input type="text" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium" placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Correo electrónico *</label>
                    <input type="email" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium" placeholder="tu@correo.com" />
                  </div>
                </div>

                {/* Phone & Order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Teléfono</label>
                    <input type="tel" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium" placeholder="+57 300 000 0000" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">No. de pedido (si aplica)</label>
                    <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium" placeholder="ORD-XXXX" />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Asunto *</label>
                  <input type="text" required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium" placeholder="Resumen breve de tu solicitud" />
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Descripción detallada *</label>
                  <textarea required rows={5} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green transition-all bg-slate-50 font-medium resize-none" placeholder="Describe tu solicitud con el mayor detalle posible..."></textarea>
                </div>

                {/* Submit */}
                <button type="submit" className="w-full bg-gaviota-green hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3 text-lg">
                  <Send size={20} />
                  Enviar {typeLabels[type].title}
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
