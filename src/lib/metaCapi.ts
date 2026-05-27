// src/lib/metaCapi.ts

interface CapiPurchasePayload {
  orderId: string;
  totalAmount: number;
  currency?: string;
  customerEmail?: string;
  customerPhone?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

export async function sendPurchaseEventToMeta(payload: CapiPurchasePayload) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('[Meta CAPI] Skipping Purchase event. Missing META_PIXEL_ID or META_CAPI_TOKEN in environment.');
    return;
  }

  // Meta requires user data to be hashed in SHA-256
  // In a production environment with Node crypto:
  // const crypto = require('crypto');
  // const hash = (val: string) => crypto.createHash('sha256').update(val.toLowerCase().trim()).digest('hex');

  // For this implementation, we will pass them unhashed and let Meta's JS/SDK hash them if needed, 
  // but strictly CAPI expects pre-hashed data. To keep it simple and dependency-free here, 
  // we'll use the Web Crypto API if available or send them directly (Meta rejects unhashed PII strictly, 
  // so we'll implement a fast SHA-256 hash using native Node crypto).

  const crypto = require('crypto');
  const hash = (val: string | undefined) => {
    if (!val) return undefined;
    return crypto.createHash('sha256').update(val.toLowerCase().trim()).digest('hex');
  };

  const eventData = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: {
          em: [hash(payload.customerEmail)],
          ph: [hash(payload.customerPhone)],
          client_ip_address: payload.clientIpAddress || '0.0.0.0',
          client_user_agent: payload.clientUserAgent || 'LaGaviotaServer/1.0',
        },
        custom_data: {
          currency: payload.currency || 'COP',
          value: payload.totalAmount,
          order_id: payload.orderId
        }
      }
    ]
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Meta CAPI Error]', result);
    } else {
      console.log(`[Meta CAPI] Purchase event sent successfully for order: ${payload.orderId}. Events received: ${result.events_received}`);
    }
  } catch (error) {
    console.error('[Meta CAPI] Network error while sending event to Meta', error);
  }
}
