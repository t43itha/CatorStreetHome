import { Fragment } from "react";
import type { ComplianceItem } from "@/lib/model.ts";
import { addDays, diffCalendarDays, status, STATUS_LABEL, type Status } from "@/lib/status.ts";
import { Icon } from "./Icons.tsx";

// Property compliance matrix (plan §4 Screen 3). Every pill comes from status(); nothing is hard-coded.

const REMIND_BEFORE_DAYS = 14;
const MATRIX_ACTIONS: Record<Status, string[]> = {
  overdue: ["Draft", "Renewed"], urgent: ["Draft", "Renewed"], soon: ["Remind"], early: ["Remind"],
  current: ["History"], done: [], missing: ["Add"], na: ["Edit"],
};
const DATED: Status[] = ["overdue", "urgent", "soon", "early"];

function longDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

function pillLabel(s: Status, days: number | undefined) {
  if (!DATED.includes(s) || days === undefined) return STATUS_LABEL[s];
  return days < 0 ? `${-days} days overdue` : `${days} days`;
}

export function ComplianceScore({ rows, today }: { rows: ComplianceItem[]; today: string }) {
  const statuses = rows.map((r) => status(r, today)).filter((s) => s !== "na");
  const count = (...ss: Status[]) => statuses.filter((s) => ss.includes(s)).length;
  const good = count("current", "done");
  const bands = [
    { n: good, colour: "var(--green)" },
    { n: count("overdue", "urgent"), colour: "var(--urgent)", label: "urgent" },
    { n: count("soon"), colour: "var(--soon)", label: "due soon" },
    { n: count("early"), colour: "var(--early)", label: "early warning" },
    { n: count("missing"), colour: "#C9CDD3", label: "missing" },
  ];
  return (
    <div className="score">
      <span className="big">{good}<span style={{ fontSize: 18, color: "var(--ink-mute)" }}>/{statuses.length}</span></span>
      <div>
        <div className="bar">{bands.map((b, k) => <span key={k} style={{ flexGrow: b.n, background: b.colour }} />)}</div>
        <small style={{ fontSize: 11.5, color: "var(--ink-mute)" }}>
          {["current", ...bands.filter((b) => b.label && b.n).map((b) => `${b.n} ${b.label}`)].join(" · ")}
        </small>
      </div>
    </div>
  );
}

export function ComplianceRows({ rows, today }: { rows: ComplianceItem[]; today: string }) {
  const groups = [...new Set(rows.map((r) => r.matrix!.group))];
  return (
    <tbody>
      {groups.map((g) => (
        <Fragment key={g}>
          <tr className="grp"><td colSpan={7}>{g}</td></tr>
          {rows.filter((r) => r.matrix!.group === g).map((r) => {
            const s = status(r, today);
            const open = !r.satisfiedAt && !r.isNotApplicable;
            const days = r.dueDate ? diffCalendarDays(r.dueDate, today) : undefined;
            const remind = open && r.dueDate ? addDays(r.dueDate, -REMIND_BEFORE_DAYS) : undefined;
            const remindPast = remind !== undefined && diffCalendarDays(remind, today) < 0;
            const m = r.matrix!;
            const mute = { color: "var(--ink-mute)" };
            return (
              <tr key={r.label}>
                <td><div className="dn">{r.label}</div><div className="dm">{m.meta}</div></td>
                <td><span className={`pill ${s}`}>{pillLabel(s, open ? days : undefined)}</span></td>
                <td className="num" style={m.expires || !open || !r.dueDate ? mute : undefined}>{m.expires ?? (open && r.dueDate ? longDate(r.dueDate) : "—")}</td>
                <td className="num" style={remindPast ? { color: "var(--overdue)", fontWeight: 600 } : remind ? undefined : mute}>{remind ? longDate(remind) : "—"}</td>
                <td>{m.file ? <a className="file"><Icon name="onedrive" style={{ width: 14 }} />{m.file}</a> : <span className="file none">{s === "missing" ? "Add link" : "—"}</span>}</td>
                <td className="resp">{m.owner}</td>
                <td><div className="row-acts">{MATRIX_ACTIONS[s].map((a) => <button key={a} className="btn btn-ghost btn-sm" disabled title="Actions arrive with the Convex data">{a}</button>)}</div></td>
              </tr>
            );
          })}
        </Fragment>
      ))}
    </tbody>
  );
}
