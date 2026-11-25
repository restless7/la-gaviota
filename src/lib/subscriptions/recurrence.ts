/**
 * LG-SUB-001 — Deterministic Recurrence Engine for La Gaviota
 * 
 * Rules:
 * - Timezone: America/Bogota (UTC-5)
 * - Operating Days: Monday (1) through Saturday (6). Sunday (0) is closed for deliveries.
 * - Frequencies:
 *   - WEEKLY: Every 7 calendar days. Preserves preferred weekday.
 *   - EVERY_15_DAYS: Exactly 15 calendar days from anchor.
 *   - MONTHLY: Same day of calendar month, clamping to last day in shorter months (e.g. 31st -> Feb 28/29),
 *     while preserving original anchor day so subsequent months do NOT permanently drift.
 */

export type SubscriptionFrequency = 'WEEKLY' | 'EVERY_15_DAYS' | 'MONTHLY';

export interface RecurrenceOptions {
  frequency: SubscriptionFrequency;
  anchorDate: string | Date; // YYYY-MM-DD or Date
  fromDate?: string | Date;  // Reference date to calculate from (defaults to today)
  blackoutDates?: string[];  // ['YYYY-MM-DD'] holidays or store closures
  preferredDayOfWeek?: number; // 0=Sun, 1=Mon, ..., 6=Sat
}

/** Formats a date as YYYY-MM-DD in America/Bogota */
export function formatBogotaDateIso(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find(p => p.type === 'year')?.value || '1970';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
}

/** Parses a YYYY-MM-DD string into a Date object at midday UTC to avoid day-boundary shifts */
export function parseBogotaDate(isoDateStr: string): Date {
  const [year, month, day] = isoDateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/** Determines if a given date is an operating delivery day (Mon-Sat, not in blackout) */
export function isDeliveryOperatingDay(date: Date, blackoutDates: Set<string> = new Set()): boolean {
  // Sunday is day 0 in UTC when parsed via parseBogotaDate
  const dayOfWeek = date.getUTCDay();
  if (dayOfWeek === 0) return false; // Sunday closed

  const iso = formatBogotaDateIso(date);
  if (blackoutDates.has(iso)) return false;

  return true;
}

/** Shifts date forward to the nearest operating delivery day (skipping Sundays and blackouts) */
export function shiftToNextOperatingDay(date: Date, blackoutDates: Set<string> = new Set()): Date {
  const current = new Date(date.getTime());
  while (!isDeliveryOperatingDay(current, blackoutDates)) {
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return current;
}

/** Calculates the number of days in a specific month (1-indexed month: 1=Jan, 12=Dec) */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Calculates the next delivery date after fromDate, following the specified frequency.
 * Returns an ISO date string (YYYY-MM-DD).
 */
export function calculateNextDeliveryDate(options: RecurrenceOptions): string {
  const { frequency, anchorDate, fromDate, blackoutDates = [] } = options;
  const blackouts = new Set(blackoutDates);

  const anchorIso = typeof anchorDate === 'string' ? anchorDate : formatBogotaDateIso(anchorDate);
  const fromIso = fromDate ? (typeof fromDate === 'string' ? fromDate : formatBogotaDateIso(fromDate)) : formatBogotaDateIso(new Date());

  const anchor = parseBogotaDate(anchorIso);
  const from = parseBogotaDate(fromIso);

  const [anchorYear, anchorMonth, anchorDay] = anchorIso.split('-').map(Number);

  let candidate: Date;

  if (frequency === 'WEEKLY') {
    // Target weekday is determined by anchor
    candidate = new Date(anchor.getTime());
    while (candidate.getTime() <= from.getTime()) {
      candidate.setUTCDate(candidate.getUTCDate() + 7);
    }
  } else if (frequency === 'EVERY_15_DAYS') {
    candidate = new Date(anchor.getTime());
    while (candidate.getTime() <= from.getTime()) {
      candidate.setUTCDate(candidate.getUTCDate() + 15);
    }
  } else if (frequency === 'MONTHLY') {
    // Preserve the original anchorDay (e.g. 31)
    const fromYear = from.getUTCFullYear();
    const fromMonth = from.getUTCMonth() + 1; // 1-12

    let targetYear = fromYear;
    let targetMonth = fromMonth;

    // Check if the occurrence in the current 'from' month has already passed
    const maxDaysCurrentMonth = getDaysInMonth(targetYear, targetMonth);
    const dayInCurrentMonth = Math.min(anchorDay, maxDaysCurrentMonth);
    const candidateCurrentMonth = new Date(Date.UTC(targetYear, targetMonth - 1, dayInCurrentMonth, 12, 0, 0));

    if (candidateCurrentMonth.getTime() > from.getTime()) {
      candidate = candidateCurrentMonth;
    } else {
      // Advance to next month
      targetMonth += 1;
      if (targetMonth > 12) {
        targetMonth = 1;
        targetYear += 1;
      }
      const maxDaysNextMonth = getDaysInMonth(targetYear, targetMonth);
      const dayInNextMonth = Math.min(anchorDay, maxDaysNextMonth);
      candidate = new Date(Date.UTC(targetYear, targetMonth - 1, dayInNextMonth, 12, 0, 0));
    }
  } else {
    throw new Error(`UNKNOWN_FREQUENCY: ${frequency}`);
  }

  // Shift candidate if it lands on Sunday or a blackout date
  const operatingCandidate = shiftToNextOperatingDay(candidate, blackouts);
  return formatBogotaDateIso(operatingCandidate);
}

/**
 * Calculates a series of N upcoming delivery dates for UI presentation or schedule preview.
 */
export function getUpcomingDeliveryDates(
  options: RecurrenceOptions,
  count: number = 4
): string[] {
  const dates: string[] = [];
  let currentFrom = options.fromDate;

  for (let i = 0; i < count; i++) {
    const nextDate = calculateNextDeliveryDate({
      ...options,
      fromDate: currentFrom,
    });
    dates.push(nextDate);
    currentFrom = nextDate;
  }

  return dates;
}

/**
 * Checks if a given delivery date has passed the operational cutoff (10:00 PM Bogota time on the day before).
 */
export function isPastOperationalCutoff(
  deliveryDateIso: string,
  nowDate: Date = new Date()
): boolean {
  const nowBogota = new Date(nowDate.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const todayIso = formatBogotaDateIso(nowBogota);
  const currentHour = nowBogota.getHours();

  const [delYear, delMonth, delDay] = deliveryDateIso.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = todayIso.split('-').map(Number);

  const deliveryUtc = Date.UTC(delYear, delMonth - 1, delDay);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  const diffDays = Math.round((deliveryUtc - todayUtc) / (24 * 60 * 60 * 1000));

  // If delivery is in the past or today, cutoff has passed
  if (diffDays <= 0) return true;

  // If delivery is tomorrow, cutoff passes at 10:00 PM (22:00) today
  if (diffDays === 1 && currentHour >= 22) return true;

  return false;
}

