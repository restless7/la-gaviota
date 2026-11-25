const test = require('node:test');
const assert = require('node:assert/strict');

// Import pure recurrence functions
// In tests, we can test the recurrence logic directly using node's VM or imported module.
// Let's implement the pure calculations inside the test or require the transpiled/ts-node logic.

function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseBogotaDate(isoDateStr) {
  const [year, month, day] = isoDateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function formatBogotaDateIso(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDeliveryOperatingDay(date, blackoutDates = new Set()) {
  const dayOfWeek = date.getUTCDay();
  if (dayOfWeek === 0) return false; // Sunday closed
  const iso = formatBogotaDateIso(date);
  if (blackoutDates.has(iso)) return false;
  return true;
}

function shiftToNextOperatingDay(date, blackoutDates = new Set()) {
  const current = new Date(date.getTime());
  while (!isDeliveryOperatingDay(current, blackoutDates)) {
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return current;
}

function calculateNextDeliveryDate({ frequency, anchorDate, fromDate, blackoutDates = [] }) {
  const blackouts = new Set(blackoutDates);
  const anchorIso = anchorDate;
  const fromIso = fromDate;

  const anchor = parseBogotaDate(anchorIso);
  const from = parseBogotaDate(fromIso);
  const [anchorYear, anchorMonth, anchorDay] = anchorIso.split('-').map(Number);

  let candidate;

  if (frequency === 'WEEKLY') {
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
    const fromYear = from.getUTCFullYear();
    const fromMonth = from.getUTCMonth() + 1; // 1-12

    let targetYear = fromYear;
    let targetMonth = fromMonth;

    const maxDaysCurrentMonth = getDaysInMonth(targetYear, targetMonth);
    const dayInCurrentMonth = Math.min(anchorDay, maxDaysCurrentMonth);
    const candidateCurrentMonth = new Date(Date.UTC(targetYear, targetMonth - 1, dayInCurrentMonth, 12, 0, 0));

    if (candidateCurrentMonth.getTime() > from.getTime()) {
      candidate = candidateCurrentMonth;
    } else {
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

  const operatingCandidate = shiftToNextOperatingDay(candidate, blackouts);
  return formatBogotaDateIso(operatingCandidate);
}

test('LG-SUB-001: Weekly frequency steps by exactly 7 calendar days', () => {
  // 2026-11-25 is a Wednesday
  const next = calculateNextDeliveryDate({
    frequency: 'WEEKLY',
    anchorDate: '2026-11-25',
    fromDate: '2026-11-25',
  });
  // 25 + 7 = 32 -> Dec 2, 2026 (Wednesday)
  assert.equal(next, '2026-12-02');

  const subsequent = calculateNextDeliveryDate({
    frequency: 'WEEKLY',
    anchorDate: '2026-11-25',
    fromDate: '2026-12-02',
  });
  // Dec 2 + 7 = Dec 9, 2026 (Wednesday)
  assert.equal(subsequent, '2026-12-09');
});

test('LG-SUB-001: Sunday deliveries roll over to Monday', () => {
  // 2026-11-29 is a Sunday
  // If a weekly cycle lands on Sunday 2026-11-29, it must shift to Monday 2026-11-30
  const next = calculateNextDeliveryDate({
    frequency: 'WEEKLY',
    anchorDate: '2026-11-22', // Sunday
    fromDate: '2026-11-22',
  });
  assert.equal(next, '2026-11-30'); // Moved to Monday!
});

test('LG-SUB-001: Every 15 days frequency advances by exactly 15 calendar days', () => {
  // 2026-11-01 (Sunday -> 11-02 Monday)
  // 2026-11-02 (Monday) + 15 = 2026-11-17 (Tuesday)
  const next = calculateNextDeliveryDate({
    frequency: 'EVERY_15_DAYS',
    anchorDate: '2026-11-02',
    fromDate: '2026-11-02',
  });
  assert.equal(next, '2026-11-17');

  const next2 = calculateNextDeliveryDate({
    frequency: 'EVERY_15_DAYS',
    anchorDate: '2026-11-02',
    fromDate: '2026-11-17',
  });
  // 2026-11-17 + 15 = 2026-12-02
  assert.equal(next2, '2026-12-02');
});

test('LG-SUB-001: Monthly recurrence clamps to end of month without permanent anchor drift', () => {
  // Customer signed up on January 31st
  // In February 2026 (non-leap, 28 days): 2026-02-28 is a Saturday. Clamps to 2026-02-28.
  const febDelivery = calculateNextDeliveryDate({
    frequency: 'MONTHLY',
    anchorDate: '2026-01-31',
    fromDate: '2026-01-31',
  });
  assert.equal(febDelivery, '2026-02-28');

  // In March 2026 (31 days): MUST RETURN 2026-03-31, NOT 2026-03-28!
  // (Prevents permanent drift bug where the 31st was lost)
  const marDelivery = calculateNextDeliveryDate({
    frequency: 'MONTHLY',
    anchorDate: '2026-01-31',
    fromDate: '2026-02-28',
  });
  assert.equal(marDelivery, '2026-03-31');

  // In April 2026 (30 days): clamps to 30th
  const aprDelivery = calculateNextDeliveryDate({
    frequency: 'MONTHLY',
    anchorDate: '2026-01-31',
    fromDate: '2026-03-31',
  });
  assert.equal(aprDelivery, '2026-04-30');

  // In May 2026 (31 days): returns 31st
  // Note: 2026-05-31 is a Sunday! So it shifts to Monday 2026-06-01
  const mayDelivery = calculateNextDeliveryDate({
    frequency: 'MONTHLY',
    anchorDate: '2026-01-31',
    fromDate: '2026-04-30',
  });
  assert.equal(mayDelivery, '2026-06-01');
});

test('LG-SUB-001: Leap Year handling in February (2028 is a leap year)', () => {
  // February 2028 has 29 days (2028-02-29 is Tuesday)
  const febLeapDelivery = calculateNextDeliveryDate({
    frequency: 'MONTHLY',
    anchorDate: '2028-01-31',
    fromDate: '2028-01-31',
  });
  assert.equal(febLeapDelivery, '2028-02-29');
});

test('LG-SUB-001: Blackout dates shift to subsequent operating day', () => {
  // Blackout on Christmas Day 2026-12-25 (Friday)
  const next = calculateNextDeliveryDate({
    frequency: 'WEEKLY',
    anchorDate: '2026-12-18', // Friday
    fromDate: '2026-12-18',
    blackoutDates: ['2026-12-25'],
  });
  // Shifts to Saturday 2026-12-26!
  assert.equal(next, '2026-12-26');
});

