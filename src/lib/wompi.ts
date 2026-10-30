import crypto from 'crypto';
import { assertStagingSafety } from './safetyGuard';

export function assertWompiCheckoutConfigured(): string {
  assertStagingSafety();
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUB_KEY;
  if (!publicKey || !process.env.WOMPI_INTEGRITY_SECRET) throw new Error('El pago en línea no está configurado. Elige contra entrega.');
  return publicKey;
}

/**
 * Generates the Wompi integrity signature required for creating transactions.
 * Uses the integrity secret from environment variables.
 * Format: concatenates reference + amountInCents + currency + secret, then hashes using SHA-256 hex.
 */
export function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string = 'COP'
): string {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) {
    throw new Error('WOMPI_INTEGRITY_SECRET is not configured.');
  }

  const concatenatedString = `${reference}${amountInCents}${currency}${secret}`;
  return crypto.createHash('sha256').update(concatenatedString, 'utf8').digest('hex');
}

/**
 * Validates a Wompi webhook signature to ensure the event is authentic.
 * Uses the events secret from environment variables.
 */
export function validateWebhookSignature(
  signature: unknown,
  transaction: unknown,
  timestamp: string
): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret || !signature || typeof signature !== 'object' || !transaction || typeof transaction !== 'object' || !/^\d{1,16}$/.test(timestamp)) return false;
  const { properties, checksum } = signature as { properties?: unknown; checksum?: unknown };
  if (!Array.isArray(properties) || properties.length === 0 || properties.length > 16 || typeof checksum !== 'string' || !/^[a-f0-9]{64}$/i.test(checksum)) return false;
  // Wompi defines the ordered property paths in each event, relative to data.
  // A valid checksum authenticates these fields only; it does not authorize an unsigned reference.
  const required = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  if (!required.every(path => properties.includes(path))) return false;
  const parts: string[] = [];
  for (const path of properties) {
    if (typeof path !== 'string' || !/^transaction(?:\.[a-zA-Z0-9_]+){1,4}$/.test(path)) return false;
    let value: unknown = transaction;
    for (const key of path.split('.').slice(1)) {
      if (!value || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, key) || ['__proto__', 'constructor', 'prototype'].includes(key)) return false;
      value = (value as Record<string, unknown>)[key];
    }
    if (typeof value !== 'string' && !(typeof value === 'number' && Number.isSafeInteger(value))) return false;
    parts.push(String(value));
  }
  const expected = crypto.createHash('sha256').update(parts.join('') + timestamp + secret, 'utf8').digest();
  return crypto.timingSafeEqual(expected, Buffer.from(checksum, 'hex'));
}

/**
 * Utility to format COP to cents for Wompi API
 */
export function formatToCents(amountCOP: number): number {
  const cents = amountCOP * 100;
  if (!Number.isFinite(amountCOP) || amountCOP <= 0 || !Number.isSafeInteger(cents)) throw new Error('Monto inválido');
  return cents;
}

/** Only terminal statuses may change an order. Pending/unknown never unlock fulfilment. */
export function orderStatusForWompi(status: unknown): 'Pendiente' | 'Cancelado' | null {
  if (status === 'APPROVED') return 'Pendiente';
  if (['DECLINED', 'VOIDED', 'ERROR', 'FAILED'].includes(status as string)) return 'Cancelado';
  return null;
}
