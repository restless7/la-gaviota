'use client';

import { useState } from 'react';
import { submitCustomerInquiryAction } from '@/src/actions/inquiries';
import { CheckCircle2, PhoneCall } from 'lucide-react';

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [radicadoCode, setRadicadoCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    form.set('type', 'contacto');

    try {
      const res = await submitCustomerInquiryAction(form);
      if (res.ok && res.radicadoCode) {
        setRadicadoCode(res.radicadoCode);
      } else {
        setErrorMessage(res.error || 'No pudimos registrar tu mensaje. Por favor intenta nuevamente.');
      }
    } catch {
      setErrorMessage('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (radicadoCode) {
    const whatsappUrl = `https://wa.me/573112694676?text=${encodeURIComponent(
      `¡Hola Surtifruver La Gaviota! Acabo de enviar un mensaje de contacto con el radicado *${radicadoCode}*.`
    )}`;

    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-8 text-center animate-fade-in space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800">¡Mensaje Recibido!</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Hemos recibido tu consulta con radicado oficial:
        </p>
        <p className="font-mono text-xl font-black text-slate-900 bg-white py-2 px-4 rounded-xl border border-emerald-200 inline-block shadow-sm">
          {radicadoCode}
        </p>
        <p className="text-xs text-slate-500">
          Te contactaremos al teléfono o correo indicado en máximo 24 horas hábiles.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] px-5 py-3 text-xs font-bold text-white shadow-sm transition-colors"
          >
            <PhoneCall size={14} /> Escribir por WhatsApp a Soporte
          </a>
          <button
            type="button"
            onClick={() => setRadicadoCode(null)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Enviar otra consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div role="alert" className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
          {errorMessage}
        </div>
      )}
      <div>
        <label htmlFor="contact-name" className="mb-2 block text-sm font-bold text-gray-700">Nombre completo *</label>
        <input id="contact-name" name="name" required maxLength={150} autoComplete="name" placeholder="Tu nombre" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green" />
      </div>
      <div>
        <label htmlFor="contact-phone" className="mb-2 block text-sm font-bold text-gray-700">Teléfono o WhatsApp de contacto *</label>
        <input id="contact-phone" name="phone" required maxLength={254} placeholder="Ej. 311 269 4676" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green" />
      </div>
      <div>
        <label htmlFor="contact-type" className="mb-2 block text-sm font-bold text-gray-700">Tipo de cliente</label>
        <select id="contact-type" name="type" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green">
          <option value="Familia / Hogar">Familia / Hogar</option>
          <option value="Restaurante / Hotel">Restaurante / Hotel</option>
          <option value="Micromercado / Tienda">Micromercado / Tienda</option>
        </select>
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-2 block text-sm font-bold text-gray-700">Mensaje o Consulta *</label>
        <textarea id="contact-message" name="message" required maxLength={3000} rows={5} placeholder="Cuéntanos en qué podemos servirte..." className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gaviota-green focus:ring-1 focus:ring-gaviota-green" />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-gaviota-red hover:bg-red-700 px-6 py-3 font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Enviando...' : 'Enviar Consulta Directa'}
      </button>
      <p role="status" className="text-xs text-slate-500">
        Tu mensaje se radicará en el sistema de atención de Surtifruver La Gaviota y recibirás un código de seguimiento inmediato.
      </p>
    </form>
  );
}
