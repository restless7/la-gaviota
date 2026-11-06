/**
 * WhatsApp utilities for PlanMaestro / La Gaviota
 * Generates direct chat links and pre-filled operational messages for CRM and order lifecycle.
 */

export function cleanColombianPhoneNumber(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  // Strip non-digits
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';

  // If already starts with 57 and has 12 digits (e.g. 573112694676)
  if (digits.startsWith('57') && digits.length === 12) {
    return digits;
  }
  // If 10 digits starting with 3 (Colombian mobile standard: 3XXXXXXXXX)
  if (digits.length === 10 && digits.startsWith('3')) {
    return `57${digits}`;
  }
  // If 11 digits starting with 03 (e.g. 03112694676)
  if (digits.length === 11 && digits.startsWith('03')) {
    return `57${digits.slice(1)}`;
  }
  // Default to digits prefixed if >= 10
  if (digits.length === 10) {
    return `57${digits}`;
  }
  return digits;
}

export function buildWhatsAppChatUrl(phone?: string | null, message?: string): string {
  const cleanPhone = cleanColombianPhoneNumber(phone);
  const baseUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : `https://wa.me/573112694676`;
  if (!message) return baseUrl;
  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

export interface OrderConfirmationParams {
  id: string;
  customer_name: string;
  customer_phone?: string | null;
  total_amount: number;
  delivery_address?: string | null;
  delivery_municipality?: string | null;
  status?: string;
  order_items?: Array<{ product_name: string; quantity: number }>;
}

export function buildOrderConfirmationMessage(order: OrderConfirmationParams): string {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const formattedTotal = Number(order.total_amount).toLocaleString('es-CO');
  const address = order.delivery_address
    ? `${order.delivery_address}${order.delivery_municipality ? `, ${order.delivery_municipality}` : ''}`
    : 'Dirección registrada';

  let msg = `¡Hola *${order.customer_name}*! 🥑\n\n`;
  msg += `Te saludamos de *Surtifruver La Gaviota*. Confirmamos la recepción de tu pedido *#${shortId}* por un valor de *$${formattedTotal}*.\n\n`;
  msg += `📍 *Dirección de entrega:* ${address}\n`;
  msg += `📦 *Estado actual:* ${order.status || 'Confirmado'}\n\n`;

  if (order.order_items && order.order_items.length > 0) {
    msg += `🧺 *Resumen de productos:*\n`;
    order.order_items.slice(0, 6).forEach(item => {
      msg += `• ${item.quantity}x ${item.product_name}\n`;
    });
    if (order.order_items.length > 6) {
      msg += `• ...y ${order.order_items.length - 6} producto(s) más\n`;
    }
    msg += `\n`;
  }

  msg += `Estamos seleccionando tus frutas y verduras frescas directo del campo a tu mesa.\n`;
  msg += `Puedes hacer seguimiento en vivo a tu pedido aquí:\n`;
  msg += `https://www.lagaviotafruver.com/pedidos/${order.id}\n\n`;
  msg += `¡Muchas gracias por elegir La Gaviota! 🥦✨`;

  return msg;
}

export function buildCustomerGreetingMessage(customerName: string, businessName?: string | null): string {
  const displayName = businessName || customerName;
  return `¡Hola *${displayName}*! 🥑 Te saludamos de *Surtifruver La Gaviota*. Nos comunicamos para acompañar tus pedidos y compras de frutas y verduras frescas del campo. ¿En qué podemos ayudarte el día de hoy? 🥦✨`;
}
