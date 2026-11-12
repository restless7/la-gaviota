/**
 * Abstract Notification Service for La Gaviota OS
 * Currently implemented for Meta WhatsApp Cloud API
 */

export type WhatsAppTemplateParameter = {
  type: 'text' | 'currency' | 'date_time' | 'document';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
};

export interface WhatsAppPayload {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: 'body' | 'header' | 'button';
      parameters: WhatsAppTemplateParameter[];
    }>;
  };
}

/**
 * Normalizes Colombian WhatsApp numbers to E.164 digits without '+'.
 * Returns null if the input has too few digits to represent a valid destination.
 */
export function normalizeColombianWhatsAppPhone(rawPhone: string): string | null {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;
  if (digits.startsWith('57') && digits.length >= 12) return digits;
  return `57${digits}`;
}

/**
 * Sends a Meta WhatsApp Cloud API template message safely without throwing into caller workflows.
 */
export async function sendWhatsAppTemplate(
  rawPhone: string,
  templateName: string,
  bodyParameters: WhatsAppTemplateParameter[],
  languageCode: string = 'es',
  contextLabel: string = templateName
): Promise<{ sent: boolean; mocked?: boolean; reason?: string }> {
  const formattedPhone = normalizeColombianWhatsAppPhone(rawPhone);
  if (!formattedPhone) {
    console.warn(`[WA NOTIFICATION SKIPPED] Invalid or missing destination phone for ${contextLabel}`);
    return { sent: false, reason: 'invalid_phone' };
  }

  const META_TOKEN = process.env.META_WA_ACCESS_TOKEN;
  const PHONE_ID = process.env.META_WA_PHONE_NUMBER_ID;

  const payload: WhatsAppPayload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: 'body',
          parameters: bodyParameters,
        },
      ],
    },
  };

  if (!META_TOKEN || !PHONE_ID) {
    console.log(`[MOCK WA NOTIFICATION:${contextLabel}] Payload listo para Meta:`, JSON.stringify(payload, null, 2));
    return { sent: true, mocked: true };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[WA NOTIFICATION ERROR:${contextLabel}] Meta API rejected request:`, errorData);
      return { sent: false, reason: `http_${response.status}` };
    }

    console.log(`[WA NOTIFICATION SUCCESS:${contextLabel}] Sent to ${formattedPhone}`);
    return { sent: true };
  } catch (error) {
    console.error(`[WA NOTIFICATION EXCEPTION:${contextLabel}] Failed to send WhatsApp message:`, error);
    return { sent: false, reason: 'network_error' };
  }
}

/**
 * Triggers an official WhatsApp notification via Meta's Graph API.
 * Uses Dependency Injection for testing or future provider swapping.
 */
export async function triggerOrderNotification(
  orderId: string,
  customerPhone: string,
  customerName: string,
  totalAmount: number
): Promise<void> {
  const safeName = (customerName || 'Cliente La Gaviota').trim();
  const safeTotal = Number.isFinite(totalAmount) && totalAmount > 0 ? Math.round(totalAmount) : 0;

  await sendWhatsAppTemplate(
    customerPhone,
    'order_confirmation',
    [
      { type: 'text', text: safeName },
      { type: 'text', text: orderId },
      {
        type: 'currency',
        currency: {
          fallback_value: `$${safeTotal} COP`,
          code: 'COP',
          amount_1000: safeTotal * 1000,
        },
      },
    ],
    'es',
    `order:${orderId}`
  );
}
