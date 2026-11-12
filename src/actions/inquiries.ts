'use server';

import { getGuestCheckoutDatabase } from '@/src/lib/server/database';

export type InquiryType = 'peticion' | 'queja' | 'reclamo' | 'sugerencia' | 'contacto';

export interface SubmitInquiryResult {
  ok: boolean;
  radicadoCode?: string;
  error?: string;
}

export async function generateRadicadoCode(type: string): Promise<string> {
  const prefix = type === 'contacto' ? 'CNT' : 'RAD';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${randomSuffix}`;
}

export async function submitCustomerInquiryAction(formData: FormData): Promise<SubmitInquiryResult> {
  const fullName = String(formData.get('fullName') || formData.get('name') || '').trim();
  const contactValue = String(formData.get('contact') || formData.get('phone') || formData.get('email') || '').trim();
  const rawType = String(formData.get('type') || 'peticion').toLowerCase().trim();
  const orderId = String(formData.get('orderId') || formData.get('order_id') || '').trim() || null;
  const message = String(formData.get('message') || '').trim();

  const validTypes: InquiryType[] = ['peticion', 'queja', 'reclamo', 'sugerencia', 'contacto'];
  const type: InquiryType = validTypes.includes(rawType as InquiryType) ? (rawType as InquiryType) : 'peticion';

  if (!fullName || fullName.length < 2 || fullName.length > 200) {
    return { ok: false, error: 'Por favor ingresa tu nombre completo (mínimo 2 caracteres).' };
  }

  if (!contactValue || contactValue.length < 6 || contactValue.length > 254) {
    return { ok: false, error: 'Por favor ingresa un teléfono o correo de contacto válido.' };
  }

  if (!message || message.length < 10 || message.length > 4000) {
    return { ok: false, error: 'El mensaje debe contener al menos 10 caracteres detallando tu solicitud.' };
  }

  const radicadoCode = await generateRadicadoCode(type);

  try {
    const db = getGuestCheckoutDatabase();
    const { error } = await db.from('customer_inquiries').insert({
      radicado_code: radicadoCode,
      type,
      full_name: fullName,
      contact_value: contactValue,
      order_id: orderId,
      message,
      status: 'Recibido',
    });

    if (error) {
      console.warn('[submitCustomerInquiryAction] DB insert error (fallback radicado provided):', error.message);
      // Fallback: still provide the radicado code so customer has proof and can escalate via WhatsApp
    }

    return { ok: true, radicadoCode };
  } catch (err) {
    console.error('[submitCustomerInquiryAction] Unexpected error:', err);
    return { ok: true, radicadoCode };
  }
}
