// Pure rules from plan Step 1.2: UK-safe dates, next obligations after evidence, scheduler gate.
// Calendar dates are ISO YYYY-MM-DD; no function here reads the machine's time zone.
import { addDays, diffCalendarDays } from "./status.ts";

// ---- Calendar helpers (integer arithmetic, Howard Hinnant's days-from-civil) ----

function daysFromCivil(y: number, m: number, d: number): number {
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function civilFromDays(z: number): string {
  z += 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function isoIfValid(y: number, m: number, d: number): string | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1) return null;
  const iso = civilFromDays(daysFromCivil(y, m, d));
  return iso === `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` ? iso : null;
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12), nm = (total % 12) + 1;
  const lastDay = Number(civilFromDays(daysFromCivil(nm === 12 ? ny + 1 : ny, nm === 12 ? 1 : nm + 1, 1) - 1).slice(8));
  return isoIfValid(ny, nm, Math.min(d, lastDay))!;
}

// ---- Importer dates (plan Screen 7) ----

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Strict UK parser: dd/mm/yyyy (also - or .), d Mmm yyyy / d Month yyyy, or ISO. Never US order. */
export function parseUkDate(text: string): string | null {
  const s = text.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return isoIfValid(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (m) return isoIfValid(+m[3], +m[2], +m[1]);
  m = /^(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})$/.exec(s);
  if (m) {
    const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
    const fullOk = m[2].length === 3 || "january february march april may june july august september october november december".split(" ").includes(m[2].toLowerCase()) || m[2].toLowerCase() === "sept";
    return month && fullOk ? isoIfValid(+m[3], month, +m[1]) : null;
  }
  return null;
}

/** Excel 1900 date serial → ISO date, by integer arithmetic. Keeps Excel's fake 29 Feb 1900 (serial 60) out. */
export function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1) return null;
  const whole = Math.floor(serial);
  if (whole === 60) return null; // 29 Feb 1900 does not exist
  const base = daysFromCivil(1899, 12, 31);
  return civilFromDays(base + (whole > 60 ? whole - 1 : whole));
}

// ---- Evidence → next obligations (plan §5.1) ----

export interface EvidenceInput {
  issueDate?: string;
  expiryDate?: string;
  outcome?: "satisfactory" | "unsatisfactory";
  reportRemedialDate?: string;
  rightType?: "unlimited" | "time_limited";
  followUpDate?: string;
}

export interface NextObligation {
  templateCode: string;
  kind: "renewal" | "remedial" | "follow_up" | "schedule";
  dueDate?: string;
}

export const REMEDIAL_DAYS = 28;

export function nextObligations(
  satisfied: { templateCode: string; kind: "renewal" | "event" | "remedial" | "follow_up" | "schedule"; intervalMonths?: number },
  evidence: EvidenceInput,
): NextObligation[] {
  const next: NextObligation[] = [];
  if (satisfied.kind === "renewal" && evidence.expiryDate) {
    next.push({ templateCode: satisfied.templateCode, kind: "renewal", dueDate: evidence.expiryDate });
  }
  if (satisfied.templateCode === "eicr" && evidence.outcome === "unsatisfactory" && evidence.issueDate) {
    const statutory = addDays(evidence.issueDate, REMEDIAL_DAYS);
    const sooner = evidence.reportRemedialDate && diffCalendarDays(evidence.reportRemedialDate, statutory) < 0;
    next.push({ templateCode: "eicr_remedial", kind: "remedial", dueDate: sooner ? evidence.reportRemedialDate : statutory });
  }
  if (satisfied.templateCode === "rtr" && evidence.rightType === "time_limited") {
    // The follow-up date is required; without it the obligation has no due date and shows Missing.
    next.push({ templateCode: "rtr_follow_up", kind: "follow_up", dueDate: evidence.followUpDate });
  }
  if (satisfied.kind === "schedule" && evidence.issueDate) {
    next.push({ templateCode: satisfied.templateCode, kind: "schedule", dueDate: addMonths(evidence.issueDate, satisfied.intervalMonths ?? 6) });
  }
  return next;
}

// ---- Scheduler gate (plan §7.3) ----

export type Job = "scan" | "digest";

function londonClock(now: Date): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/** Run `job` when London time has passed its configured HH:mm and it has not run on this London date. */
export function shouldRun(job: Job, now: Date, settings: Record<Job, string>, jobRuns: Array<{ job: Job; londonDate: string }>): boolean {
  const { date, minutes } = londonClock(now);
  const [h, m] = settings[job].split(":").map(Number);
  return minutes >= h * 60 + m && !jobRuns.some((r) => r.job === job && r.londonDate === date);
}
