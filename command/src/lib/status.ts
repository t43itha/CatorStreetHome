// Compliance status engine (plan §5.2, §5.3). Dates are ISO calendar dates (YYYY-MM-DD)
// on the Europe/London calendar. No Date arithmetic touches a local time zone.

export type Status = "na" | "done" | "missing" | "overdue" | "urgent" | "soon" | "early" | "current";

export const STATUS_LABEL: Record<Status, string> = {
  na: "N/A",
  done: "Done",
  missing: "Missing",
  overdue: "Overdue",
  urgent: "Urgent",
  soon: "Due soon",
  early: "Early warning",
  current: "Current",
};

export interface ObligationLike {
  dueDate?: string;
  satisfiedAt?: string;
  isNotApplicable?: boolean;
}

const DAY_MS = 86_400_000;

function utcMidnight(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Today's date on the London calendar, as YYYY-MM-DD. */
export function todayLondon(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Whole calendar days from `from` to `to` (positive when `to` is later). */
export function diffCalendarDays(to: string, from: string): number {
  return Math.round((utcMidnight(to) - utcMidnight(from)) / DAY_MS);
}

export function addDays(iso: string, days: number): string {
  return new Date(utcMidnight(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function status(o: ObligationLike, today: string): Status {
  if (o.isNotApplicable) return "na";
  if (o.satisfiedAt) return "done";
  if (!o.dueDate) return "missing";
  const days = diffCalendarDays(o.dueDate, today);
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  if (days <= 60) return "early";
  return "current";
}

/** The one urgency rule used by Home, the KPI count, the sidebar badge and the digest. */
export function isUrgent(
  o: ObligationLike,
  today: string,
  ctx: { isStatutory: boolean; propertyLet: boolean },
): boolean {
  const s = status(o, today);
  return s === "overdue" || s === "urgent" || (s === "missing" && ctx.isStatutory && ctx.propertyLet);
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "3 days overdue", "today", "in 5 days". */
export function formatDue(days: number): string {
  if (days < 0) return `${plural(-days, "day")} overdue`;
  if (days === 0) return "today";
  return `in ${plural(days, "day")}`;
}

/** "28 Nov". */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(utcMidnight(iso)),
  );
}

export { plural };
