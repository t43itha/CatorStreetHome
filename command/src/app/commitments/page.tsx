import Link from "next/link";
import { Shell } from "@/components/Shell.tsx";
import { Icon } from "@/components/Icons.tsx";
import { Act } from "@/components/Act.tsx";
import { ActionsTabs } from "@/components/ActionsTabs.tsx";
import { NewAction } from "@/components/forms.tsx";
import { api, read } from "@/lib/data.ts";
import { diffCalendarDays, formatShortDate, todayLondon } from "@/lib/status.ts";

type A = Awaited<ReturnType<typeof read<typeof api.views.actions>>>[number];
const OWNER = { you: { label: "You (CSPS)", bg: "var(--navy)", i: "TO" }, landlord: { label: "Landlords", bg: "#5A6E96", i: "LL" }, contractor: { label: "Contractors", bg: "#A15C07", i: "CT" }, tenant: { label: "Tenants", bg: "#5B8C66", i: "TN" } } as const;
const SOURCE_ICON = { meeting: "cal", email: "mail", compliance: "shield", manual: "list" } as const;
const STALLED = 5;

function Task({ a, today }: { a: A; today: string }) {
  const days = a.dueDate ? diffCalendarDays(a.dueDate, today) : undefined;
  const done = a.status === "done";
  return (
    <div className="task" style={done ? { opacity: 0.7 } : undefined}>
      <div className="t" style={done ? { textDecoration: "line-through", textDecorationColor: "var(--ink-mute)" } : undefined}>{a.title}</div>
      {!done && <div className="ctx">{a.clientName ?? a.details ?? ""}</div>}
      <div className="f">
        <span className="src"><Icon name={SOURCE_ICON[a.sourceType ?? "manual"]} />{done ? formatShortDate(a.completedAt ?? today) : (a.sourceType ?? "manual")[0].toUpperCase() + (a.sourceType ?? "manual").slice(1)}</span>
        {!done && <span className="due" style={{ color: days !== undefined && days < 0 ? "var(--overdue)" : days !== undefined && days <= 2 ? "var(--urgent)" : undefined }}>{days === undefined ? "" : days < 0 ? `${-days}d late` : formatShortDate(a.dueDate!)}</span>}
        <span className="owner" style={{ background: OWNER[a.ownerType].bg }} title={OWNER[a.ownerType].label}>{OWNER[a.ownerType].i}</span>
      </div>
      {!done && <div className="f">{a.ownerType === "you"
        ? <Act fn="commitments:complete" args={{ id: a.id }} label="Done" done="Action marked done" />
        : <Act fn="commitments:logChase" args={{ id: a.id }} label="Log chase" done="Chase logged" />}</div>}
    </div>
  );
}

function Column({ title, items, today, colour, bg }: { title: string; items: A[]; today: string; colour?: string; bg?: string }) {
  return (
    <div className="col" style={bg ? { background: bg } : undefined}>
      <div className="col-h"><span style={colour ? { color: colour } : undefined}>{title}</span><span className="c">{items.length}</span></div>
      {items.map((a) => <Task key={a.id} a={a} today={today} />)}
    </div>
  );
}

export default async function ActionsPage() {
  const today = todayLondon();
  const all = await read(api.views.actions, {});
  const open = all.filter((a) => a.status !== "done");
  const due = (a: A) => (a.dueDate ? diffCalendarDays(a.dueDate, today) : Infinity);
  const silent = (a: A) => (a.lastChasedAt ? diffCalendarDays(today, a.lastChasedAt) : 0);
  const waiting = open.filter((a) => a.ownerType !== "you").sort((a, b) => silent(b) - silent(a));
  const doneThisWeek = all.filter((a) => a.status === "done" && a.completedAt && diffCalendarDays(today, a.completedAt) <= 7);

  return (
    <Shell active="actions">
      <div className="page-head">
        <div><span className="eyebrow">Follow-through</span><h1 className="page">Actions</h1><p className="lede">Everything promised in meetings, emails and compliance checks — with one owner and one date.</p></div>
        <NewAction text={<><Icon name="plus" />New action</>} />
      </div>
      <ActionsTabs
        counts={{ open: open.length, waiting: waiting.length }}
        board={<>
          <Column title="Overdue" colour="var(--overdue)" items={open.filter((a) => due(a) < 0)} today={today} />
          <Column title="This week" items={open.filter((a) => due(a) >= 0 && due(a) <= 7)} today={today} />
          <Column title="Later / no date" items={open.filter((a) => due(a) > 7).sort((a, b) => due(a) - due(b))} today={today} />
          <Column title="Done this week" colour="var(--green)" bg="#EEF3EF" items={doneThisWeek} today={today} />
        </>}
        waiting={<div className="scroll-x"><table className="wtable">
          <thead><tr><th>Waiting for</th><th>From</th><th>Client</th><th>Silent for</th><th>Last chase</th><th></th></tr></thead>
          <tbody>
            {waiting.length === 0 && <tr><td colSpan={6} style={{ color: "var(--ink-mute)" }}>Nobody owes you anything.</td></tr>}
            {waiting.map((a) => {
              const s = silent(a);
              const colour = s > STALLED ? "var(--overdue)" : s >= 2 ? "var(--soon)" : "var(--early)";
              return (
                <tr key={a.id}>
                  <td><b>{a.title}</b></td>
                  <td>{a.waitingOn ?? OWNER[a.ownerType].label} <span className="tag" style={{ marginLeft: 4 }}>{a.ownerType[0].toUpperCase() + a.ownerType.slice(1)}</span></td>
                  <td>{a.clientId ? <Link href={`/clients/${a.clientId}`}>{a.clientName}</Link> : a.details ?? "—"}</td>
                  <td><div className="stale"><div className="bar"><span style={{ width: `${Math.min(100, s * 10)}%`, background: colour }} /></div><b style={{ color: s > STALLED ? "var(--overdue)" : undefined }}>{s === 0 ? "Today" : `${s} day${s === 1 ? "" : "s"}`}</b></div></td>
                  <td>{a.lastChasedAt ? formatShortDate(a.lastChasedAt) : "—"}</td>
                  <td><Act fn="commitments:logChase" args={{ id: a.id }} label="Log chase" done="Chase logged · timer reset" /></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>}
        owner={<>{(Object.keys(OWNER) as Array<keyof typeof OWNER>).map((k) => <Column key={k} title={OWNER[k].label} items={open.filter((a) => a.ownerType === k)} today={today} />)}</>}
      />
    </Shell>
  );
}
