const ET_TIMEZONE = "America/New_York";

/** Format a Date as YYYYMMDD in ET */
export function formatDateESPN(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${year}${month}${day}`;
}

/** Get today's date in ET as a Date object (midnight ET) */
export function todayET(): Date {
  const now = new Date();
  const etString = now.toLocaleDateString("en-US", {
    timeZone: ET_TIMEZONE,
  });
  return new Date(etString);
}

/** Get yesterday's date in ET */
export function yesterdayET(): Date {
  const today = todayET();
  today.setDate(today.getDate() - 1);
  return today;
}

/** Get a date N days from today in ET */
export function daysFromTodayET(n: number): Date {
  const today = todayET();
  today.setDate(today.getDate() + n);
  return today;
}

/** Format a date for display: "Mon, Jan 26" */
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** Format a time for display: "7:30 PM ET" */
export function formatTimeDisplay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return `${time} ET`;
}

/** Check if a date falls on today in ET */
export function isToday(date: Date): boolean {
  return formatDateESPN(date) === formatDateESPN(new Date());
}

/** Format a date range for the header: "Feb 22 – Mar 7, 2026" */
export function formatDateRange(start: Date, end: Date): string {
  const startParts = new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TIMEZONE,
    month: "short",
    day: "numeric",
  }).format(start);

  const endParts = new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(end);

  return `${startParts} \u2013 ${endParts}`;
}
