'use client';

import { useState } from 'react';

export function ContactForm() {
  const recipient = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const [notice, setNotice] = useState('');

  function prepareEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recipient) return;
    const form = new FormData(event.currentTarget);
    const body = `Nombre: ${form.get('name')}\nContacto: ${form.get('phone')}\nTipo de cliente: ${form.get('type')}\n\n${form.get('message')}`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent('Consulta a La Gaviota')}&body=${encodeURIComponent(body)}`;
    setNotice('Completa el envío en tu aplicación de correo. Este formulario no envía ni registra el mensaje automáticamente.');
  }

  return (
    <form onSubmit={prepareEmail} className="space-y-6">
      <div>
        <label htmlFor="contact-name" className="mb-2 block text-sm font-bold text-gray-700">Nombre completo</label>
        <input id="contact-name" name="name" required maxLength={150} autoComplete="name" className="w-full rounded-xl border border-gray-300 px-4 py-3" />
      </div>
      <div>
        <label htmlFor="contact-phone" className="mb-2 block text-sm font-bold text-gray-700">Teléfono o correo de contacto</label>
        <input id="contact-phone" name="phone" required maxLength={254} className="w-full rounded-xl border border-gray-300 px-4 py-3" />
      </div>
      <div>
        <label htmlFor="contact-type" className="mb-2 block text-sm font-bold text-gray-700">Tipo de cliente</label>
        <select id="contact-type" name="type" className="w-full rounded-xl border border-gray-300 px-4 py-3">
          <option>Familia / Hogar</option><option>Restaurante / Hotel</option><option>Micromercado / Tienda</option>
        </select>
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-2 block text-sm font-bold text-gray-700">Mensaje</label>
        <textarea id="contact-message" name="message" required maxLength={3000} rows={5} className="w-full rounded-xl border border-gray-300 px-4 py-3" />
      </div>
      <button disabled={!recipient} className="rounded-xl bg-gaviota-red px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Preparar correo</button>
      <p role="status" className="text-sm text-slate-600">{notice || (recipient ? 'Abriremos tu aplicación de correo para que revises y envíes el mensaje.' : 'El canal de correo estará disponible cuando termine la configuración de atención al cliente.')}</p>
    </form>
  );
}
