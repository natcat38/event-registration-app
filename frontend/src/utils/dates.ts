// Mirror of the backend open rule; a date-only deadline ends at 23:59:59.999 Singapore time. see docs/adr/0003
const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;

/** End of a `YYYY-MM-DD` SGT calendar date (23:59:59.999 SGT) as a UTC instant. */
function endOfDaySgt(deadline: string): Date {
  const [year, month, day] = deadline.split('-').map(Number);
  const nextDayMidnightSgtAsUtc = Date.UTC(year, month - 1, day + 1) - SGT_OFFSET_MS;
  return new Date(nextDayMidnightSgtAsUtc - 1);
}

export interface OpenCheckEvent {
  deadline: string;
  capacity: number;
  registrationCount: number;
}

/** Same rule as the backend's `openState` (docs/adr/0003): not past deadline AND under capacity. */
export function isOpen(event: OpenCheckEvent, now: Date = new Date()): boolean {
  const withinDeadline = now <= endOfDaySgt(event.deadline);
  const hasCapacity = event.registrationCount < event.capacity;
  return withinDeadline && hasCapacity;
}

/** Renders an ISO UTC instant in Singapore local time, e.g. "25 Apr 2026, 6:00 pm". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
