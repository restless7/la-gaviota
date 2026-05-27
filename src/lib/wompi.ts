import crypto from 'crypto';

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
  signatureProperties: {
    properties: [string, string, string, string];
    checksum: string;
  },
  transaction: any,
  timestamp: string
): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) {
    console.warn('WOMPI_EVENTS_SECRET is not configured.');
    return false;
  }

  // Build the string based on properties array (usually: id, status, amount_in_cents) + timestamp + secret
  // properties usually maps to transaction properties, but typical format is:
  // transaction.id + transaction.status + transaction.amount_in_cents + timestamp + secret
  const { id, status, amount_in_cents } = transaction;
  
  const stringToHash = `${id}${status}${amount_in_cents}${timestamp}${secret}`;
  const generatedChecksum = crypto.createHash('sha256').update(stringToHash, 'utf8').digest('hex');

  return generatedChecksum === signatureProperties.checksum;
}

/**
 * Utility to format COP to cents for Wompi API
 */
export function formatToCents(amountCOP: number): number {
  return Math.round(amountCOP * 100);
}
