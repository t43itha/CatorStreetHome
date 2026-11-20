import Link from "next/link";
import { connection } from "next/server";
import { ComingUp } from "@/components/ComingUp.tsx";
import { Icon } from "@/components/Icons.tsx";
import { Act } from "@/components/Act.tsx";
import { RecordEvidence } from "@/components/forms.tsx";
import type { HomeRow } from "@/lib/home.ts";
import { Shell } from "@/components/Shell.tsx";
import { api, getCommandData, read } from "@/lib/data.ts";
import { buildHome } from "@/lib/home.ts";
import { plural, todayLondon } from "@/lib/status.ts";

const KPI_LINK: Record<string, string> = { "Drafts to review": "/emails", "Waiting on others": "/commitments", "Missing required": "/properties", "Due ≤ 30 days": "/properties" };

const DRAFT_COLOUR = { overdue: "var(--overdue)", urgent: "var(--urgent)", soon: "var(--soon)" } as const;

function RowActions({ row }: { row: HomeRow }) {
  const ref = row.ref;
  if (!ref) return null;
  if (ref.kind === "obligation") return (<>
    {row.actions.includes("Draft email") && <Link className="btn btn-ghost btn-sm" href="/emails">Draft email</Link>}
    <RecordEvidence obligationId={ref.id} templateCode={ref.templateCode!} label={row.title} />
  </>);
  if (ref.kind === "email") return <Act fn="emails:turnIntoAction" args={{ id: ref.id }} label="Turn into action" done="Action created" />;
  return row.actions.includes("Done")
    ? <Act fn="commitments:complete" args={{ id: ref.id }} label="Done" done="Action marked done" />
    : <Act fn="commitments:logChase" args={{ id: ref.id }} label="Log chase" done="Chase logged" />;
}

function londonHeader(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "numeric", hourCycle: "h23" }).format(now));
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long", year: "numeric" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    date: `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}`,
    greeting: hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
  };
}

export default async function HomePage() {
  await connection();
  const now = new Date();
  const today = todayLondon(now);
  const [data, onboarding] = await Promise.all([getCommandData(today), read(api.views.onboardingInProgress, { today })]);
  const view = buildHome(data, today);
  const { date, greeting } = londonHeader(now);
  const n = view.urgent.length;

  return (
    <Shell active="home">
      <div className="page-head">
        <div>
          <span className="eyebrow">{date}</span>
          <h1 className="page">{greeting}, <em>Tabitha.</em></h1>
          <p className="lede">
            <b>{n === 1 ? "1 thing needs" : `${n} things need`} you today.</b>{" "}
            {plural(view.overdueCount, "certificate")} overdue and {plural(view.drafts.length, "renewal draft")} waiting for review.
          </p>
        </div>
        <button className="btn btn-ghost" disabled title="The morning digest is sent by email from Phase 2">
          <Icon name="mail" />Today&apos;s digest
        </button>
      </div>

      <div className="kpis">
        {view.kpis.map((k) => (
          <Link className="kpi" href={KPI_LINK[k.label] ?? "/"} key={k.label} style={{ "--accent": k.accent } as React.CSSProperties}>
            <div className="lbl"><Icon name={k.icon} style={{ color: k.accent }} />{k.label}</div>
            <div className="num">{k.num}</div>
            <div className="meta">{k.meta}</div>
          </Link>
        ))}
      </div>

      <div className="home-grid">
        <div className="stack">
          <div className="card">
            <div className="card-head">
              <div>
                <h2 className="card-title">Urgent now <span className="pill overdue">{n}</span></h2>
                <div className="sub">Lapsed, due within 7 days, missing on a let property, or promised and late</div>
              </div>
            </div>
            <div className="rows">
              {view.urgent.map((r) => (
                <div className="row" key={`${r.title}|${r.sub}`}>
                  <div className={`ico ${r.tone}`}><Icon name={r.icon} /></div>
                  <div><div className="t">{r.title}</div><div className="s">{r.sub}</div></div>
                  <div className="acts"><RowActions row={r} /></div>
                  <div className={`when ${r.whenTone}`}>{r.when}</div>
                </div>
              ))}
            </div>
          </div>

          <ComingUp sections={view.upcoming} />
        </div>

        <div className="stack">
          {onboarding.length > 0 && (
            <div className="card">
              <div className="card-head"><div><h2 className="card-title">Onboarding in progress</h2><div className="sub">Resume where you left off</div></div></div>
              {onboarding.map((o) => (
                <Link className="draft-mini" key={o.id} href={o.href}>
                  <Icon name={o.kind === "client" ? "users" : "building"} style={{ color: o.days > 14 ? "var(--overdue)" : "var(--soon)" }} />
                  <div><div className="t">{o.name}</div><div className="s">{o.sub} · next: {o.step} · {o.days} day{o.days === 1 ? "" : "s"}</div></div>
                </Link>
              ))}
            </div>
          )}
          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Today</h2><div className="sub">Meetings</div></div></div>
            {view.meetings.map((m) => (
              <div className="meeting" key={m.time + m.title}>
                <div className="time">{m.time}</div>
                <div>
                  <div className="t"><Link href={`/meetings/${m.id}`}>{m.title}</Link></div>
                  <div className="s">{m.context}</div>
                  {m.teams && <span className="teams"><Icon name="chat" style={{ width: 12, height: 12 }} />{m.teams}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Accountability</h2><div className="sub">Open items by who owns the next move</div></div></div>
            {view.accountability.map((a) => (
              <div className="acc" key={a.label}>
                <div className="who"><span className="mini" style={a.style}>{a.initials}</span>{a.label}</div>
                <span className={a.late ? "late" : "ok"}>{a.note}</span>
                <span className="n">{a.count}</span>
              </div>
            ))}
            <div style={{ padding: "6px 20px 18px" }}>
              <div className="bar">
                {view.accountability.map((a) => (
                  <span key={a.label} style={{ flexGrow: a.count, background: a.bar }} />
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div><h2 className="card-title">Drafts ready</h2><div className="sub">Reminder drafts waiting for your review</div></div><Link className="btn-link" href="/emails">Review <Icon name="arrow" /></Link></div>
            {view.drafts.map((d) => (
              <div className="draft-mini" key={d.title + d.to}>
                <Icon name="mail" style={{ color: DRAFT_COLOUR[d.tone] }} />
                <div><div className="t">{d.title}</div><div className="s">To {d.to}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
