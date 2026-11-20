// Home view model (plan §4 Screen 1). Pure: data + London date in, everything the page renders out.
import type { CommandData, Commitment, IconName } from "./model.ts";
import { diffCalendarDays, formatDue, formatShortDate, isUrgent, plural, status, STATUS_LABEL, type Status } from "./status.ts";

export type Tone = "red" | "orange" | "amber" | "blue" | "grey" | "green" | "mute";

export interface HomeRow {
  ref?: { kind: "obligation" | "commitment" | "email"; id: string; templateCode?: string };
  icon: IconName;
  tone: Tone;
  title: string;
  sub: string;
  actions: string[];
  when: string;
  whenTone: Tone;
}

export interface UpcomingRow extends HomeRow {
  days: number;
  badge: { kind: "pill"; cls: Status; label: string } | { kind: "tag"; label: string };
}

export interface HomeView {
  urgent: HomeRow[];
  kpis: Array<{ label: string; icon: IconName; accent: string; num: number; meta: string }>;
  upcoming: Array<{ label: string; rows: UpcomingRow[] }>;
  accountability: Array<{ label: string; initials: string; style: { background: string; color: string }; count: number; note: string; late: boolean; bar: string }>;
  meetings: CommandData["meetings"];
  drafts: CommandData["drafts"];
  overdueCount: number;
}

const STALLED_DAYS = 5;

const toneOf = (s: Status): Tone =>
  ({ overdue: "red", urgent: "orange", soon: "amber", early: "blue", missing: "grey", current: "green", done: "green", na: "mute" } as const)[s];

const sinceChased = (c: Commitment, today: string) => (c.lastChasedAt ? diffCalendarDays(today, c.lastChasedAt) : 0);

