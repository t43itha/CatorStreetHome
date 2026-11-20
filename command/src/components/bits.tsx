// Small presentational pieces shared by the directory and detail screens.
import { formatShortDate, STATUS_LABEL, type Status } from "@/lib/status.ts";

export interface Health { overdue: number; urgent: number; soon: number; early: number; missing: number; current: number; done: number; na: number; good: number; applicable: number; worst: { label: string; status: Status; dueDate?: string } | null }

export function HealthBar({ h }: { h: Health }) {
  const parts = [
    { n: h.good, c: "var(--green)" }, { n: h.overdue + h.urgent, c: "var(--urgent)" }, { n: h.soon, c: "var(--soon)" },
    { n: h.early, c: "var(--early)" }, { n: h.missing, c: "#C9CDD3" },
  ];
  return <div className="bar">{parts.map((p, i) => <span key={i} style={{ flexGrow: p.n, background: p.c }} />)}</div>;
}

export function healthText(h: Health) {
  const bits = [`${h.good} of ${h.applicable} current`];
  if (h.overdue) bits.push(`${h.overdue} overdue`);
  if (h.urgent) bits.push(`${h.urgent} urgent`);
  if (h.soon) bits.push(`${h.soon} due soon`);
  if (h.missing) bits.push(`${h.missing} missing`);
  return bits.join(" · ");
}

export function WorstPill({ h }: { h: Health }) {
  if (!h.worst || h.worst.status === "current") return <span className="pill current">Compliant</span>;
  const w = h.worst;
  return <span className={`pill ${w.status}`}>{w.label.split(" (")[0]}{w.dueDate ? ` · ${formatShortDate(w.dueDate)}` : ` · ${STATUS_LABEL[w.status]}`}</span>;
}

export const initials = (name: string) => name.split(/\s+|&/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
