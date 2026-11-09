/**
 * Single source of truth for La Gaviota delivery scheduling & cutoff rules.
 * 
 * Commercial Policy:
 * - Operating cutoff: 10:00 PM (22:00 Colombia Time / UTC-5).
 * - Orders placed before 10:00 PM are scheduled for the next business day (Monday - Saturday).
 * - Orders placed at or after 10:00 PM (22:00) DO NOT apply for next day: they can still be placed,
 *   but are scheduled for the day after next (+2 business days, skipping Sundays).
 * - Sundays (day 0) are non-operating delivery days; shipments roll over to Monday.
 */

export const CUTOFF_HOUR_24H = 22; // 10:00 PM

export interface DeliveryScheduleCalculation {
  /** ISO date string YYYY-MM-DD for scheduled_delivery_date in database */
  scheduledDateIso: string;
  /** Human friendly formatted string (e.g., "Miércoles, 11/11/2026") */
  formattedDate: string;
  /** Whether the order was created at or past the 10:00 PM cutoff */
  isAfterCutoff: boolean;
  /** Short badge or notice text to display */
  disclaimer: string;
  /** Cutoff warning banner for UI */
  bannerNotice: string;
}

/**
 * Returns current date and time normalized to Colombia Time (UTC-5).
 */
export function getColombiaCurrentDate(baseDate: Date = new Date()): Date {
  const colombiaStr = baseDate.toLocaleString('en-US', { timeZone: 'America/Bogota' });
  return new Date(colombiaStr);
}

/**
 * Computes scheduled delivery date based on 10:00 PM cutoff and Sunday exclusion.
 */
export function calculateDeliverySchedule(baseDate: Date = new Date()): DeliveryScheduleCalculation {
  const colDate = getColombiaCurrentDate(baseDate);
  const currentHour = colDate.getHours();
  const isAfterCutoff = currentHour >= CUTOFF_HOUR_24H;

  // Add initial delivery offset: 1 day if before 10pm, 2 days if at/after 10pm
  const initialOffsetDays = isAfterCutoff ? 2 : 1;
  colDate.setDate(colDate.getDate() + initialOffsetDays);

  // If the target delivery day lands on Sunday (0), move to Monday (+1 day)
  if (colDate.getDay() === 0) {
    colDate.setDate(colDate.getDate() + 1);
  }

  const year = colDate.getFullYear();
  const month = String(colDate.getMonth() + 1).padStart(2, '0');
  const day = String(colDate.getDate()).padStart(2, '0');
  const scheduledDateIso = `${year}-${month}-${day}`;

  const formattedDate = colDate.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const disclaimer = isAfterCutoff
    ? '⚠️ Pedido realizado después de las 10:00 PM: Por ciclo logístico de cosecha y alistamiento nocturno, tu pedido se entregará pasado mañana.'
    : '✅ Pedido dentro del horario hábil: Tu entrega está programada para el día de mañana.';

  const bannerNotice = isAfterCutoff
    ? 'Por favor ten en cuenta: Los pedidos realizados después de las 10:00 PM no aplican para entrega al día siguiente. Tu mercado llegará pasado mañana con frescura garantizada.'
    : 'Horario de corte: 10:00 PM. Los pedidos confirmados antes de las 10:00 PM se entregan al día siguiente.';

  return {
    scheduledDateIso,
    formattedDate,
    isAfterCutoff,
    disclaimer,
    bannerNotice,
  };
}