export function buildHome(data: CommandData, today: string): HomeView {
  const { compliance, commitments, emails, milestones, meetings, drafts } = data;
  const daysTo = (iso: string) => diffCalendarDays(iso, today);

  // Urgent now: compliance (one rule: isUrgent), late promises, stalled external items, emails needing reply.
  // Most overdue first; items with no date recorded after the dated ones.
  const byDue = (a: { dueDate?: string }, b: { dueDate?: string }) =>
    a.dueDate && b.dueDate ? a.dueDate.localeCompare(b.dueDate) : a.dueDate ? -1 : b.dueDate ? 1 : 0;
  const urgentCompliance: HomeRow[] = compliance
    .filter((o) => isUrgent(o, today, o))
    .sort(byDue)
    .map((o) => {
      const s = status(o, today);
      return {
        ref: { kind: "obligation", id: o.id, templateCode: o.templateCode },
        icon: o.icon, tone: toneOf(s), title: o.label, sub: `${o.where} · ${o.landlord}`, actions: o.actions,
        when: o.dueDate ? formatDue(daysTo(o.dueDate)) : "no date recorded", whenTone: toneOf(s),
      };
    });

  const latePromises: HomeRow[] = commitments
    .filter((c) => c.owner === "you" && c.dueDate && daysTo(c.dueDate) < 0)
    .map((c) => ({ ref: { kind: "commitment", id: c.id }, icon: "list", tone: "red", title: c.title, sub: c.context, actions: ["Done"], when: `${plural(-daysTo(c.dueDate!), "day")} late`, whenTone: "red" }));

  const stalled: HomeRow[] = commitments
    .filter((c) => c.owner !== "you" && sinceChased(c, today) > STALLED_DAYS)
    .map((c) => ({ ref: { kind: "commitment", id: c.id }, icon: "clock", tone: "amber", title: c.title, sub: `${c.context} · last chased ${formatShortDate(c.lastChasedAt!)}`, actions: ["Log chase"], when: `${plural(sinceChased(c, today), "day")} silent`, whenTone: "red" }));

  const needsReply: HomeRow[] = emails
    .filter((e) => diffCalendarDays(today, e.loggedOn) >= 1)
    .map((e) => ({ ref: { kind: "email", id: e.id }, icon: "mail", tone: "amber", title: e.subject, sub: `${e.context} · logged ${formatShortDate(e.loggedOn)}`, actions: ["Turn into action"], when: plural(diffCalendarDays(today, e.loggedOn), "day"), whenTone: "amber" }));

  const urgent = [...urgentCompliance, ...latePromises, ...stalled, ...needsReply];

  // KPIs.
  const open = compliance.filter((o) => !o.satisfiedAt && !o.isNotApplicable);
  const dueIn30 = open.filter((o) => o.dueDate && daysTo(o.dueDate) >= 0 && daysTo(o.dueDate) <= 30);
  const missing = compliance.filter((o) => status(o, today) === "missing");
  const missingClient = missing.filter((o) => o.scope === "client").length;
  const waiting = commitments.filter((c) => c.owner !== "you");
  const kpis: HomeView["kpis"] = [
    { label: "Urgent / overdue", icon: "alert", accent: "var(--overdue)", num: urgent.length, meta: `${urgentCompliance.length} compliance · ${latePromises.length + stalled.length} actions · ${plural(needsReply.length, "email")}` },
    { label: "Due ≤ 30 days", icon: "clock", accent: "var(--soon)", num: dueIn30.length, meta: `across ${new Set(dueIn30.map((o) => o.where)).size} properties` },
    { label: "Missing required", icon: "file", accent: "var(--missing)", num: missing.length, meta: `${missingClient} client · ${missing.length - missingClient} property` },
    { label: "Drafts to review", icon: "mail", accent: "var(--green)", num: drafts.length, meta: "in the Email Centre" },
    { label: "Waiting on others", icon: "users", accent: "var(--early)", num: waiting.length, meta: `${stalled.length} stalled > ${STALLED_DAYS} days` },
  ];

  // Coming up: everything dated beyond the urgent window, filtered by horizon in the browser.
  const upcomingCompliance: UpcomingRow[] = open
    .filter((o) => o.dueDate && !isUrgent(o, today, o) && daysTo(o.dueDate) <= 60)
    .map((o) => {
      const s = status(o, today);
      return {
        icon: o.icon, tone: toneOf(s), title: o.label, sub: `${o.where} · ${o.landlord}`, actions: [],
        when: formatShortDate(o.dueDate!), whenTone: toneOf(s), days: daysTo(o.dueDate!), badge: { kind: "pill", cls: s, label: STATUS_LABEL[s] },
      };
    });
  const upcomingTenancy: UpcomingRow[] = milestones
    .filter((m) => daysTo(m.date) >= 0 && daysTo(m.date) <= 60)
    .map((m) => ({ icon: m.icon, tone: "green", title: m.label, sub: m.context, actions: [], when: formatShortDate(m.date), whenTone: "mute", days: daysTo(m.date), badge: { kind: "tag", label: m.tag } }));
  const upcomingPromises: UpcomingRow[] = commitments
    .filter((c) => c.owner === "you" && c.dueDate && daysTo(c.dueDate) >= 0 && daysTo(c.dueDate) <= 60)
    .map((c) => ({ icon: "list", tone: "blue", title: c.title, sub: c.context, actions: [], when: formatShortDate(c.dueDate!), whenTone: "mute", days: daysTo(c.dueDate!), badge: { kind: "tag", label: "Action" } }));
  const byDays = (a: UpcomingRow, b: UpcomingRow) => a.days - b.days;

  // Accountability: who owns the next move.
  const groups = [
    { key: "you", label: "You", initials: "TO", style: { background: "var(--navy)", color: "#fff" }, bar: "var(--navy)" },
    { key: "landlord", label: "Landlords", initials: "LL", style: { background: "#E8ECF4", color: "var(--navy)" }, bar: "#9AA9C4" },
    { key: "contractor", label: "Contractors", initials: "CT", style: { background: "var(--soon-bg)", color: "var(--soon)" }, bar: "#E0B969" },
    { key: "tenant", label: "Tenants", initials: "TN", style: { background: "var(--green-tint)", color: "var(--green)" }, bar: "#8DB596" },
  ] as const;
  const accountability = groups.map((g) => {
    const items = commitments.filter((c) => c.owner === g.key);
    const late = g.key === "you"
      ? items.filter((c) => c.dueDate && daysTo(c.dueDate) < 0).length
      : items.filter((c) => sinceChased(c, today) > STALLED_DAYS).length;
    const note = late ? `${late} ${g.key === "you" ? "late" : "stalled"}` : "on track";
    return { label: g.label, initials: g.initials, style: g.style, count: items.length, note, late: late > 0, bar: g.bar };
  });

  return {
    urgent,
    kpis,
    upcoming: [
      { label: "Compliance", rows: upcomingCompliance.sort(byDays) },
      { label: "Tenancy & visits", rows: upcomingTenancy.sort(byDays) },
      { label: "Your actions", rows: upcomingPromises.sort(byDays) },
    ],
    accountability,
    meetings,
    drafts,
    overdueCount: compliance.filter((o) => status(o, today) === "overdue").length,
  };
}
