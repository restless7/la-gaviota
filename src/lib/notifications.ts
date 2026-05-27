/**
 * Abstract Notification Service for La Gaviota OS
 * Currently implemented for Meta WhatsApp Cloud API
 */

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
      parameters: Array<{
        type: 'text' | 'currency' | 'date_time' | 'document';
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount_1000: number;
        };
      }>;
    }>;
  };
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
  const META_TOKEN = process.env.META_WA_ACCESS_TOKEN;
  const PHONE_ID = process.env.META_WA_PHONE_NUMBER_ID;

  // Format phone number to international standard if not already
  const formattedPhone = customerPhone.startsWith('57') ? customerPhone : `57${customerPhone.replace(/\D/g, '')}`;

  const payload: WhatsAppPayload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: 'order_confirmation', // Must match approved template in Meta Business Manager
      language: {
        code: 'es'
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: orderId },
            { 
              type: 'currency', 
              currency: {
                fallback_value: `$${totalAmount} COP`,
                code: 'COP',
                amount_1000: totalAmount * 1000 // Meta expects amount * 1000
              }
            }
          ]
        }
      ]
    }
  };

  // 3. Manejo Silencioso de Errores si no hay env vars
  if (!META_TOKEN || !PHONE_ID) {
    console.log("[MOCK WA NOTIFICATION] Payload listo para Meta: ", JSON.stringify(payload, null, 2));
    return Promise.resolve(); // Resolve successfully so transaccional flow is not interrupted
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WA NOTIFICATION ERROR] Meta API rejected the request:', errorData);
      // We log but don't throw, to prevent crashing the webhook
    } else {
      console.log(`[WA NOTIFICATION SUCCESS] Sent to ${formattedPhone} for order ${orderId}`);
    }
  } catch (error) {
    console.error('[WA NOTIFICATION EXCEPTION] Failed to send WhatsApp message:', error);
  }
}
